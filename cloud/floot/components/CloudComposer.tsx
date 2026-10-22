import { useEffect,useRef,useState } from 'react';
import { z } from 'zod';
import { ArrowUp,ImagePlus,X } from 'lucide-react';
import { cloudWordLimit,wordCount,PICTURE_WORDS } from '../helpers/cloudWordLimits';
import { cloudNames } from '../helpers/cloudNames';
import { resumeCloudTyping } from '../helpers/resumeCloudTyping';
import { focusCloudComposer } from '../helpers/cloudTyping';
import { photoFileError,type CloudPhotoDraft } from '../helpers/cloudPhotos';
import type { CloudScope,CloudNode } from '../endpoints/cloud_POST.schema';
import { colorValue,unusedColor,type CloudColor } from '../helpers/cloudColors';
import { CloudColorWheel } from './CloudColorWheel';
import { PageControls } from './PageControls';
import { Button } from './Button';
import { Input } from './Input';
import { Form,FormItem,FormLabel,FormControl,FormMessage,useForm } from './Form';
import styles from './CloudComposer.module.css';
type Draft={name:string;file?:File;photos?:CloudPhotoDraft[];color?:CloudColor};
type Submission=Draft&{id:string;parentId:string|null;uploaded?:boolean};
export function CloudComposer({parentId,busy,disabled,onAdd,draft,onDraft,uploading=false,onCancelUpload,colors=false,scope='private',usedColors=[],nodes=[],className=''}:{parentId:string|null;busy:boolean;disabled:boolean;draft:Draft;onDraft:(draft:Draft)=>void;onAdd:(value:Submission)=>Promise<boolean>;uploading?:boolean;onCancelUpload?:()=>void;colors?:boolean;scope?:CloudScope;usedColors?:(CloudColor|undefined)[];nodes?:CloudNode[];className?:string}){
 const limit=(scope==='public'||scope==='private')&&nodes.length?cloudWordLimit(nodes,parentId):undefined;
 const form=useForm({defaultValues:{name:draft.name},schema:z.object({name:cloudNames.schema(scope,true,limit)})});
 const [editing,setEditing]=useState(false),[color,setColor]=useState<CloudColor>(()=>unusedColor(draft.color||'white',usedColors));
 const [photos,setPhotos]=useState<CloudPhotoDraft[]>(()=>draft.photos??(draft.file?[{id:crypto.randomUUID(),file:draft.file}]:[])),[fileError,setFileError]=useState(''),[previews,setPreviews]=useState<string[]>([]),[page,setPage]=useState(0);
 const totalWords=wordCount(form.values.name.trim()||(photos[0]?.file.name.replace(/\.[^.]+$/,'').trim()||''))+photos.length*PICTURE_WORDS,canChoosePictures=!disabled&&(limit===undefined||BigInt(totalWords+PICTURE_WORDS)<=limit),overLimit=limit!==undefined&&BigInt(totalWords)>limit;
 const fileInput=useRef<HTMLInputElement>(null),wordInput=useRef<HTMLInputElement>(null),pending=useRef<Submission|null>(null),composing=useRef(false),mounted=useRef(true),submitting=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{const input=wordInput.current;if(!input||disabled)return;return resumeCloudTyping(input);},[parentId,disabled]);
 useEffect(()=>{if(disabled)return;const frame=requestAnimationFrame(()=>focusCloudComposer());return()=>cancelAnimationFrame(frame);},[parentId,disabled]);
 useEffect(()=>{onDraft({name:form.values.name,file:photos[0]?.file,photos,...(colors?{color}:{})});pending.current=null;},[form.values.name,photos,onDraft,color,colors]);
 useEffect(()=>{const urls=photos.map(p=>typeof URL.createObjectURL==='function'?URL.createObjectURL(p.file):'');setPreviews(urls);return()=>urls.forEach(url=>{if(url)URL.revokeObjectURL(url);});},[photos]);
 useEffect(()=>setPage(p=>Math.min(p,Math.max(0,photos.length-1))),[photos.length]);
 function choose(files:File[]){const valid:CloudPhotoDraft[]=[],errors:string[]=[];for(const file of files){const error=photoFileError(file);if(error)errors.push(file.name+': '+error);else valid.push({id:crypto.randomUUID(),file});}const available=limit===undefined?valid.length:Number((limit-BigInt(totalWords))/BigInt(PICTURE_WORDS));if(valid.length>Math.max(0,available)){setFileError('Each picture uses 1,000 words.');return;}if(valid.length)setPhotos(old=>[...old,...valid]);setFileError(errors.length?errors[0]+(errors.length>1?' '+(errors.length-1)+' more invalid pictures.':''):'');}
 const submit=form.handleSubmit(async values=>{
  if(busy||disabled||submitting.current||composing.current)return;if(overLimit){form.setFieldError('name','Use up to '+limit+' words here.');return;}
  const fileName=photos[0]?.file.name.replace(/\.[^.]+$/,'').trim()||'',name=values.name.trim()||fileName;
  if(limit!==undefined&&BigInt(wordCount(name)+photos.length*PICTURE_WORDS)>limit){form.setFieldError('name','Use up to '+limit+' words here.');wordInput.current?.focus();return;}
  if(!name){form.setFieldError('name','Add a word or choose pictures.');wordInput.current?.focus();return;}
  const checked=cloudNames.schema(scope,false,limit).safeParse(name);if(!checked.success){form.setFieldError('name',checked.error.issues[0]?.message||'Check the name.');wordInput.current?.focus();return;}
  const item=pending.current??{id:crypto.randomUUID(),parentId,name,file:photos[0]?.file,photos,...(colors?{color:unusedColor(color,usedColors)}:{})};pending.current=item;
  const shouldFocus=!!wordInput.current&&document.activeElement?.closest('#cloud-composer-form')!==null;submitting.current=true;
  try{if(await onAdd(item)){const nextColor=colors?unusedColor(color,[...usedColors,item.color]):color;pending.current=null;onDraft({name:'',...(colors?{color:nextColor}:{})});if(mounted.current){form.setValues({name:''});setColor(nextColor);setPhotos([]);setFileError('');if(shouldFocus)wordInput.current?.focus({preventScroll:true});}}}finally{submitting.current=false;}
 });
 return <div className={styles.wrap+' '+className}><Form {...form}><form id="cloud-composer-form" noValidate onSubmit={submit} className={styles.form} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setEditing(false);}} aria-label="Add to this cloud">
 {(colors&&editing||photos.length>0)&&<div className={styles.extras}>
 {colors&&editing&&<CloudColorWheel value={color} onChange={setColor} disabled={busy} usedColors={usedColors}/>}
 {photos.length>0&&<><div className={styles.attachment}>{previews[page]&&<img src={previews[page]} width={40} height={40} alt=""/>}<span title={photos[page]?.file.name}>{photos[page]?.file.name}</span><Button variant="ghost" size="icon" aria-label={'Remove picture '+(page+1)} disabled={busy} onClick={()=>{setPhotos(old=>old.filter((_,i)=>i!==page));setFileError('');wordInput.current?.focus({preventScroll:true});}}><X size={18}/></Button></div>{photos.length>1&&<PageControls page={page} total={photos.length} onChange={setPage} label="Selected photos"/>}<span className={styles.hidden} role="status">{photos.length} pictures selected</span></>}
 </div>}
 <div className={styles.bar}>
 {(canChoosePictures||uploading)&&<Button variant="ghost" size="icon" className={styles.photo} aria-label={uploading?'Stop upload':'Choose pictures'} title={uploading?'Stop upload':'JPEG, PNG, WebP or GIF · 20 MB each'} disabled={disabled||busy&&!uploading} onClick={()=>uploading?onCancelUpload?.():fileInput.current?.click()}>{uploading?<X size={24}/>:<ImagePlus size={24} strokeWidth={1.6}/>}</Button>}
 <Input type="file" multiple ref={fileInput} accept="image/png,image/jpeg,image/webp,image/gif" className={styles.hidden} aria-label="Picture file" aria-invalid={!!fileError} aria-describedby={fileError?'cloud-picture-error':undefined} tabIndex={-1} onChange={e=>{choose(Array.from(e.target.files||[]));e.target.value='';}} disabled={busy}/>
 <FormItem name="name" className={styles.field}><FormLabel className={styles.hidden}>Add a word or a picture name</FormLabel><FormControl><Input ref={wordInput} data-cloud-input onFocus={()=>setEditing(true)} className={styles.input} style={{color:colorValue(colors?color:undefined)}} placeholder={photos.length?'Name…':limit===undefined?'Add…':limit+' '+(limit===1n?'word':'words')+'…'} autoComplete="off" enterKeyHint="done" value={form.values.name} onChange={e=>form.setValues({name:e.target.value})} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onKeyDown={e=>{if(e.key==='Enter'&&(e.nativeEvent.isComposing||composing.current))e.preventDefault();}} readOnly={busy||disabled} aria-busy={busy||disabled} aria-describedby="cloud-word-count"/></FormControl><FormMessage className={styles.fieldError}/></FormItem>
 <span id="cloud-word-count" className={styles.wordCounter} data-over-limit={overLimit} aria-label={totalWords+' words'+(limit===undefined?'':' of '+limit)}>{totalWords.toLocaleString()}{limit!==undefined&&<> / {limit.toLocaleString()}</>}</span>
 <Button type="submit" size="icon" className={styles.add} aria-label={busy?'Saving':'Add'} title={disabled?'Opening your space':busy?'Saving':'Add'} disabled={busy||disabled||overLimit||(!form.values.name.trim()&&!photos.length)} aria-busy={busy}>{busy?<span className={styles.saving}/>:<ArrowUp size={24} strokeWidth={2}/>}</Button>
 </div>
 {fileError&&<p id="cloud-picture-error" className={styles.error} role="alert">{fileError}</p>}
 </form></Form></div>;
}
