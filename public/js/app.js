import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#entry-form");
const formError = document.querySelector("#form-error");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };
function today() { return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10); }

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/entries");
  listEl.innerHTML = "";
  data.entries.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "item";
    const title = document.createElement("strong");
    title.textContent = `${entry.version} \u00b7 ${entry.title}`;
    const meta = document.createElement("span");
    meta.textContent = entry.day;
    const body = document.createElement("p");
    body.textContent = entry.body;
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/entries/${entry.id}`, { method: "DELETE" }); await refresh(); });
    li.append(title, meta, del, body);
    listEl.append(li);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    document.querySelector("#day").value = today();
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/entries", { method: "POST", body: JSON.stringify({ version: document.querySelector("#version").value.trim(), day: document.querySelector("#day").value, title: document.querySelector("#title").value.trim(), body: document.querySelector("#body").value.trim() }) });
    form.reset();
    document.querySelector("#day").value = today();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
