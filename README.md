# Chimbs Plugin

A Chrome (Manifest V3) extension, written in TypeScript, that sends what is on
your current screen to Claude and shows the answer in a side panel.

## What it does

1. **First run:** the side panel asks for your Anthropic API key and stores it
   in `chrome.storage.local` (this browser profile only, not synced). Chrome does
   not encrypt extension storage, so treat the profile directory as sensitive.
   You can change or remove the key from the panel.
2. **Trigger:** press **Ctrl+Shift+Y** (Cmd+Shift+Y on Mac) or click
   **Solve current screen** in the panel. Ctrl+Shift+I is reserved by Chrome for
   DevTools, so it can't be used. Rebind at `chrome://extensions/shortcuts`.
3. **Capture:** the background service worker takes a screenshot of the visible
   tab (`tabs.captureVisibleTab`) and reads the page's `innerText` (first 30k
   chars) with a one-off `scripting.executeScript`.
4. **Call Claude:** both are sent to the Anthropic Messages API with the model
   `claude-sonnet-5-5` and the prompt *"Solve the problem on this screen"*.
5. **Render:** the answer is stored in `chrome.storage.session` and rendered in
   the side panel (code blocks, bold, inline code), using `textContent` only so
   model output can never inject HTML.

## Localhost-only behaviour

`src/localhost-guard.ts` is a content script that the manifest loads **only** on
`localhost`, `127.0.0.1` and `[::1]` (and checks the hostname again at runtime).
It is meant for developing your own pages. On those hosts it stops
`blur`/`focus`/`visibilitychange`/`pagehide`/`freeze` events from reaching page
listeners and makes `document.hidden`, `visibilityState` and `hasFocus()` report
a visible, focused page. All other sites are untouched. Window resizes caused by
the panel opening are not hidden.

## Permissions (`static/manifest.json`)

| Permission | Why |
| --- | --- |
| `activeTab`, `scripting` | read the current page's text |
| `storage` | save the API key and the latest result |
| `sidePanel` | show the panel on the right |
| `host_permissions: <all_urls>` | screenshot/read any tab from the panel button and call `api.anthropic.com` |

## Project layout

```
src/background.ts       shortcut handler, screenshot, Claude API call
src/panel.ts            side-panel UI: key setup, run button, result rendering
src/localhost-guard.ts  localhost-only page-context script
static/                 manifest.json, panel.html (copied to dist/)
build.mjs               esbuild bundler
```

## Build and install

```bash
npm install
npm run build        # or: npm run watch
```

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and choose the `dist/` folder.
3. Pin the extension, click its icon to open the side panel, and enter your key.
4. After rebuilding, click the reload icon on the extension's card.

`npm run typecheck` runs the TypeScript compiler without emitting files.

## Notes

- Screenshots and page text are sent to Anthropic; avoid using it on pages
  with data you don't want to share.
- The key is sent directly from the browser to `api.anthropic.com` using the
  `anthropic-dangerous-direct-browser-access` header. For anything shared or
  production, proxy through your own backend instead.
