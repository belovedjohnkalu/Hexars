import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from './Button';
import styles from './FloatingBack.module.css';
export function FloatingBack({to,label='Back'}:{to:string;label?:string}){return <Button asChild variant="ghost" size="icon" className={styles.bubble}><Link to={to} state={{restoreCamera:true,skipAutoAdvance:true}} aria-label={label}><ArrowLeft aria-hidden="true"/></Link></Button>;}
