import {useSyncExternalStore} from 'react';
import {previousPageStep,nextPageStep,safeBackTarget,subscribeVisitedPages,visitedPagesVersion} from '../helpers/visitedPages';
import { Link,useLocation,useNavigate } from 'react-router-dom';
import { ChevronLeft,ChevronRight } from 'lucide-react';
import { Button } from './Button';
import styles from './FloatingBack.module.css';
export function FloatingBack({to,label='Back',root=false,inline=false}:{to:string;label?:string;root?:boolean;inline?:boolean}){
 const navigate=useNavigate();useLocation();
 useSyncExternalStore(subscribeVisitedPages,visitedPagesVersion,()=>0);
 const index=typeof window==='undefined'?0:Number(window.history.state?.idx)||0,forward=nextPageStep(index);
 if(root&&!forward)return null;
 return <div className={styles.bubble+(inline?' '+styles.inline:'')} data-forward={forward>0} role="group" aria-label="Page navigation">
  {root&&index===0?<Button disabled variant="ghost" size="icon" className={styles.arrow} aria-label={label}><ChevronLeft aria-hidden="true"/></Button>:<Button asChild variant="ghost" size="icon" className={styles.arrow}><Link to={safeBackTarget(to)} state={{restoreCamera:true}} aria-label={label} onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.shiftKey&&index>0){e.preventDefault();const step=previousPageStep(index);if(step)navigate(step);else navigate(safeBackTarget(to),{replace:true,state:{restoreCamera:true}});}}}><ChevronLeft aria-hidden="true"/></Link></Button>}
  <span className={styles.forward} aria-hidden={!forward} inert={!forward}><Button variant="ghost" size="icon" className={styles.arrow} aria-label="Forward" disabled={!forward} tabIndex={forward?0:-1} onClick={()=>{const step=nextPageStep(index);if(step>0)navigate(step);}}><ChevronRight aria-hidden="true"/></Button></span>
 </div>;
}
