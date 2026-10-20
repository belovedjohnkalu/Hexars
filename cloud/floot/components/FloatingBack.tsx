import { Link,useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import styles from './FloatingBack.module.css';
export function FloatingBack({to,label='Back'}:{to:string;label?:string}){const navigate=useNavigate();return <Button asChild variant="ghost" size="icon" className={styles.bubble}><Link to={to} state={{restoreCamera:true}} aria-label={label} onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!e.shiftKey&&typeof window.history.state?.idx==='number'&&window.history.state.idx>0){e.preventDefault();navigate(-1);}}}><ArrowLeft aria-hidden="true"/></Link></Button>;}
