import {previousPageStep,safeBackTarget} from '../helpers/visitedPages';
import { Link,useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import styles from './FloatingBack.module.css';
export function FloatingBack({to,label='Back'}:{to:string;label?:string}){const navigate=useNavigate();return <Button asChild variant="ghost" size="icon" className={styles.bubble}><Link to={safeBackTarget(to)} state={{restoreCamera:true}} aria-label={label} onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.shiftKey&&typeof window.history.state?.idx==='number'&&window.history.state.idx>0){e.preventDefault();const step=previousPageStep(window.history.state.idx);if(step)navigate(step);else navigate(safeBackTarget(to),{replace:true,state:{restoreCamera:true}});}}}><ArrowLeft aria-hidden="true"/></Link></Button>;}
