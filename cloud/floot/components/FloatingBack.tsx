import {paneNavigation} from '../helpers/paneNavigation';
import {useSyncExternalStore} from 'react';
import {previousPageStep,nextPageStep,safeBackTarget,subscribeVisitedPages,visitedPagesVersion} from '../helpers/visitedPages';
import { Link,useLocation,useNavigate } from 'react-router-dom';
import { ChevronLeft,ChevronRight } from 'lucide-react';
import { Button } from './Button';
import styles from './FloatingBack.module.css';
export function FloatingBack({to,label='Back',root=false,inline=false}:{to:string;label?:string;root?:boolean;inline?:boolean}){
 const navigate=useNavigate();useLocation();
 useSyncExternalStore(subscribeVisitedPages,visitedPagesVersion,()=>0);
 useSyncExternalStore(paneNavigation.subscribe,paneNavigation.version,()=>0);const pane=paneNavigation.get();
 const index=typeof window==='undefined'?0:Number(window.history.state?.idx)||0,forward=pane?(paneNavigation.can(1)?1:0):nextPageStep(index);
 if(root&&!forward)return null;
 return <div className={styles.bubble+(inline?' '+styles.inline:'')} data-forward={forward>0} role="group" aria-label="Page navigation">
  {root&&(pane?!paneNavigation.can(-1):index===0)?<Button disabled variant="ghost" size="icon" className={styles.arrow} aria-label={label}><ChevronLeft aria-hidden="true"/></Button>:<Button asChild variant="ghost" size="icon" className={styles.arrow}><Link to={safeBackTarget(to)} state={{restoreCamera:true}} aria-label={label} onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.shiftKey&&(pane||index>0)){e.preventDefault();if(pane){const previous=paneNavigation.step(-1);navigate(previous||safeBackTarget(to),{replace:!!previous,state:{restoreCamera:true}});return;}const step=previousPageStep(index);if(step)navigate(step);else navigate(safeBackTarget(to),{replace:true,state:{restoreCamera:true}});}}}><ChevronLeft aria-hidden="true"/></Link></Button>}
  <span className={styles.forward} aria-hidden={!forward} inert={!forward}><Button variant="ghost" size="icon" className={styles.arrow} aria-label="Forward" disabled={!forward} tabIndex={forward?0:-1} onClick={()=>{if(pane){const next=paneNavigation.step(1);if(next)navigate(next,{replace:true,state:{restoreCamera:true}});return;}const step=nextPageStep(index);if(step>0)navigate(step);}}><ChevronRight aria-hidden="true"/></Button></span>
 </div>;
}
