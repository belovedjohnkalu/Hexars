import { useEffect, useState } from "react";
import { supportsManualHomeScreen } from "./installSupport";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [manualInstall, setManualInstall] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)");
    let completedHere = false;
    const update = () =>
      setInstalled(completedHere || display.matches || ("standalone" in navigator && navigator.standalone === true));
    update();
    const ua = navigator.userAgent;
    setPlatform(/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
      ? "ios" : /Android/.test(ua) ? "android" : "desktop");
    setManualInstall(supportsManualHomeScreen({
      userAgent: ua, maxTouchPoints: navigator.maxTouchPoints,
      secureContext: window.isSecureContext, topLevel: window.self === window.top,
    }));
    const beforeInstall = (event: Event) => {
      const offered = event as InstallEvent;
      if (typeof offered.prompt !== "function" || !offered.userChoice || !window.isSecureContext || window.self !== window.top) return;
      event.preventDefault();
      setPrompt(offered);
    };
    const completed = () => {
      completedHere = true;
      setInstalled(true);
      setPrompt(null);
    };
    display.addEventListener("change", update);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", completed);
    return () => {
      display.removeEventListener("change", update);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", completed);
    };
  }, []);
  return {
    installed,
    platform,
    canPrompt: !installed && Boolean(prompt),
    canInstall: !installed && (Boolean(prompt) || manualInstall),
    install: async () => {
      if (!prompt || installed) return false;
      // A browser's deferred install event can be used only once.
      const offered = prompt;
      setPrompt(null);
      try {
        await offered.prompt();
        const choice = await offered.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
        return choice.outcome === "accepted";
      } catch {
        return false;
      }
    },
  };
}
