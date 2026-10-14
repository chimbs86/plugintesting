const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const setup = $("setup"), main = $("main"), statusEl = $("status"), result = $("result");

async function showKeyState() {
  const { apiKey } = await chrome.storage.local.get("apiKey");
  setup.hidden = !!apiKey;
  main.hidden = !apiKey;
}

// Minimal safe markdown: all text goes through textContent, never innerHTML.
function render(md: string) {
  result.replaceChildren();
  const parts = md.split(/```[\w-]*\n?/);
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = part.replace(/\n$/, "");
      pre.append(code);
      result.append(pre);
      return;
    }
    for (const para of part.split(/\n{2,}/)) {
      if (!para.trim()) continue;
      const p = document.createElement("p");
      para.split("\n").forEach((line, j) => {
        if (j) p.append(document.createElement("br"));
        line.split(/(\*\*[^*]+\*\*|`[^`]+`)/).forEach((tok) => {
          if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
            const b = document.createElement("b");
            b.textContent = tok.slice(2, -2);
            p.append(b);
          } else if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
            const c = document.createElement("code");
            c.textContent = tok.slice(1, -1);
            p.append(c);
          } else p.append(tok);
        });
      });
      result.append(p);
    }
  });
}

type State = { status: string; text?: string };
function apply(state?: State) {
  statusEl.className = "muted";
  if (!state || state.status === "idle") { statusEl.textContent = ""; result.hidden = true; return; }
  if (state.status === "working") { statusEl.textContent = "Thinking…"; return; }
  if (state.status === "error") { statusEl.textContent = state.text ?? "Error"; statusEl.className = "err"; return; }
  statusEl.textContent = "";
  result.hidden = false;
  render(state.text ?? "");
}

$("saveKey").addEventListener("click", async () => {
  const k = $<HTMLInputElement>("key").value.trim();
  if (!k) return;
  await chrome.storage.local.set({ apiKey: k });
  $<HTMLInputElement>("key").value = "";
  await showKeyState();
});
$("changeKey").addEventListener("click", () => { setup.hidden = false; });
$("clearKey").addEventListener("click", async () => {
  await chrome.storage.local.remove("apiKey");
  await showKeyState();
});
$("run").addEventListener("click", () => chrome.runtime.sendMessage({ type: "SOLVE" }));

chrome.storage.onChanged.addListener((c, area) => {
  if (area === "session" && c.state) apply(c.state.newValue);
});
showKeyState();
chrome.storage.session.get("state").then((s) => apply(s.state));
