import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ArrowUp, ImagePlus, X } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Form, FormItem, FormLabel, FormControl, FormMessage, useForm } from "./Form";
import styles from "./CloudComposer.module.css";
type Draft = { name: string; file?: File };
type Submission = Draft & { id: string; parentId: string | null; uploaded?: boolean };
export function CloudComposer({ parentId, busy, disabled, onAdd, draft, onDraft }: {
  parentId: string | null; busy: boolean; disabled: boolean;
  draft: Draft; onDraft: (draft: Draft) => void;
  onAdd: (value: Submission) => Promise<boolean>;
}) {
  const form = useForm({ defaultValues: { name: draft.name }, schema: z.object({ name: z.string().max(80,"Use up to 80 characters.") }) });
  const [file,setFile] = useState<File | undefined>(draft.file), [fileError,setFileError] = useState(""), [preview,setPreview] = useState("");
  const fileInput = useRef<HTMLInputElement>(null), wordInput = useRef<HTMLInputElement>(null);
  const pending = useRef<Submission | null>(null), composing = useRef(false);
  useEffect(() => { onDraft({name:form.values.name,file}); pending.current = null; },[form.values.name,file,onDraft]);
  useEffect(() => {
    if (!file) {setPreview(""); return;}
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  },[file]);
  function choose(file?: File) {
    setFileError("");
    if (!file) return;
    if (!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type)) {setFileError("Choose a PNG, JPEG, WebP or GIF picture."); return;}
    if (file.size > 3 * 1024 * 1024) {setFileError("Choose a picture smaller than 3 MB."); return;}
    setFile(file); wordInput.current?.focus();
  }
  const submit = form.handleSubmit(async values => {
    if (busy || disabled || composing.current) return;
    const name = values.name.trim() || file?.name.replace(/\.[^.]+$/,"").slice(0,80) || "";
    if (!name) {form.setFieldError("name","Add a word or choose a picture."); wordInput.current?.focus(); return;}
    const item = pending.current ?? {id:crypto.randomUUID(),parentId,name,file};
    pending.current = item;
    if (await onAdd(item)) {
      pending.current = null; form.setValues({name:""}); setFile(undefined);
      onDraft({name:""}); wordInput.current?.focus();
    }
  });
  return <div className={styles.wrap}>
    <Form {...form}><form noValidate onSubmit={submit} className={styles.form} aria-label="Add to this cloud">
      {file && <div className={styles.attachment}>
        <img src={preview} width={40} height={40} alt="" /><span>{file.name}</span>
        <Button variant="ghost" size="icon-sm" aria-label="Remove picture" disabled={busy} onClick={()=>setFile(undefined)}><X size={18}/></Button>
      </div>}
      <div className={styles.bar}>
        <Button variant="ghost" size="icon" className={styles.photo} aria-label="Choose a picture" title="Choose a picture" disabled={disabled||busy} onClick={()=>fileInput.current?.click()}><ImagePlus size={24} strokeWidth={1.6}/></Button>
        <Input type="file" ref={fileInput} accept="image/png,image/jpeg,image/webp,image/gif" className={styles.hidden} aria-label="Picture file" tabIndex={-1} onChange={e=>{choose(e.target.files?.[0]);e.target.value="";}} disabled={busy||disabled}/>
        <FormItem name="name" className={styles.field}>
          <FormLabel className={styles.hidden}>Add a word or a picture name</FormLabel>
          <FormControl><Input ref={wordInput} className={styles.input} placeholder="Add…" autoComplete="off" enterKeyHint="done" maxLength={80} value={form.values.name} onChange={e=>form.setValues({name:e.target.value})} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onKeyDown={e=>{if(e.key==="Enter"&&(e.nativeEvent.isComposing||composing.current)) e.preventDefault();}} disabled={busy||disabled}/></FormControl>
          <FormMessage className={styles.fieldError}/>
        </FormItem>
        <Button type="submit" size="icon" className={styles.add} aria-label={busy?"Saving":"Add"} disabled={busy||disabled||(!form.values.name.trim()&&!file)} aria-busy={busy}>{busy?<span className={styles.saving}/>:<ArrowUp size={24} strokeWidth={2}/>}</Button>
      </div>
      {fileError&&<p className={styles.error} role="alert">{fileError}</p>}
    </form></Form>
  </div>;
}
