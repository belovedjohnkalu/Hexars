import {readMediaDimensions} from '../helpers/cloudMediaAspect';
import {cloudPhotoUrls} from '../helpers/cloudPhotos';
import {useComposerNavigation} from '../helpers/useComposerNavigation';
import { useEffect,useLayoutEffect,useRef,useState } from 'react';
import { z } from 'zod';
import { ArrowUp,Check,ImagePlus,Mic,X,Search } from 'lucide-react';
import { cloudWordLimit,wordCount,PICTURE_WORDS } from '../helpers/cloudWordLimits';
import { cloudNames } from '../helpers/cloudNames';
import { resumeCloudTyping } from '../helpers/resumeCloudTyping';
import { focusCloudComposer } from '../helpers/cloudTyping';
import { mapPhotos,photoFileError,mediaAccept,mediaKind,mediaWordCost,type CloudPhotoDraft } from '../helpers/cloudPhotos';
import type { CloudScope,CloudNode } from '../endpoints/cloud_POST.schema';
import { useRandomWordColor,nextRandomWordColor } from '../helpers/useRandomWordColor';
import { colorValue,unusedColor,type CloudColor } from '../helpers/cloudColors';
import { CloudColorWheel } from './CloudColorWheel';
import { PageControls } from './PageControls';
import { Button } from './Button';
import { Input } from './Input';
import { Form,FormItem,FormLabel,FormControl,FormMessage,useForm } from './Form';
import styles from './CloudComposer.module.css';
type Draft={name:string;file?:File;photos?:CloudPhotoDraft[];color?:CloudColor;retainMedia?:number[]};
export type CloudSubmission=Draft&{id:string;parentId:string|null;uploaded?:boolean;openAfter?:boolean;retainMedia?:number[]};
type Submission=CloudSubmission;
export function CloudComposer({parentId,busy,disabled,onAdd,draft,onDraft,uploading=false,onCancelUpload,colors=false,dev=false,scope='private',usedColors=[],nodes=[],className='',onSearch,storageKey,editNode,onCancel,onEnter}:{parentId:string|null;busy:boolean;disabled:boolean;draft:Draft;onDraft:(draft:Draft)=>void;onAdd:(value:Submission)=>Promise<boolean>;uploading?:boolean;onCancelUpload?:()=>void;colors?:boolean;dev?:boolean;scope?:CloudScope;usedColors?:(CloudColor|undefined)[];nodes?:CloudNode[];className?:string;onSearch?:()=>void;storageKey?:string;editNode?:CloudNode;onCancel?:()=>void;onEnter?:(value:Submission)=>void}){
 const navigation=useComposerNavigation(),countId=editNode?'cloud-edit-word-count':'cloud-word-count';
 const randomColors=useRandomWordColor();
 const limit=!dev&&(scope==='public'||scope==='private')&&nodes.length?cloudWordLimit(nodes,parentId):undefined;
 const form=useForm({defaultValues:{name:draft.name},schema:z.object({name:cloudNames.schema(scope,true,limit)})});
 const [retained,setRetained]=useState<number[]>(()=>draft.retainMedia??cloudPhotoUrls(editNode||{id:'',name:'',parentId:null}).map((_,i)=>i));
 const [editing,setEditing]=useState(!!editNode),[color,setColor]=useState<CloudColor>(()=>draft.color?unusedColor(draft.color,usedColors):randomColors.enabled?nextRandomWordColor(usedColors):unusedColor('white',usedColors));
 const [photos,setPhotos]=useState<CloudPhotoDraft[]>(()=>draft.photos??(draft.file?[{id:crypto.randomUUID(),file:draft.file}]:[])),[fileError,setFileError]=useState(''),[previews,setPreviews]=useState<string[]>([]),[page,setPage]=useState(0),[savedPage,setSavedPage]=useState(0);
 const binding=useRef(storageKey),rebinding=useRef(false),latestName=useRef(form.values.name);latestName.current=form.values.name;
 useLayoutEffect(()=>{if(binding.current===storageKey)return;binding.current=storageKey;rebinding.current=true;form.setValues({name:draft.name});setPhotos([...(draft.photos??(draft.file?[{id:crypto.randomUUID(),file:draft.file}]:[]))]);setColor(draft.color?unusedColor(draft.color,usedColors):randomColors.enabled?nextRandomWordColor(usedColors):unusedColor('white',usedColors));setFileError('');pending.current=null;},[storageKey]);
 const previousRandom=useRef(randomColors.enabled);
 useEffect(()=>{if(previousRandom.current!==randomColors.enabled){previousRandom.current=randomColors.enabled;if(randomColors.enabled)setColor(nextRandomWordColor(usedColors));}},[randomColors.enabled,usedColors]);
 const savedWords=retained.reduce((sum,i)=>sum+mediaWordCost(editNode?.mediaTypes?.[i]||'image/png'),0),totalWords=wordCount(form.values.name)+savedWords+photos.reduce((total,p)=>total+mediaWordCost(p.file.type),0),canChoosePictures=!disabled&&(limit===undefined||BigInt(totalWords+PICTURE_WORDS)<=limit),overLimit=limit!==undefined&&BigInt(totalWords)>limit,canChooseAudio=!disabled&&(limit===undefined||BigInt(totalWords+500000)<=limit);
 const fileInput=useRef<HTMLInputElement>(null),audioInput=useRef<HTMLInputElement>(null),wordInput=useRef<HTMLInputElement>(null),pending=useRef<Submission|null>(null),composing=useRef(false),enterAfter=useRef(false),mounted=useRef(true),submitting=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
 useEffect(()=>{const input=wordInput.current;if(!input||disabled)return;return resumeCloudTyping(input);},[parentId,disabled]);
 useEffect(()=>{if(disabled)return;const frame=requestAnimationFrame(()=>focusCloudComposer());return()=>cancelAnimationFrame(frame);},[parentId,disabled]);
 useEffect(()=>{if(rebinding.current){rebinding.current=false;return;}onDraft({name:form.values.name,file:photos[0]?.file,photos,...(editNode?{retainMedia:retained}:{}),...(colors?{color}:{})});pending.current=null;},[form.values.name,photos,retained,onDraft,color,colors]);
 useEffect(()=>{const urls=photos.map(p=>typeof URL.createObjectURL==='function'?URL.createObjectURL(p.file):'');setPreviews(urls);return()=>urls.forEach(url=>{if(url)URL.revokeObjectURL(url);});},[photos]);
 useEffect(()=>setPage(p=>Math.min(p,Math.max(0,photos.length-1))),[photos.length]);
 useEffect(()=>setSavedPage(p=>Math.min(p,Math.max(0,Math.ceil(retained.length/2)-1))),[retained.length]);
 function choose(files:File[]){const valid:CloudPhotoDraft[]=[],errors:string[]=[];for(const file of files){const error=photoFileError(file);if(error)errors.push(file.name+': '+error);else valid.push({id:crypto.randomUUID(),file});}if(limit!==undefined&&BigInt(totalWords+valid.reduce((sum,p)=>sum+mediaWordCost(p.file.type),0))>limit){setFileError('Pictures use 1,000 words; audio 500,000; video 1,000,000.');return;}if(valid.length){setPhotos(old=>[...old,...valid]);void mapPhotos(valid,async photo=>{const dimensions=await readMediaDimensions(photo.file);if(dimensions&&mounted.current)setPhotos(old=>old.map(p=>p.id===photo.id?{...p,dimensions}:p));});}setFileError(errors.length?errors[0]+(errors.length>1?' '+(errors.length-1)+' more invalid files.':''):'');}
 const submit=form.handleSubmit(async values=>{
  if(busy||disabled||submitting.current||composing.current)return;if(overLimit){form.setFieldError('name','Use up to '+limit+' words here.');return;}
  const name=values.name.trim();
  if(limit!==undefined&&BigInt(wordCount(name)+savedWords+photos.reduce((total,p)=>total+mediaWordCost(p.file.type),0))>limit){form.setFieldError('name','Use up to '+limit+' words here.');wordInput.current?.focus();return;}
  if(!name&&!photos.length&&!retained.length){form.setFieldError('name','Add a word or choose a file.');wordInput.current?.focus();return;}
  const checked=cloudNames.schema(scope,photos.length+retained.length>0,limit).safeParse(name);if(!checked.success){form.setFieldError('name',checked.error.issues[0]?.message||'Check the name.');wordInput.current?.focus();return;}
  const item=pending.current??{openAfter:enterAfter.current,id:editNode?.id||crypto.randomUUID(),parentId,name,file:photos[0]?.file,photos,...(editNode?{retainMedia:retained}:{}),...(colors?{color:editNode?color:unusedColor(color,usedColors)}:{})};item.openAfter=enterAfter.current;pending.current=item;
  const shouldFocus=!!wordInput.current&&!!document.activeElement?.closest('[data-cloud-draft]');if(shouldFocus)wordInput.current?.focus({preventScroll:true});submitting.current=true;
  try{if(await onAdd(item)){if(enterAfter.current)onEnter?.(item);enterAfter.current=false;const nextColor=colors?(randomColors.enabled?nextRandomWordColor([...usedColors,item.color]):unusedColor(color,[...usedColors,item.color])):color;pending.current=null;if(mounted.current&&binding.current===storageKey){if(latestName.current===values.name)form.setValues({name:''});setColor(nextColor);setPhotos(current=>current.filter(p=>!item.photos?.some(sent=>sent.id===p.id)));setFileError('');if(shouldFocus)wordInput.current?.focus({preventScroll:true});}}}finally{submitting.current=false;}
 });
 return <div data-composer-expanded={colors&&(editing||!!editNode)||photos.length+retained.length>0} className={styles.wrap+' '+className}><Form {...form}><form id={editNode?"cloud-editor-form":"cloud-composer-form"} data-cloud-draft={storageKey} noValidate onSubmit={submit} className={styles.form} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setEditing(false);}} aria-label={editNode?'Edit cloud':scope==='home'&&parentId==='ion'?'Add a feature':'Add to this cloud'}>
 {photos.length+retained.length>0&&<div className={styles.extras}>
 {retained.length>0&&<><div className={styles.savedMedia}>{retained.slice(savedPage*2,savedPage*2+2).map(i=><span key={i} className={styles.savedFile}>{mediaKind(editNode?.mediaTypes?.[i]||'')==='image'?<img src={cloudPhotoUrls(editNode!)[i]} alt=""/>:<span>{mediaKind(editNode?.mediaTypes?.[i]||'')}</span>}<Button variant="ghost" size="icon" aria-label={'Remove saved media '+(i+1)} disabled={busy} onPointerDown={e=>{if(document.activeElement===wordInput.current)e.preventDefault();}} onClick={()=>{setRetained(old=>old.filter(n=>n!==i));wordInput.current?.focus({preventScroll:true});}}><X size={16}/></Button></span>)}</div>{retained.length>2&&<span onPointerDownCapture={e=>{if(document.activeElement===wordInput.current)e.preventDefault();}}><PageControls page={savedPage} total={Math.ceil(retained.length/2)} onChange={setSavedPage} label="Saved media"/></span>}</>}
 {photos.length>0&&<><div className={styles.attachment}>{previews[page]&&mediaKind(photos[page]?.file.type||'')==='image'&&<img src={previews[page]} width={40} height={40} alt=""/>}<span title={photos[page]?.file.name}>{photos[page]?.file.name}</span><Button variant="ghost" size="icon" aria-label={'Remove file '+(page+1)} disabled={busy} onClick={()=>{setPhotos(old=>old.filter((_,i)=>i!==page));setFileError('');wordInput.current?.focus({preventScroll:true});}}><X size={18}/></Button></div>{photos.length>1&&<PageControls page={page} total={photos.length} onChange={setPage} label="Selected media"/>}<span className={styles.hidden} role="status">{photos.length} files selected</span></>}
 </div>}
 {colors&&(editing||!!editNode)&&<div className={styles.palette}><CloudColorWheel value={color} onChange={setColor} disabled={busy} usedColors={usedColors}/></div>}
 <div className={styles.bar} {...(editNode?{}:navigation)}>
 {editNode&&<Button variant="ghost" size="icon" className={styles.photo} aria-label="Cancel edit" disabled={busy} onClick={onCancel}><X size={22}/></Button>}
 {scope==='public'&&onSearch&&<Button variant="ghost" size="icon" className={styles.photo} aria-label="Search Hub" onClick={onSearch}><Search size={23} strokeWidth={1.7}/></Button>}
 {(canChoosePictures||uploading)&&<Button variant="ghost" size="icon" className={styles.photo} aria-label={uploading?'Stop upload':'Choose media'} title={uploading?'Stop upload':'Pictures 20 MB · audio 100 MB · video 200 MB'} disabled={disabled||busy&&!uploading} onClick={()=>uploading?onCancelUpload?.():fileInput.current?.click()}>{uploading?<X size={24}/>:<ImagePlus size={24} strokeWidth={1.6}/>}</Button>}
 {canChooseAudio&&<Button variant="ghost" size="icon" className={styles.photo} aria-label="Add audio" title="Audio · 100 MB" disabled={busy||disabled} onClick={()=>audioInput.current?.click()}><Mic size={21}/></Button>}
 <Input type="file" multiple ref={audioInput} accept={mediaAccept.split(',').filter(t=>t.startsWith('audio/')).join(',')} className={styles.hidden} aria-label="Audio files" tabIndex={-1} disabled={busy} onChange={e=>{void choose(Array.from(e.target.files||[]));e.target.value='';}}/>
 <Input type="file" multiple ref={fileInput} accept={mediaAccept.split(',').filter(type=>limit===undefined||BigInt(totalWords+mediaWordCost(type))<=limit).join(',')} className={styles.hidden} aria-label="Media files" aria-invalid={!!fileError} aria-describedby={fileError?'cloud-picture-error':undefined} tabIndex={-1} onChange={e=>{choose(Array.from(e.target.files||[]));e.target.value='';}} disabled={busy}/>
 <FormItem name="name" className={styles.field}><FormLabel className={styles.hidden}>{scope==='home'&&parentId==='ion'?'Add a feature name or picture':'Add a word or name your file'}</FormLabel><FormControl><Input ref={wordInput} data-cloud-input onFocus={()=>setEditing(true)} className={styles.input} style={{color:colorValue(colors?color:undefined)}} placeholder={photos.length?'Name…':limit===undefined?'Add…':limit+' '+(limit===1n?'word':'words')+'…'} autoComplete="off" enterKeyHint="send" value={form.values.name} onBeforeInput={e=>{if(busy)e.preventDefault();}} onChange={e=>{if(!busy)form.setValues({name:e.target.value});}} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onKeyDown={e=>{if(e.key==='Escape'&&editNode){e.preventDefault();onCancel?.();return;}if(e.key==='Enter'){if(e.nativeEvent.isComposing||composing.current)e.preventDefault();else if(e.ctrlKey||e.metaKey){e.preventDefault();enterAfter.current=!editNode;e.currentTarget.form?.requestSubmit();}else enterAfter.current=false;}}} readOnly={disabled} aria-busy={busy||disabled} aria-describedby={countId}/></FormControl><FormMessage className={styles.fieldError}/></FormItem>
 <span id={countId} className={styles.wordCounter} data-over-limit={overLimit} aria-label={totalWords+' words'+(limit===undefined?'':' of '+limit)}>{totalWords.toLocaleString()}{limit!==undefined&&<> / {limit.toLocaleString()}</>}</span>
 <Button type="submit" size="icon" onPointerDown={e=>{if(e.button===0&&document.activeElement===wordInput.current)e.preventDefault();}} className={styles.add} aria-label={busy?'Saving':editNode?'Save':'Add'} title={disabled?'Opening your cloud':busy?'Saving':editNode?'Save':'Add'} disabled={busy||disabled||overLimit||(!form.values.name.trim()&&!photos.length&&!retained.length)} aria-busy={busy}>{busy?<span className={styles.saving}/>:editNode?<Check size={24}/>:<ArrowUp size={24} strokeWidth={2}/>}</Button>
 </div>
 {fileError&&<p id="cloud-picture-error" className={styles.error} role="alert">{fileError}</p>}
 </form></Form></div>;
}
