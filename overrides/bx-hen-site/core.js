/* BX-HEN Core 0.1 — browser-side diagnostics and module lifecycle. */
(function (global) {
  "use strict";
  const VERSION = "0.1.0";
  const modules = new Map();
  const listeners = new Map();
  const history = [];
  const settings = new Map();
  const MAX_HISTORY = 100;
  let started = false;

  function emit(type, detail) {
    const event = { type, detail, timestamp: new Date().toISOString() };
    history.push(event);
    if (history.length > MAX_HISTORY) history.shift();
    for (const callback of listeners.get(type) || []) {
      try { callback(event); } catch (error) {
        history.push({ type: "listener:error", detail: String(error), timestamp: new Date().toISOString() });
        if (history.length > MAX_HISTORY) history.shift();
      }
    }
    return event;
  }

  function on(type, callback) {
    if (typeof callback !== "function") throw new TypeError("Listener must be a function");
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(callback);
    return () => listeners.get(type)?.delete(callback);
  }

  function register(name, module) {
    if (started) throw new Error("Register modules before start()");
    if (typeof name !== "string" || !name || modules.has(name)) throw new Error("Invalid or duplicate module");
    if (!module || typeof module.start !== "function") throw new TypeError("Module requires start(context)");
    modules.set(name, { instance: module, state: "registered" });
  }

  async function start() {
    if (started) return;
    started = true;
    for (const [name, entry] of modules) {
      try {
        await entry.instance.start(Object.freeze({ emit, on, getSetting }));
        entry.state = "running";
        emit("module:started", { name });
      } catch (error) {
        entry.state = "failed";
        emit("module:error", { name, message: String(error) });
      }
    }
    emit("core:ready", { version: VERSION });
  }

  async function stop() {
    if (!started) return;
    for (const [name, entry] of [...modules].reverse()) {
      if (entry.state !== "running") continue;
      try {
        if (typeof entry.instance.stop === "function") await entry.instance.stop();
        entry.state = "stopped";
      } catch (error) {
        entry.state = "failed";
        emit("module:error", { name, message: String(error) });
      }
    }
    started = false;
    emit("core:stopped", {});
  }

  function getSetting(key) { return settings.get(key); }
  function setSetting(key, value) {
    if (typeof key !== "string" || !key) throw new TypeError("Setting key must be a nonempty string");
    settings.set(key, value);
    emit("setting:changed", { key });
  }

  function diagnostics() {
    return {
      version: VERSION,
      started,
      browser: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      secureContext: typeof global.isSecureContext === "boolean" ? global.isSecureContext : null,
      modules: [...modules].map(([name, entry]) => ({ name, state: entry.state })),
      events: history.slice()
    };
  }

  Object.defineProperty(global, "BXHENCore", {
    value: Object.freeze({ version: VERSION, on, emit, register, start, stop, getSetting, setSetting, diagnostics }),
    writable: false,
    configurable: false
  });
})(typeof window !== "undefined" ? window : globalThis);
