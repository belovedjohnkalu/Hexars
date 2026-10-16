import { useRef } from "react";
import { z } from "zod";
import type { CloudNode } from "../endpoints/cloud_POST.schema";
import { Button } from "./Button";
import { Input } from "./Input";
import { Form, FormControl, FormItem, FormLabel, FormMessage, useForm } from "./Form";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./Dialog";
import styles from "./CloudActions.module.css";
export function CloudActions({node,mode,count,busy,error,onClose,onRename,onRemove}:{node:CloudNode;mode:"rename"|"remove";count:number;busy:boolean;error:string;onClose:()=>void;onRename:(name:string)=>Promise<boolean>;onRemove:(operationId:string)=>Promise<boolean>}){
  const form=useForm({defaultValues:{name:node.name},schema:z.object({name:z.string().trim().min(1,"Give this cloud a name.").max(80,"Use up to 80 characters.")})});
  const input=useRef<HTMLInputElement>(null),cancel=useRef<HTMLButtonElement>(null),operation=useRef(crypto.randomUUID());
  return <Dialog open onOpenChange={open=>{if(!open&&!busy)onClose();}}>
    <DialogContent closeDisabled={busy} onCloseAutoFocus={e=>{e.preventDefault();document.getElementById("cloud-title-button")?.focus({preventScroll:true});}} className={styles.sheet} onOpenAutoFocus={e=>{e.preventDefault();if(mode==="rename"){input.current?.focus();input.current?.select();}else cancel.current?.focus();}} onEscapeKeyDown={e=>{if(busy)e.preventDefault();}} onPointerDownOutside={e=>{if(busy)e.preventDefault();}}>
      <DialogTitle className={styles.title}>{mode==="rename"?"Rename":"Remove this cloud?"}</DialogTitle>
      <DialogDescription className={styles.description}>{mode==="rename"?"Choose a name you’ll recognize.":'“'+node.name+'”'+(count?" and "+count+" "+(count===1?"item":"items")+" inside it":"")+" will leave this space. You can undo this."}</DialogDescription>
      {mode==="rename"?<Form {...form}><form noValidate onSubmit={form.handleSubmit(async values=>{if(!busy&&await onRename(values.name))onClose();})}>
        <FormItem name="name"><FormLabel className={styles.srOnly}>Cloud name</FormLabel><FormControl><Input ref={input} value={form.values.name} maxLength={80} readOnly={busy} onChange={e=>form.setValues({name:e.target.value})} className={styles.input}/></FormControl><FormMessage/></FormItem>
        {error&&<p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}><Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy||!form.values.name.trim()} aria-busy={busy}>{busy?"Saving…":"Save"}</Button></div>
      </form></Form>:<>{error&&<p className={styles.error} role="alert">{error}</p>}<div className={styles.actions}><Button ref={cancel} variant="ghost" onClick={onClose} disabled={busy}>Keep cloud</Button><Button variant="destructive" disabled={busy} aria-busy={busy} onClick={()=>void onRemove(operation.current).then(ok=>{if(ok)onClose();})}>{busy?"Removing…":"Remove"}</Button></div></>}
    </DialogContent>
  </Dialog>;
}
