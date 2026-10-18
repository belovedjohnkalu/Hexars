import { useEffect, useRef, useState } from "react";
import { cloudNames } from "../helpers/cloudNames";
import type { CloudScope } from "../endpoints/cloud_POST.schema";
import { z } from "zod";
import { ArrowUp, ImagePlus, X } from "lucide-react";
import { CloudColorWheel } from "./CloudColorWheel";
import { colorValue,unusedColor,type CloudColor } from "../helpers/cloudColors";
import { Button } from "./Button";
import { Input } from "./Input";
import { Form, FormItem, FormLabel, FormControl, FormMessage, useForm } from "./Form";
import styles from "./CloudComposer.module.css";
type Draft={name:string;file?:File;color?:CloudColor};
type Submission=Draft&{id:string;parentId:string|null;uploaded?:boolean};
export function CloudComposer({parentId,busy,disabled,onAdd,draft,onDraft,uploading=false,onCancelUpload,colors=false,scope="private",usedColors=[]}:{parentId:string|null;busy:boolean;disabled:boolean;draft:Draft;onDraft:(draft:Draft)=>void;onAdd:(value:Submission)=>Promise<boolean>;uploading?:boolean;onCancelUpload?:()=>void;colors?:boolean;scope?:CloudScope;usedColors?:(CloudColor|undefined)[]}){
  const form=useForm({defaultValues:{name:draft.name},schema:z.object({name:cloudNames.schema(scope,true)})});
  const [color,setColor]=useState<CloudColor>(()=>unusedColor(draft.color||'white',usedColors));
  const [file,setFile]=useState<File|undefined>(draft.file),[fileError,setFileError]=useState(""),[preview,setPreview]=useState("");
  const fileInput=useRef<HTMLInputElement>(null),wordInput=useRef<HTMLInputElement>(null),pending=useRef<Submission|null>(null),composing=useRef(false),mounted=useRef(true),submitting=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  useEffect(()=>{onDraft({name:form.values.name,file,...(colors?{color}:{})});pending.current=null;},[form.values.name,file,onDraft,color,colors]);
  useEffect(()=>{if(!file){setPreview("");return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
  function choose(next?:File){
    setFileError("");if(!next)return;
    if(!next.size){setFileError("This picture is empty. Choose another.");return;}
    if(!["image/png","image/jpeg","image/webp","image/gif"].includes(next.type)){setFileError("Use a JPEG, PNG, WebP or GIF picture.");return;}
    if(next.size>3*1024*1024){setFileError("Choose a picture of 3 MB or less.");return;}
    setFile(next);
  }
  const submit=form.handleSubmit(async values=>{
    if(busy||disabled||submitting.current||composing.current)return;
    const fileName=file?.name.replace(/\.[^.]+$/,"").trim()||"";
    const name=values.name.trim()||(scope==='private'?fileName:fileName.slice(0,80));
    if(!name){form.setFieldError("name","Add a word or choose a picture.");wordInput.current?.focus();return;}
    const item=pending.current??{id:crypto.randomUUID(),parentId,name,file,...(colors?{color:unusedColor(color,usedColors)}:{})};pending.current=item;
    const shouldFocus=!!wordInput.current&&document.activeElement?.closest("#cloud-composer-form")!==null;
    submitting.current=true;
    try{
      if(await onAdd(item)){
        const nextColor=colors?unusedColor(color,[...usedColors,item.color]):color;
        pending.current=null;onDraft({name:"",...(colors?{color:nextColor}:{})});
        if(mounted.current){form.setValues({name:""});setColor(nextColor);setFile(undefined);setFileError("");if(shouldFocus)wordInput.current?.focus({preventScroll:true});}
      }
    }finally{submitting.current=false;}
  });
  return <div className={styles.wrap}>
    <Form {...form}><form id="cloud-composer-form" noValidate onSubmit={submit} className={styles.form} aria-label="Add to this cloud">
      {colors&&<CloudColorWheel value={color} onChange={setColor} disabled={busy} usedColors={usedColors}/>}
      {file&&<div className={styles.attachment}><img src={preview} width={40} height={40} alt=""/><span title={file.name}>{file.name}</span><Button variant="ghost" size="icon" aria-label="Remove picture" disabled={busy} onClick={()=>{setFile(undefined);setFileError("");wordInput.current?.focus({preventScroll:true});}}><X size={18}/></Button></div>}
      <div className={styles.bar}>
        <Button variant="ghost" size="icon" className={styles.photo} aria-label={uploading?"Stop upload":"Choose a picture"} title={uploading?"Stop upload":"Choose a picture"} disabled={busy&&!uploading} onClick={()=>uploading?onCancelUpload?.():fileInput.current?.click()}>{uploading?<X size={24}/>:<ImagePlus size={24} strokeWidth={1.6}/>}</Button>
        <Input type="file" ref={fileInput} accept="image/*" className={styles.hidden} aria-label="Picture file" aria-invalid={!!fileError} aria-describedby={fileError?"cloud-picture-error":undefined} tabIndex={-1} onChange={e=>{choose(e.target.files?.[0]);e.target.value="";}} disabled={busy}/>
        <FormItem name="name" className={styles.field}>
          <FormLabel className={styles.hidden}>Add a word or a picture name</FormLabel>
          <FormControl><Input ref={wordInput} className={styles.input} style={{color:colorValue(colors?color:undefined)}} placeholder={file?"Name this picture…":"Add…"} autoComplete="off" enterKeyHint="done" maxLength={scope==='private'?undefined:80} value={form.values.name} onChange={e=>form.setValues({name:e.target.value})} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onKeyDown={e=>{if(e.key==="Enter"&&(e.nativeEvent.isComposing||composing.current))e.preventDefault();}} readOnly={busy} aria-busy={busy}/></FormControl>
          <FormMessage className={styles.fieldError}/>
        </FormItem>
        <Button type="submit" size="icon" className={styles.add} aria-label={busy?"Saving":"Add"} title={disabled?"Opening your space":busy?"Saving":"Add"} disabled={busy||disabled||(!form.values.name.trim()&&!file)} aria-busy={busy}>{busy?<span className={styles.saving}/>:<ArrowUp size={24} strokeWidth={2}/>}</Button>
      </div>
      {fileError&&<p id="cloud-picture-error" className={styles.error} role="alert">{fileError}</p>}
      {scope!=='private'&&form.values.name.length>=70&&<span className={styles.counter} aria-label={form.values.name.length+" of 80 characters"}>{form.values.name.length}/80</span>}
    </form></Form>
  </div>;
}
