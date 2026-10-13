import { useEffect, useState } from "react";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const update = () =>
      setInstalled(display.matches || ("standalone" in navigator && navigator.standalone === true));
    update();
    const ua = navigator.userAgent;
    setPlatform(
      /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
        ? "ios"
        : /Android/.test(ua)
          ? "android"
          : "desktop",
    );
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const completed = () => {
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
    canPrompt: Boolean(prompt),
    install: async () => {
      if (!prompt) return false;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        setPrompt(null);
        return choice.outcome === "accepted";
      } catch {
        setPrompt(null);
        return false;
      }
    },
  };
}
