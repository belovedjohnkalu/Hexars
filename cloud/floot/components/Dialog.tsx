"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import styles from "./Dialog.module.css";
const Dialog=DialogPrimitive.Root,DialogTrigger=DialogPrimitive.Trigger,DialogPortal=DialogPrimitive.Portal,DialogClose=DialogPrimitive.Close;
const DialogOverlay=React.forwardRef<React.ElementRef<typeof DialogPrimitive.Overlay>,React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>>(({className,...props},ref)=><DialogPrimitive.Overlay ref={ref} className={styles.overlay+" "+(className||"")} {...props}/>);
DialogOverlay.displayName="DialogOverlay";
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>{
  closeDisabled?:boolean;
  fullScreen?:boolean;
  container?:React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>["container"];
}
const DialogContent=React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>,DialogContentProps>(({className,children,container,closeDisabled=false,fullScreen=false,style,...props},ref)=>{
  const [viewport,setViewport]=React.useState<{height:number;center:number}|null>(null);
  React.useEffect(()=>{
    if(container)return;
    const visual=window.visualViewport,update=()=>setViewport({height:visual?.height||innerHeight,center:(visual?.offsetTop||0)+(visual?.height||innerHeight)/2});
    update();visual?.addEventListener("resize",update);visual?.addEventListener("scroll",update);window.addEventListener("resize",update);
    return()=>{visual?.removeEventListener("resize",update);visual?.removeEventListener("scroll",update);window.removeEventListener("resize",update);};
  },[container]);
  return <DialogPortal container={container}><DialogOverlay/><DialogPrimitive.Content ref={ref} className={styles.content+" "+(className||"")} style={{...(viewport&&!container?(fullScreen?{top:viewport.center-viewport.height/2+"px",height:viewport.height+"px",maxHeight:viewport.height+"px",transform:"none"}:{maxHeight:Math.max(160,viewport.height-32)+"px",top:viewport.center+"px"}):{}),...style}} {...props}>
    {children}<DialogPrimitive.Close disabled={closeDisabled} className={styles.close}><X className={styles.closeIcon}/><span className={styles.screenReaderText}>Close</span></DialogPrimitive.Close>
  </DialogPrimitive.Content></DialogPortal>;
});
DialogContent.displayName="DialogContent";
const DialogHeader=({className,...props}:React.HTMLAttributes<HTMLDivElement>)=><div className={styles.header+" "+(className||"")} {...props}/>;
const DialogFooter=({className,...props}:React.HTMLAttributes<HTMLDivElement>)=><div className={styles.footer+" "+(className||"")} {...props}/>;
const DialogTitle=React.forwardRef<React.ElementRef<typeof DialogPrimitive.Title>,React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(({className,...props},ref)=><DialogPrimitive.Title ref={ref} className={styles.title+" "+(className||"")} {...props}/>);
DialogTitle.displayName="DialogTitle";
const DialogDescription=React.forwardRef<React.ElementRef<typeof DialogPrimitive.Description>,React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(({className,...props},ref)=><DialogPrimitive.Description ref={ref} className={styles.description+" "+(className||"")} {...props}/>);
DialogDescription.displayName="DialogDescription";
export {Dialog,DialogPortal,DialogOverlay,DialogTrigger,DialogClose,DialogContent,DialogHeader,DialogFooter,DialogTitle,DialogDescription};
