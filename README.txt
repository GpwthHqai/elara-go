Elara Go — Landing + Dashboard + Auth + Stripe (Checkout/Webhook/Billing Portal) + Render Deploy

Run locally:
1) python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
2) python -m ensurepip --upgrade && pip install -r requirements.txt
3) cp .env.example .env  # add your Stripe keys and APP_BASE_URL
4) python app.py
- Open http://localhost:5000
- Demo login: demo@elarago.com / demo123

Render deploy:
- Repo includes Procfile and render.yaml
- Add env vars: FLASK_SECRET, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_6MO, APP_BASE_URL (after first deploy), STRIPE_WEBHOOK_SECRET
- First deploy → get URL → set APP_BASE_URL to https://YOUR-RENDER-URL and redeploy

Stripe webhook:
- Add endpoint: https://YOUR-RENDER-URL/webhook
- Events: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
- Paste signing secret into STRIPE_WEBHOOK_SECRET and redeploy

Notes:
- SQLite is used for MVP and may reset on redeploy if hosting disk is ephemeral.
- Tables: users, tasks, habits, goals, journal
- /billing opens Stripe Customer Portal
