const MODEL = "claude-sonnet-5-5";
const PROMPT = "Solve the problem on this screen";

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

async function setState(state: { status: "idle" | "working" | "done" | "error"; text?: string }) {
  await chrome.storage.session.set({ state });
}

async function pageText(tabId: number): Promise<string> {
  try {
    const [r] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.body?.innerText.slice(0, 30_000) ?? "",
    });
    return (r?.result as string) ?? "";
  } catch {
    return "";
  }
}

export async function solve(tab: chrome.tabs.Tab) {
  if (tab.id == null) return;
  const { apiKey } = await chrome.storage.local.get("apiKey");
  if (!apiKey) {
    await setState({ status: "error", text: "Add your API key first." });
    return;
  }
  await setState({ status: "working" });
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    const text = await pageText(tab.id);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/png", data: dataUrl.split(",")[1] },
              },
              { type: "text", text: `${PROMPT}\n\nPage text for reference:\n${text}` },
            ],
          },
        ],
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
    const out = (json.content as { type: string; text?: string }[])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    await setState({ status: "done", text: out });
  } catch (e) {
    await setState({ status: "error", text: String(e) });
  }
}

chrome.commands.onCommand.addListener((command, tab) => {
  if (command !== "solve-screen" || !tab?.id) return;
  // Must be called synchronously inside the user gesture.
  chrome.sidePanel.open({ tabId: tab.id });
  void solve(tab);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "SOLVE") {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([t]) => t && solve(t));
  }
});
