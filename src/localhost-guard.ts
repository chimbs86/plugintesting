// Runs ONLY on localhost (manifest `matches` + runtime check below).
// For developing your own pages: keeps the page from seeing focus/visibility
// changes caused by opening the side panel or switching to it.
const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]"]);

if (LOCAL.has(location.hostname)) {
  const swallow = (e: Event) => {
    if (e.target === window || e.target === document) e.stopImmediatePropagation();
  };
  for (const type of ["blur", "focus", "focusout", "visibilitychange", "pagehide", "freeze"]) {
    window.addEventListener(type, swallow, true);
    document.addEventListener(type, swallow, true);
  }
  const define = (obj: object, prop: string, value: unknown) =>
    Object.defineProperty(obj, prop, { configurable: true, get: () => value });
  define(Document.prototype, "hidden", false);
  define(Document.prototype, "visibilityState", "visible");
  Document.prototype.hasFocus = () => true;
}
