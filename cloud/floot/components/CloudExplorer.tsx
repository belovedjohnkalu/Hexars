import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AppHead } from "./AppHead";
import { Button } from "./Button";
import { InstallControl } from "./InstallControl";
import { HexLoading } from "./HexLoading";
import { CloudCanvas } from "./CloudCanvas";
import { CloudComposer } from "./CloudComposer";
import { cloudTree } from "../helpers/cloudTree";
import { useCloudSpace } from "../helpers/useCloudSpace";
import styles from "./CloudExplorer.module.css";
type Draft = {name:string;file?:File};
const draftCache = new Map<string,Draft>();
export function CloudExplorer() {
  const space=useCloudSpace(), location=useLocation(), navigate=useNavigate();
  const id=new URLSearchParams(location.search).get("cloud");
  const current=space.nodes.find(n=>n.id===id);
  const missing=!!id&&!current&&!space.loading;
  const [opening,setOpening]=useState<string|null>(null),[announcement,setAnnouncement]=useState("");
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null),heading=useRef<HTMLHeadingElement>(null),scroll=useRef<HTMLElement>(null);
  const drafts=useRef(draftCache);
  const app=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const viewport=window.visualViewport;
    const resize=()=>{
      if(!app.current)return;
      app.current.style.setProperty("--viewport-height",(viewport?.height||window.innerHeight)+"px");
      app.current.style.setProperty("--composer-bottom",viewport&&window.innerHeight-viewport.height>150?"64px":"76px");
    };
    resize();viewport?.addEventListener("resize",resize);window.addEventListener("resize",resize);
    return()=>{viewport?.removeEventListener("resize",resize);window.removeEventListener("resize",resize);};
  },[]);
  const onDraft=useCallback((draft:Draft)=>{drafts.current.set(id||"root",draft);},[id]);
  useEffect(()=>{
    setOpening(null);setAnnouncement("");
    scroll.current?.scrollTo({top:0});
    heading.current?.focus({preventScroll:true});
    return()=>{if(timer.current)clearTimeout(timer.current);};
  },[id]);
  function open(event:MouseEvent<HTMLAnchorElement>,nodeId:string,url:string) {
    if(event.metaKey||event.ctrlKey||event.altKey||event.shiftKey||event.button!==0)return;
    event.preventDefault();if(opening)return;
    setOpening(nodeId);
    const delay=window.matchMedia("(prefers-reduced-motion: reduce)").matches?0:190;
    timer.current=setTimeout(()=>{navigate(url);},delay);
  }
  const parent=current?.parentId?"/?cloud="+encodeURIComponent(current.parentId):"/";
  const path=cloudTree.path(space.nodes,id);
  return <div ref={app} className={styles.app} data-cloud={id||"root"}>
    <AppHead title={current?current.name+" · ION":"ION"}/>
    <header className={styles.header}>
      {id?<Button asChild variant="ghost" size="icon" className={styles.back}><Link to={parent} aria-label={current?.parentId?"Back to "+(space.nodes.find(n=>n.id===current.parentId)?.name||"parent cloud"):"Back to ION"} title="Back"><ArrowLeft size={25} strokeWidth={1.6}/></Link></Button>:<span/>}
      <h1 ref={heading} tabIndex={-1} className={styles.title}>{missing?"Cloud unavailable":current?.name||"ION"}</h1>
      <div className={styles.install}><InstallControl/></div>
    </header>
    <main ref={scroll} className={styles.main}>
      {current?.note&&<p className={styles.note}>{current.note}</p>}
      {missing?<div className={styles.message}><p>This cloud isn’t in your space.</p><Button variant="ghost" asChild><Link to="/">Return to ION</Link></Button></div>:<>
        {space.loading&&<div className={styles.loading} role="status" aria-label="Opening your space"><HexLoading/></div>}
        <CloudCanvas nodes={space.nodes} parentId={id} onOpen={open} opening={opening} loading={space.loading}/>
      </>}
    </main>
    <footer className={styles.footer}>
      {space.error&&<div className={styles.error} role="alert"><span>{space.error}</span><Button variant="ghost" size="sm" disabled={space.busy} onClick={()=>void space.retry()}>Retry</Button></div>}
      {!missing&&<CloudComposer key={id||"root"} parentId={id} busy={space.busy} disabled={space.loading||!!space.error} draft={drafts.current.get(id||"root")||{name:""}} onDraft={onDraft} onAdd={async value=>{const ok=await space.add(value);if(ok)setAnnouncement(value.name+" added.");return ok;}}/>}
      <p className={styles.srOnly} role="status" aria-live="polite">{announcement}</p>
    </footer>
    <nav aria-label="Cloud path" className={styles.srOnly}><Link to="/">ION</Link>{path.map(n=><Link key={n.id} to={"/?cloud="+encodeURIComponent(n.id)} aria-current={n.id===id?"page":undefined}>{n.name}</Link>)}</nav>
  </div>;
}
