
import os, sqlite3, stripe
from flask import Flask, jsonify, request, send_file, render_template, g, redirect, url_for, session, abort
# pandas removed; using openpyxl instead
from openpyxl import Workbook
from datetime import date, datetime
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

APP_NAME = "Elara Go"

DB_PATH = os.path.join(os.path.dirname(__file__), "elara.db")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
STRIPE_PRICE_6MO = os.getenv("STRIPE_PRICE_6MO", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5000")
FLASK_SECRET = os.getenv("FLASK_SECRET", "dev-secret")

stripe.api_key = STRIPE_SECRET_KEY

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = FLASK_SECRET

def get_db():
    db = getattr(g, "_db", None)
    if db is None:
        db = g._db = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_db", None)
    if db is not None:
        db.close()

def dicts(rows):
    return [dict(r) for r in rows]

def ensure_columns(db):
    cols = {r["name"] for r in db.execute("PRAGMA table_info(users)").fetchall()}
    to_add = []
    if "stripe_customer_id" not in cols:
        to_add.append(("stripe_customer_id", "TEXT"))
    if "stripe_subscription_id" not in cols:
        to_add.append(("stripe_subscription_id", "TEXT"))
    if "plan_renewal" not in cols:
        to_add.append(("plan_renewal", "INTEGER"))
    for name, type_ in to_add:
        db.execute(f"ALTER TABLE users ADD COLUMN {name} {type_}")
    if to_add:
        db.commit()

def init_db():
    db = get_db()
    db.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password_hash TEXT,
            plan TEXT DEFAULT 'free',
            stripe_customer_id TEXT,
            stripe_subscription_id TEXT,
            plan_renewal INTEGER
        );
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            task TEXT NOT NULL,
            project TEXT,
            priority TEXT,
            due_date TEXT,
            status TEXT
        );
        CREATE TABLE IF NOT EXISTS habits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            habit TEXT NOT NULL,
            mon INTEGER, tue INTEGER, wed INTEGER, thu INTEGER, fri INTEGER, sat INTEGER, sun INTEGER
        );
        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            goal TEXT NOT NULL,
            action_steps TEXT,
            progress INTEGER
        );
        CREATE TABLE IF NOT EXISTS journal (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            jdate TEXT,
            mood TEXT,
            stress INTEGER,
            gratitude TEXT,
            highlight TEXT,
            notes TEXT
        );
        """
    )
    db.commit()
    ensure_columns(db)

@app.before_request
def ensure_db():
    init_db()

# -------- Auth helpers --------
def current_user_id():
    return session.get("uid")

def login_required(fn):
    from functools import wraps
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user_id():
            return redirect(url_for("login", next=request.path))
        return fn(*args, **kwargs)
    return wrapper

# -------- Pages --------
@app.route("/")
def home():
    return render_template("index.html", app_name=APP_NAME, publishable_key=STRIPE_PUBLISHABLE_KEY)

@app.route("/app")
@login_required
def dashboard_page():
    return render_template("dashboard.html", app_name=APP_NAME)

@app.route("/login", methods=["GET", "POST"])
def login():
    db = get_db()
    msg = None
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        row = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if row and check_password_hash(row["password_hash"], password):
            session["uid"] = row["id"]
            return redirect(request.args.get("next") or url_for("dashboard_page"))
        msg = "Invalid email or password"
    return render_template("login.html", app_name=APP_NAME, msg=msg)

@app.route("/signup", methods=["GET", "POST"])
def signup():
    db = get_db()
    msg = None
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        if not email or not password:
            msg = "Email and password required"
        else:
            try:
                db.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", (email, generate_password_hash(password)))
                db.commit()
                row = db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
                session["uid"] = row["id"]
                return redirect(url_for("dashboard_page"))
            except sqlite3.IntegrityError:
                msg = "Email already registered"
    return render_template("signup.html", app_name=APP_NAME, msg=msg)

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("home"))

# -------- API (scoped by user) --------
def uid_or_abort():
    uid = current_user_id()
    if not uid:
        abort(401)
    return uid

@app.route("/api/tasks", methods=["GET", "POST"])
def tasks():
    db = get_db()
    if request.method == "POST":
        uid = uid_or_abort()
        data = request.get_json(force=True)
        db.execute(
            "INSERT INTO tasks (user_id, task, project, priority, due_date, status) VALUES (?, ?, ?, ?, ?, ?)",
            (uid, data.get("task"), data.get("project"), data.get("priority"), data.get("due_date"), data.get("status", "Not Started")),
        )
        db.commit()
        return jsonify({"ok": True}), 201
    uid = uid_or_abort()
    rows = db.execute("SELECT * FROM tasks WHERE user_id=? ORDER BY due_date ASC, priority DESC", (uid,)).fetchall()
    return jsonify(dicts(rows))

@app.route("/api/tasks/<int:tid>", methods=["PUT", "DELETE"])
def task_item(tid):
    db = get_db()
    uid = uid_or_abort()
    if request.method == "PUT":
        data = request.get_json(force=True)
        db.execute(
            "UPDATE tasks SET task=?, project=?, priority=?, due_date=?, status=? WHERE id=? AND user_id=?",
            (data.get("task"), data.get("project"), data.get("priority"), data.get("due_date"), data.get("status"), tid, uid),
        )
        db.commit()
        return jsonify({"ok": True})
    db.execute("DELETE FROM tasks WHERE id=? AND user_id=?", (tid, uid))
    db.commit()
    return jsonify({"ok": True})

@app.route("/api/habits", methods=["GET", "POST"])
def habits():
    db = get_db()
    if request.method == "POST":
        uid = uid_or_abort()
        data = request.get_json(force=True)
        vals = (
            uid, data.get("habit"),
            data.get("mon",0), data.get("tue",0), data.get("wed",0),
            data.get("thu",0), data.get("fri",0), data.get("sat",0), data.get("sun",0)
        )
        db.execute(
            "INSERT INTO habits (user_id, habit, mon, tue, wed, thu, fri, sat, sun) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            vals
        )
        db.commit()
        return jsonify({"ok": True}), 201
    uid = uid_or_abort()
    rows = db.execute("SELECT * FROM habits WHERE user_id=?", (uid,)).fetchall()
    return jsonify(dicts(rows))

@app.route("/api/habits/<int:hid>", methods=["PUT", "DELETE"])
def habit_item(hid):
    db = get_db()
    uid = uid_or_abort()
    if request.method == "PUT":
        data = request.get_json(force=True)
        db.execute(
            "UPDATE habits SET habit=?, mon=?, tue=?, wed=?, thu=?, fri=?, sat=?, sun=? WHERE id=? AND user_id=?",
            (data.get("habit"), data.get("mon",0), data.get("tue",0), data.get("wed",0),
             data.get("thu",0), data.get("fri",0), data.get("sat",0), data.get("sun",0), hid, uid)
        )
        db.commit()
        return jsonify({"ok": True})
    db.execute("DELETE FROM habits WHERE id=? AND user_id=?", (hid, uid))
    db.commit()
    return jsonify({"ok": True})

@app.route("/api/goals", methods=["GET", "POST"])
def goals():
    db = get_db()
    if request.method == "POST":
        uid = uid_or_abort()
        data = request.get_json(force=True)
        db.execute(
            "INSERT INTO goals (user_id, goal, action_steps, progress) VALUES (?, ?, ?)",
            (uid, data.get("goal"), data.get("action_steps"), int(data.get("progress", 0))),
        )
        db.commit()
        return jsonify({"ok": True}), 201
    uid = uid_or_abort()
    rows = db.execute("SELECT * FROM goals WHERE user_id=?", (uid,)).fetchall()
    return jsonify(dicts(rows))

@app.route("/api/goals/<int:gid>", methods=["PUT", "DELETE"])
def goal_item(gid):
    db = get_db()
    uid = uid_or_abort()
    if request.method == "PUT":
        data = request.get_json(force=True)
        db.execute(
            "UPDATE goals SET goal=?, action_steps=?, progress=? WHERE id=? AND user_id=?",
            (data.get("goal"), data.get("action_steps"), int(data.get("progress", 0)), gid, uid)
        )
        db.commit()
        return jsonify({"ok": True})
    db.execute("DELETE FROM goals WHERE id=? AND user_id=?", (gid, uid))
    db.commit()
    return jsonify({"ok": True})

@app.route("/api/journal", methods=["GET", "POST"])
def journal():
    db = get_db()
    if request.method == "POST":
        uid = uid_or_abort()
        data = request.get_json(force=True)
        db.execute(
            "INSERT INTO journal (user_id, jdate, mood, stress, gratitude, highlight, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (uid, data.get("date"), data.get("mood"), int(data.get("stress",0)), data.get("gratitude"), data.get("highlight"), data.get("notes"))
        )
        db.commit()
        return jsonify({"ok": True}), 201
    uid = uid_or_abort()
    rows = db.execute("SELECT * FROM journal WHERE user_id=? ORDER BY jdate DESC", (uid,)).fetchall()
    return jsonify(dicts(rows))

@app.route("/api/summary")
def summary():
    db = get_db()
    uid = uid_or_abort()
    rows = db.execute("SELECT COUNT(*) c FROM tasks WHERE user_id=? AND due_date = date('now') AND status != 'Completed'", (uid,)).fetchone()
    tasks_due_today = rows["c"] if rows else 0
    hrows = db.execute("SELECT mon+tue+wed+thu+fri+sat+sun AS total FROM habits WHERE user_id=?", (uid,)).fetchall()
    habits_completed = sum([r["total"] for r in hrows]) if hrows else 0
    grows = db.execute("SELECT COUNT(*) c FROM goals WHERE user_id=? AND progress > 0 AND progress < 100", (uid,)).fetchone()
    goals_in_progress = grows["c"] if grows else 0
    srows = db.execute("SELECT AVG(stress) a FROM journal WHERE user_id=?", (uid,)).fetchone()
    avg_stress = round(srows["a"], 1) if srows and srows["a"] is not None else 0
    return jsonify({
        "Tasks Due Today": tasks_due_today,
        "Habits Completed This Week": habits_completed,
        "Goals In Progress": goals_in_progress,
        "Avg. Stress Level": avg_stress
    })

# -------- Export --------
@app.route("/export")
@login_required
def export_excel():
    db = get_db()
    uid = current_user_id()
    tasks_df = pd.read_sql_query("SELECT id as ID, task as Task, project as Project, priority as Priority, due_date as 'Due Date', status as Status FROM tasks WHERE user_id=?", db, params=(uid,))
    habits_df = pd.read_sql_query("SELECT habit as Habit, mon as Mon, tue as Tue, wed as Wed, thu as Thu, fri as Fri, sat as Sat, sun as Sun FROM habits WHERE user_id=?", db, params=(uid,))
    goals_df = pd.read_sql_query("SELECT goal as 'Goal', action_steps as 'Action Steps', progress as 'Progress %' FROM goals WHERE user_id=?", db, params=(uid,))
    journal_df = pd.read_sql_query("SELECT jdate as Date, mood as Mood, stress as 'Stress Level (1-10)', gratitude as Gratitude, highlight as \"Today's Highlight\", notes as 'Reflection/Notes' FROM journal WHERE user_id=?", db, params=(uid,))
    from flask import current_app
    with current_app.test_request_context():
        session["uid"] = uid
        summary_json = current_app.view_functions['summary']().json
    import pandas as p2
    summary_df = p2.DataFrame({"Metric": list(summary_json.keys()), "Value": list(summary_json.values())})
    out_path = os.path.join(os.path.dirname(__file__), "ElaraGo_Dashboard.xlsx")
    with pd.ExcelWriter(out_path, engine="openpyxl") as writer:
        tasks_df.to_excel(writer, sheet_name="Tasks", index=False)
        habits_df.to_excel(writer, sheet_name="Habits", index=False)
        goals_df.to_excel(writer, sheet_name="Goals", index=False)
        journal_df.to_excel(writer, sheet_name="Daily Journal", index=False)
        summary_df.to_excel(writer, sheet_name="Dashboard Summary", index=False)
    return send_file(out_path, as_attachment=True)

# -------- Stripe: Checkout + Webhook + Billing --------
@app.route("/checkout/6month", methods=["POST"])
@login_required
def checkout_6month():
    if not STRIPE_SECRET_KEY or not STRIPE_PRICE_6MO:
        return jsonify({"error":"Stripe not configured"}), 500
    uid = current_user_id()
    db = get_db()
    user = db.execute("SELECT email, stripe_customer_id FROM users WHERE id=?", (uid,)).fetchone()
    customer = user["stripe_customer_id"]
    if not customer:
        cust = stripe.Customer.create(email=user["email"])
        customer = cust.id
        db.execute("UPDATE users SET stripe_customer_id=? WHERE id=?", (customer, uid))
        db.commit()
    session_obj = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": STRIPE_PRICE_6MO, "quantity": 1}],
        customer=customer,
        allow_promotion_codes=True,
        success_url=f"{APP_BASE_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{APP_BASE_URL}/checkout/cancel",
        client_reference_id=str(uid),
    )
    return jsonify({"url": session_obj.url})

@app.route("/checkout/success")
def checkout_success():
    return render_template("success.html", app_name=APP_NAME, publishable_key=STRIPE_PUBLISHABLE_KEY)

@app.route("/checkout/cancel")
def checkout_cancel():
    return render_template("cancel.html", app_name=APP_NAME)

@app.route("/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.data
    sig = request.headers.get("Stripe-Signature", None)
    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
        else:
            event = stripe.Event.construct_from(request.get_json(force=True), stripe.api_key)
    except Exception as e:
        return str(e), 400

    db = get_db()

    if event["type"] == "checkout.session.completed":
        sess = event["data"]["object"]
        uid = sess.get("client_reference_id")
        sub_id = sess.get("subscription")
        cust_id = sess.get("customer")
        if uid:
            period_end = None
            if sub_id:
                sub = stripe.Subscription.retrieve(sub_id)
                period_end = sub["current_period_end"]
            db.execute(
                "UPDATE users SET plan='pro-6mo', stripe_customer_id=?, stripe_subscription_id=?, plan_renewal=? WHERE id=?",
                (cust_id, sub_id, int(period_end) if period_end else None, uid)
            )
            db.commit()

    elif event["type"] in ("customer.subscription.created", "customer.subscription.updated"):
        sub = event["data"]["object"]
        cust_id = sub.get("customer")
        sub_id = sub.get("id")
        period_end = sub.get("current_period_end")
        status = sub.get("status")
        row = db.execute("SELECT id FROM users WHERE stripe_customer_id=?", (cust_id,)).fetchone()
        if row:
            new_plan = "pro-6mo" if status in ("active","trialing","past_due") else "free"
            db.execute(
                "UPDATE users SET plan=?, stripe_subscription_id=?, plan_renewal=? WHERE id=?",
                (new_plan, sub_id, int(period_end) if period_end else None, row["id"])
            )
            db.commit()

    elif event["type"] == "customer.subscription.deleted":
        sub = event["data"]["object"]
        cust_id = sub.get("customer")
        row = db.execute("SELECT id FROM users WHERE stripe_customer_id=?", (cust_id,)).fetchone()
        if row:
            db.execute("UPDATE users SET plan='free', stripe_subscription_id=NULL, plan_renewal=NULL WHERE id=?", (row["id"],))
            db.commit()

    return "", 200

@app.route("/billing")
@login_required
def billing():
    db = get_db()
    uid = current_user_id()
    user = db.execute("SELECT email, plan, plan_renewal, stripe_customer_id FROM users WHERE id=?", (uid,)).fetchone()
    renewal = user["plan_renewal"]
    renewal_iso = None
    if renewal:
        renewal_iso = datetime.fromtimestamp(int(renewal)).astimezone().strftime("%b %d, %Y %I:%M %p")
    return render_template("billing.html", app_name=APP_NAME, user=user, renewal_iso=renewal_iso)

@app.route("/billing/portal", methods=["POST"])
@login_required
def billing_portal():
    if not STRIPE_SECRET_KEY:
        return jsonify({"error":"Stripe not configured"}), 500
    db = get_db()
    uid = current_user_id()
    user = db.execute("SELECT email, stripe_customer_id FROM users WHERE id=?", (uid,)).fetchone()
    customer = user["stripe_customer_id"]
    if not customer:
        cust = stripe.Customer.create(email=user["email"])
        customer = cust.id
        db.execute("UPDATE users SET stripe_customer_id=? WHERE id=?", (customer, uid))
        db.commit()
    portal = stripe.billing_portal.Session.create(
        customer=customer,
        return_url=f"{APP_BASE_URL}/billing"
    )
    return jsonify({"url": portal.url})

# -------- Integration stubs --------
@app.route("/integrations/calendar/connect")
@login_required
def connect_calendar():
    return jsonify({"status":"stub", "message":"Google Calendar OAuth flow placeholder."})

@app.route("/integrations/health/connect")
@login_required
def connect_health():
    return jsonify({"status":"stub", "message":"Health integration placeholder."})

if __name__ == "__main__":
    with app.app_context():
        init_db()
        # Seed demo user if none
        db = get_db()
        row = db.execute("SELECT id FROM users LIMIT 1").fetchone()
        if not row:
            db.execute("INSERT INTO users (email, password_hash, plan) VALUES (?,?,?)",
                       ("demo@elarago.com", generate_password_hash("demo123"), "free"))
            uid = db.execute("SELECT id FROM users WHERE email=?", ("demo@elarago.com",)).fetchone()["id"]
            db.executemany(
                "INSERT INTO tasks (user_id, task, project, priority, due_date, status) VALUES (?, ?, ?, ?, ?, ?)",
                [
                    (uid, "Define weekly goals","Elara Go","High", str(date.today()), "Not Started"),
                    (uid, "Review project milestones","Client Work","Medium", str(date.today()), "In Progress"),
                    (uid, "Plan for next week","Personal","Low", str(date.today()), "Completed"),
                ],
            )
            db.executemany(
                "INSERT INTO habits (user_id, habit, mon,tue,wed,thu,fri,sat,sun) VALUES (?,?,?,?,?,?,?,?,?)",
                [
                    (uid,"Meditate",1,1,0,1,1,0,1),
                    (uid,"Exercise",1,0,1,1,0,0,1),
                    (uid,"Plan Tomorrow",0,1,1,0,1,1,1),
                ],
            )
            db.executemany(
                "INSERT INTO goals (user_id, goal, action_steps, progress) VALUES (?,?,?,?)",
                [
                    (uid,"Launch Elara Go","Complete MVP, Setup billing, Launch",60),
                    (uid,"Improve Health","Workout 3x/week, Track meals, Sleep 8 hrs",40),
                    (uid,"Read 12 Books","Read 1 book/month, Review notes",25),
                ],
            )
            db.execute(
                "INSERT INTO journal (user_id, jdate, mood, stress, gratitude, highlight, notes) VALUES (?,?,?,?,?,?,?)",
                (uid, str(date.today()), "Calm", 3, "Good sleep, finished project milestone", "Walk in the park", "Feeling productive and calm overall.")
            )
            db.commit()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
