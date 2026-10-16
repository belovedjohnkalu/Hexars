import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { ArrowLeft, ChevronDown, Pencil, Trash2, Undo2, Check } from "lucide-react";
import { AppHead } from "./AppHead";
import { Button } from "./Button";
import { InstallControl } from "./InstallControl";
import { HexLoading } from "./HexLoading";
import { CloudCanvas } from "./CloudCanvas";
import { CloudComposer } from "./CloudComposer";
import { CloudActions } from "./CloudActions";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./DropdownMenu";
import { cloudTree } from "../helpers/cloudTree";
import { cloudDrafts } from "../helpers/cloudDrafts";
import { useCloudSpace } from "../helpers/useCloudSpace";
import styles from "./CloudExplorer.module.css";
const positions=new Map<string,number>(),returnTargets=new Map<string,string>();
export function CloudExplorer(){
  const space=useCloudSpace(),location=useLocation(),navigate=useNavigate(),navigationType=useNavigationType();
  const id=new URLSearchParams(location.search).get("cloud"),current=space.nodes.find(n=>n.id===id),missing=!!id&&!current&&space.ready&&!space.loading;
  const [opening,setOpening]=useState<string|null>(null),[notice,setNotice]=useState(""),[added,setAdded]=useState<string|null>(null),[action,setAction]=useState<"rename"|"remove"|null>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null),heading=useRef<HTMLHeadingElement>(null),scroll=useRef<HTMLElement>(null),app=useRef<HTMLDivElement>(null),activeId=useRef(id),entered=useRef("");
  activeId.current=id;
  const [menu,setMenu]=useState(false);
  const menuDestination=useRef<"compose"|"dialog"|null>(null);
  const removal=useRef<{id:string;operationId:string;count:number}|null>(null);
  const onDraft=useCallback((draft:{name:string;file?:File})=>cloudDrafts.set(id,draft),[id]);
  useEffect(()=>{
    const viewport=window.visualViewport;
    const resize=()=>{if(!app.current)return;app.current.style.setProperty("--viewport-height",(viewport?.height||window.innerHeight)+"px");app.current.style.setProperty("--composer-bottom",viewport&&window.innerHeight-viewport.height>150?"64px":"76px");};
    resize();viewport?.addEventListener("resize",resize);window.addEventListener("resize",resize);
    return()=>{viewport?.removeEventListener("resize",resize);window.removeEventListener("resize",resize);};
  },[]);
  useEffect(()=>{
    const rootKey=id||"root";entered.current="";setOpening(null);setMenu(false);setAction(null);
    return()=>{if(scroll.current)positions.set(rootKey,scroll.current.scrollTop);if(timer.current)clearTimeout(timer.current);};
  },[id]);
  useEffect(()=>{
    if(entered.current===location.key||(!space.ready&&id&&!current))return;
    entered.current=location.key;
    const state=location.state as {focusNode?:string}|null;
    const restore=!!state?.focusNode||navigationType==="POP",target=state?.focusNode||(restore?returnTargets.get(id||"root"):undefined);
    const frame=requestAnimationFrame(()=>{
      if(scroll.current)scroll.current.scrollTop=restore?(positions.get(id||"root")||0):0;
      const node=target?scroll.current?.querySelector<HTMLElement>('[data-node-id="'+CSS.escape(target)+'"]'):null;
      if(node){node.focus({preventScroll:true});node.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"});}
      else heading.current?.focus({preventScroll:true});
    });
    return()=>cancelAnimationFrame(frame);
  },[id,space.ready,current?.id,location.key,navigationType]);
  useEffect(()=>{if(!notice)return;const timeout=setTimeout(()=>setNotice(""),8000);return()=>clearTimeout(timeout);},[notice]);
  useEffect(()=>{if(!added)return;const timeout=setTimeout(()=>setAdded(null),1600);return()=>clearTimeout(timeout);},[added]);
  function open(event:MouseEvent<HTMLAnchorElement>,nodeId:string,url:string){
    if(event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||event.button!==0)return;
    event.preventDefault();if(opening)return;
    returnTargets.set(id||"root",nodeId);if(scroll.current)positions.set(id||"root",scroll.current.scrollTop);setOpening(nodeId);
    timer.current=setTimeout(()=>navigate(url,{state:{fromCloud:id||"root"}}),window.matchMedia("(prefers-reduced-motion: reduce)").matches?0:190);
  }
  const count=current?cloudTree.descendants(space.nodes,current.id):space.nodes.filter(n=>n.parentId===null).length;
  const editable=!!current&&!cloudTree.seed.some(n=>n.id===current.id);
  const parent=current?.parentId?"/?cloud="+encodeURIComponent(current.parentId):"/";
  const path=cloudTree.path(space.nodes,id);
  const label=current?.name||(id?(space.loading?"Opening…":"Cloud unavailable"):"ION");
  async function remove(operationId?:string){
    if(!current)return false;
    const pending=operationId?{id:current.id,operationId,count}:removal.current?.id===current.id?removal.current:{id:current.id,operationId:crypto.randomUUID(),count};
    removal.current=pending;
    const ok=await space.remove(current.id,pending.count,pending.operationId);
    if(ok){removal.current=null;setNotice("Removed “"+current.name+"”");if((location.state as {fromCloud?:string}|null)?.fromCloud===(current.parentId||"root"))navigate(-1);else navigate(parent,{replace:true});}
    return ok;
  }
  const retry=()=>{if(removal.current?.id===id){if(removal.current.count!==count)setAction("remove");else void remove();}else if(space.ready&&(cloudDrafts.get(id).name||cloudDrafts.get(id).file))(document.getElementById("cloud-composer-form") as HTMLFormElement|null)?.requestSubmit();else void space.retry();};
  return <div ref={app} className={styles.app} data-cloud={id||"root"}>
    <AppHead title={id?label+" · ION":"ION"}/>
    <header className={styles.header}>
      {id?<Button asChild variant="ghost" size="icon" className={styles.back}><Link to={parent} state={{focusNode:current?.id}} onClick={event=>{if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&(location.state as {fromCloud?:string}|null)?.fromCloud===(current?.parentId||"root")){event.preventDefault();navigate(-1);}}} aria-label={current?.parentId?"Back to "+(space.nodes.find(n=>n.id===current.parentId)?.name||"parent cloud"):"Back to ION"} title="Back"><ArrowLeft size={25} strokeWidth={1.6}/></Link></Button>:<span/>}
      <h1 ref={heading} tabIndex={-1} className={styles.title} aria-label={label}>
        <DropdownMenu open={menu} onOpenChange={setMenu}>
          <DropdownMenuTrigger asChild><Button id="cloud-title-button" variant="ghost" className={styles.titleButton} aria-label={"Cloud options for "+label}><span>{label}</span><ChevronDown size={16} aria-hidden="true"/></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="center" className={styles.menu} onCloseAutoFocus={event=>{if(menuDestination.current){event.preventDefault();if(menuDestination.current==="compose")document.querySelector<HTMLInputElement>("#cloud-composer-form input:not([type=file])")?.focus({preventScroll:true});menuDestination.current=null;}}}>
            <DropdownMenuLabel className={styles.menuLabel}>Your space</DropdownMenuLabel>
            {!id&&<DropdownMenuItem onSelect={()=>{menuDestination.current="compose";}}>Add a word</DropdownMenuItem>}
            {id?<DropdownMenuItem asChild><Link to="/">ION</Link></DropdownMenuItem>:<DropdownMenuLabel aria-current="page">ION</DropdownMenuLabel>}
            {path.map((node,index)=>index===path.length-1?<DropdownMenuLabel key={node.id} className={styles.current} aria-current="page">{node.name}</DropdownMenuLabel>:<DropdownMenuItem key={node.id} asChild><Link to={"/?cloud="+encodeURIComponent(node.id)}>{node.name}</Link></DropdownMenuItem>)}
            <DropdownMenuSeparator/>
            <DropdownMenuLabel className={styles.explanation}>{count} {id?"droplet"+(count===1?"":"s"):"cloud"+(count===1?"":"s")} inside</DropdownMenuLabel>
            <DropdownMenuLabel className={styles.explanation}>Private to this browser</DropdownMenuLabel>
            {editable&&<><DropdownMenuSeparator/><DropdownMenuItem disabled={space.busy||!space.ready} onSelect={()=>{menuDestination.current="dialog";space.clearError();setAction("rename");}}><Pencil size={17}/>Rename</DropdownMenuItem><DropdownMenuItem className={styles.remove} disabled={space.busy||!space.ready} onSelect={()=>{space.clearError();if(count){menuDestination.current="dialog";setAction("remove");}else void remove();}}><Trash2 size={17}/>Remove</DropdownMenuItem></>}
            {space.undo&&<><DropdownMenuSeparator/><DropdownMenuItem disabled={space.busy} onSelect={()=>void space.restore(space.undo!.operationId).then(ok=>{if(ok)setNotice("Restored “"+space.undo!.name+"”");})}><Undo2 size={17}/>Undo last removal</DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
      </h1>
      <div className={styles.install}><InstallControl/></div>
    </header>
    <main ref={scroll} className={styles.main} aria-label={current?.name||"Your clouds"}>
      {current?.note&&<p className={styles.note}>{current.note}</p>}
      {missing?<div className={styles.message}><p>This cloud isn’t in your space.</p><Button variant="ghost" asChild><Link to="/">Return to ION</Link></Button></div>:<>
        {space.loading&&<div className={styles.loading} role="status" aria-label="Opening your space"><HexLoading/></div>}
        <CloudCanvas nodes={space.nodes} parentId={id} onOpen={open} opening={opening} loading={space.loading} addedId={added} onPictureError={()=>{if(!space.busy)void space.retry();}}/>
      </>}
    </main>
    <footer className={styles.footer}>
      <div className={styles.feedback}>
        {space.error&&!action?<div className={styles.error} role="alert"><span>{space.error}</span><Button variant="ghost" size="sm" disabled={space.busy} onClick={retry}>Retry</Button></div>:
        <div className={styles.status} role="status" aria-live="polite">{space.busy?<span>{space.phase==="uploading"?"Uploading picture…":"Saving…"}</span>:notice?<><Check size={15} aria-hidden="true"/><span>{notice}</span>{space.undo&&notice.startsWith("Removed")&&<Button variant="ghost" size="sm" onClick={()=>void space.restore(space.undo!.operationId).then(ok=>{if(ok)setNotice("Restored");})}>Undo</Button>}</>:null}</div>}
      </div>
      {!missing&&<CloudComposer key={id||"root"} parentId={id} busy={space.busy} disabled={!space.ready} uploading={space.phase==="uploading"} onCancelUpload={()=>{space.cancelUpload();setNotice("Upload stopped");}} draft={cloudDrafts.get(id)} onDraft={onDraft} onAdd={async value=>{
        const ok=await space.add(value);
        if(ok){setNotice("Added “"+value.name+"”");if(activeId.current===value.parentId){setAdded(value.id);requestAnimationFrame(()=>scroll.current?.querySelector('[data-node-id="'+value.id+'"]')?.scrollIntoView({block:"nearest",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"}));}}
        return ok;
      }}/>}
    </footer>
    {action&&current&&<CloudActions key={action+current.id} node={current} mode={action} count={count} busy={space.busy} error={space.error} onClose={()=>{setAction(null);space.clearError();}} onRename={async name=>{const ok=await space.rename(current.id,name);if(ok)setNotice("Renamed");return ok;}} onRemove={remove}/>}
  </div>;
}
