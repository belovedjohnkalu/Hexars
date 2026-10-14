import { useState } from "react";
import { Download } from "lucide-react";
import { useInstallApp } from "../helpers/useInstallApp";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./Dialog";
import styles from "./InstallControl.module.css";
export function InstallControl({ text = false }: { text?: boolean }) {
  const app = useInstallApp();
  const [open, setOpen] = useState(false);
  if (!app.canInstall) return null;
  return <>
    <button className={styles.button} aria-label="Install" title="Install" disabled={app.installing}
      onClick={() => app.canPrompt ? void app.install() : setOpen(true)}>
      <Download size={24} strokeWidth={1.6} />{text && <span>{app.error ? "Retry" : "Install"}</span>}
    </button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className={styles.sheet}>
        <DialogTitle>Install</DialogTitle>
        <DialogDescription className={styles.instructions}>Safari: Share → Add to Home Screen.</DialogDescription>
      </DialogContent>
    </Dialog>
  </>;
}
