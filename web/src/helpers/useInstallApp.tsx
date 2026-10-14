import { useEffect, useState } from "react";
import { supportsManualHomeScreen } from "./installSupport";
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
// Browser offers belong to the app, not to a page. Navigation and closing a
// menu must never discard them. Only an explicit install attempt consumes one.
const offers: InstallEvent[] = [];
const subscribers = new Set<() => void>();
let listening = false, installed = false, installing = false, error = false;
const notify = () => subscribers.forEach(fn => fn());
function listen() {
  if (listening) return;
  listening = true;
  const display = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)");
  const update = () => { installed = installed || display.matches || ("standalone" in navigator && navigator.standalone === true); notify(); };
  update(); display.addEventListener("change", update);
  window.addEventListener("beforeinstallprompt", event => {
    const offered = event as InstallEvent;
    if (typeof offered.prompt !== "function" || !offered.userChoice || !window.isSecureContext || window.self !== window.top) return;
    event.preventDefault();
    if (!offers.includes(offered)) offers.push(offered);
    notify();
  });
  window.addEventListener("appinstalled", () => { installed = true; error = false; notify(); });
}
export function useInstallApp() {
  const [, refresh] = useState(0);
  useEffect(() => {
    const update = () => refresh(value => value + 1);
    subscribers.add(update); listen(); update();
    return () => { subscribers.delete(update); };
  }, []);
  const manual = typeof window !== "undefined" && supportsManualHomeScreen({
    userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints,
    secureContext: window.isSecureContext, topLevel: window.self === window.top,
  });
  return {
    installed, installing, error,
    platform: manual ? "ios" as const : "desktop" as const,
    canPrompt: !installed && offers.length > 0,
    canInstall: !installed && (offers.length > 0 || manual),
    install: async () => {
      const offered = offers[0];
      if (!offered || installed || installing) return false;
      installing = true; error = false; notify();
      try {
        await offered.prompt();
        const choice = await offered.userChoice;
        const index = offers.indexOf(offered);
        if (index >= 0) offers.splice(index, 1);
        if (choice.outcome === "accepted") installed = true;
        return choice.outcome === "accepted";
      } catch {
        // Keep an offer after a failed attempt, rather than silently dropping it.
        error = true; return false;
      } finally { installing = false; notify(); }
    },
  };
}
