import {paneNavigation} from '../helpers/paneNavigation';
import {hierarchyNavigation} from '../helpers/hierarchyNavigation';
import {deviceData} from '../helpers/deviceData';
import {useEffect,useSyncExternalStore} from 'react';
import {safeBackTarget} from '../helpers/visitedPages';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {ChevronUp,ChevronDown} from 'lucide-react';
import {Button} from './Button';
import styles from './FloatingBack.module.css';
export function FloatingBack({to,root=false,inline=false,persistentForward=false}:{to:string;label?:string;root?:boolean;inline?:boolean;persistentForward?:boolean}){
 const navigate=useNavigate(),location=useLocation();useSyncExternalStore(paneNavigation.subscribe,paneNavigation.version,()=>0);useSyncExternalStore(hierarchyNavigation.subscribe,hierarchyNavigation.version,()=>0);
 const key=paneNavigation.get()?.key||'browser:'+(deviceData.identity()||'guest'),url=location.pathname+location.search+location.hash,parent=safeBackTarget(to),child=hierarchyNavigation.child(key,url),up=!root&&url!==parent;
 useEffect(()=>{if(up)hierarchyNavigation.record(key,url,parent);},[key,url,parent,up]);
 if(!up&&!child&&!persistentForward)return null;
 return <div className={styles.bubble+(inline?' '+styles.inline:'')} data-forward={!!child||persistentForward} role="group" aria-label="Cloud hierarchy">
 {up?<Button asChild variant="ghost" size="icon" className={styles.arrow}><Link to={parent} aria-label="Up" title="Parent cloud" state={{restoreCamera:true}}><ChevronUp aria-hidden="true"/></Link></Button>:<Button disabled variant="ghost" size="icon" className={styles.arrow} aria-label="Up"><ChevronUp aria-hidden="true"/></Button>}
 <span className={styles.forward} aria-hidden={!child&&!persistentForward} inert={!child&&!persistentForward}><Button variant="ghost" size="icon" className={styles.arrow} aria-label="Down" title="Previously opened droplet" disabled={!child} tabIndex={child?0:-1} onClick={()=>{if(child)navigate(child,{state:{restoreCamera:true}});}}><ChevronDown aria-hidden="true"/></Button></span>
 </div>;
}
