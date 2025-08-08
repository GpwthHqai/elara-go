async function fetchJSON(url, options={}){
  const res = await fetch(url, Object.assign({headers:{'Content-Type':'application/json'}}, options));
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}
function el(tag, props={}, ...children){
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k,v]) => {
    if(k === "dataset"){ Object.entries(v).forEach(([dk,dv]) => node.dataset[dk] = dv); }
    else if(k.startsWith("on") && typeof v === "function"){ node.addEventListener(k.slice(2), v); }
    else if(k === "html"){ node.innerHTML = v; }
    else { node.setAttribute(k, v); }
  });
  children.forEach(c => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return node;
}
async function loadSummary(){
  const data = await fetchJSON("/api/summary");
  const kpis = document.getElementById("kpis"); if(!kpis) return;
  kpis.innerHTML = "";
  Object.entries(data).forEach(([label, value]) => {
    kpis.appendChild(el("div", {class:"kpi"}, el("div", {class:"label"}, label), el("div", {class:"value"}, String(value)) ));
  });
}
async function loadTasks(){
  const rows = await fetchJSON("/api/tasks");
  const tbody = document.querySelector("#tasksTable tbody"); if(!tbody) return;
  tbody.innerHTML = "";
  rows.forEach(r => {
    const tr = el("tr", {}, 
      el("td", {}, String(r.id)),
      el("td", {}, r.task || ""),
      el("td", {}, r.project || ""),
      el("td", {}, r.priority || ""),
      el("td", {}, r.due_date || ""),
      el("td", {}, r.status || ""),
      el("td", {}, el("button", {class:"ghost", onclick: async () => { await fetchJSON(`/api/tasks/${r.id}`, {method:'DELETE'}); loadAll(); }}, "Delete"))
    );
    tbody.appendChild(tr);
  });
}
async function loadHabits(){
  const rows = await fetchJSON("/api/habits");
  const tbody = document.querySelector("#habitsTable tbody"); if(!tbody) return;
  tbody.innerHTML = "";
  rows.forEach(r => {
    const tr = el("tr", {},
      el("td", {}, r.habit || ""),
      ...["mon","tue","wed","thu","fri","sat","sun"].map(day => el("td", {}, String(r[day] ?? 0))),
      el("td", {}, el("button", {class:"ghost", onclick: async () => { await fetchJSON(`/api/habits/${r.id}`, {method:'DELETE'}); loadAll(); }}, "Delete"))
    );
    tbody.appendChild(tr);
  });
}
async function loadGoals(){
  const rows = await fetchJSON("/api/goals");
  const tbody = document.querySelector("#goalsTable tbody"); if(!tbody) return;
  tbody.innerHTML = "";
  rows.forEach(r => {
    const tr = el("tr", {},
      el("td", {}, r.goal || ""),
      el("td", {}, r.action_steps || ""),
      el("td", {}, String(r.progress ?? 0)),
      el("td", {}, el("button", {class:"ghost", onclick: async () => { await fetchJSON(`/api/goals/${r.id}`, {method:'DELETE'}); loadAll(); }}, "Delete"))
    );
    tbody.appendChild(tr);
  });
}
async function loadJournal(){
  const rows = await fetchJSON("/api/journal");
  const tbody = document.querySelector("#journalTable tbody"); if(!tbody) return;
  tbody.innerHTML = "";
  rows.forEach(r => {
    const tr = el("tr", {},
      el("td", {}, r.jdate || ""),
      el("td", {}, r.mood || ""),
      el("td", {}, String(r.stress ?? "")),
      el("td", {}, r.gratitude || ""),
      el("td", {}, r.highlight || ""),
      el("td", {}, r.notes || ""),
    );
    tbody.appendChild(tr);
  });
}
function wireForms(){
  const addTask = document.getElementById("addTask");
  if(addTask) addTask.addEventListener("click", async () => {
    const payload = {
      task: document.getElementById("newTask").value,
      project: document.getElementById("newProject").value,
      priority: document.getElementById("newPriority").value,
      due_date: document.getElementById("newDue").value,
      status: document.getElementById("newStatus").value
    };
    await fetchJSON("/api/tasks", {method:"POST", body: JSON.stringify(payload)});
    ["newTask","newProject","newDue"].forEach(id => { const el=document.getElementById(id); if(el) el.value = ""; });
    loadAll();
  });
  const addHabit = document.getElementById("addHabit");
  if(addHabit) addHabit.addEventListener("click", async () => {
    const name = document.getElementById("habitName").value;
    if(!name) return;
    await fetchJSON("/api/habits", {method:"POST", body: JSON.stringify({habit:name})});
    document.getElementById("habitName").value = "";
    loadAll();
  });
  const addGoal = document.getElementById("addGoal");
  if(addGoal) addGoal.addEventListener("click", async () => {
    const payload = {
      goal: document.getElementById("goalName").value,
      action_steps: document.getElementById("goalSteps").value,
      progress: parseInt(document.getElementById("goalProgress").value || "0", 10)
    };
    await fetchJSON("/api/goals", {method:"POST", body: JSON.stringify(payload)});
    ["goalName","goalSteps","goalProgress"].forEach(id => { const el=document.getElementById(id); if(el) el.value = ""; });
    loadAll();
  });
  const addJournal = document.getElementById("addJournal");
  if(addJournal) addJournal.addEventListener("click", async () => {
    const payload = {
      date: document.getElementById("jDate").value,
      mood: document.getElementById("jMood").value,
      stress: parseInt(document.getElementById("jStress").value || "0", 10),
      gratitude: document.getElementById("jGrat").value,
      highlight: document.getElementById("jHigh").value,
      notes: document.getElementById("jNotes").value
    };
    await fetchJSON("/api/journal", {method:"POST", body: JSON.stringify(payload)});
    ["jDate","jMood","jStress","jGrat","jHigh","jNotes"].forEach(id => { const el=document.getElementById(id); if(el) el.value = ""; });
    loadAll();
  });
}
async function loadAll(){ await Promise.all([loadSummary(), loadTasks(), loadHabits(), loadGoals(), loadJournal()]); }
document.addEventListener("DOMContentLoaded", () => { wireForms(); loadAll(); });
