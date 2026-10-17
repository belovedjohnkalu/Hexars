import { useLayoutEffect,useRef,useState } from 'react';
import { PageControls } from './PageControls';
import styles from './PagedText.module.css';
export function PagedText({text}:{text:string}){
 const area=useRef<HTMLDivElement>(null),probe=useRef<HTMLParagraphElement>(null),[pages,setPages]=useState([text]),[page,setPage]=useState(0);
 useLayoutEffect(()=>{const el=area.current,p=probe.current;if(!el||!p)return;let alive=true;const measure=()=>{if(!alive)return;const words=text.split(/\s+/),result:string[]=[];let start=0;const height=Math.max(25,el.clientHeight);while(start<words.length){let lo=1,hi=words.length-start,fit=1;while(lo<=hi){const n=Math.floor((lo+hi)/2);p.textContent=words.slice(start,start+n).join(' ');if(p.getBoundingClientRect().height<=height){fit=n;lo=n+1;}else hi=n-1;}result.push(words.slice(start,start+fit).join(' '));start+=fit;}if(alive){setPages(result.length?result:['']);setPage(i=>Math.min(i,Math.max(0,result.length-1)));}};const observer=new ResizeObserver(measure);observer.observe(el);measure();void document.fonts.ready.then(measure);return()=>{alive=false;observer.disconnect();};},[text]);
 return <div className={styles.content}><div className={styles.area} ref={area}><p data-reading-page={page} className={styles.text} key={page}>{pages[page]||''}</p><p ref={probe} className={styles.probe} aria-hidden="true"/></div><PageControls page={page} total={pages.length} onChange={setPage} label="Paragraph page"/></div>;
}
