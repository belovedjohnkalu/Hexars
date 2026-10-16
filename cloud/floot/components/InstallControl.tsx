import { useRef, useState } from "react";
import { Download } from "lucide-react";
import { useInstallApp } from "../helpers/useInstallApp";
import { Button } from "./Button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./Dialog";
import styles from "./InstallControl.module.css";
export function InstallControl({text=false}:{text?:boolean}){
  const app=useInstallApp(),[open,setOpen]=useState(false),trigger=useRef<HTMLButtonElement>(null);
  if(!app.canInstall)return null;
  return <>
    <Button ref={trigger} variant="ghost" className={styles.button} aria-label={app.installing?"Installing":"Install"} title={app.error?"Try installing again":"Add to Home Screen"} aria-busy={app.installing} disabled={app.installing} onClick={()=>app.canPrompt?void app.install():setOpen(true)}>
      <Download size={24} strokeWidth={1.6}/>{text&&<span>{app.error?"Retry":"Install"}</span>}
    </Button>
    {app.error&&<span className={styles.srOnly} role="alert">Couldn’t install. Try again.</span>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className={styles.sheet} onCloseAutoFocus={e=>{e.preventDefault();trigger.current?.focus({preventScroll:true});}}>
      <DialogTitle>Add to Home Screen</DialogTitle>
      <DialogDescription className={styles.instructions}>Open Safari’s Share menu, then choose Add to Home Screen.</DialogDescription>
    </DialogContent></Dialog>
  </>;
}
