import { Spinner } from './Spinner';
import styles from './LoadingScreen.module.css';
export function LoadingScreen({label='Opening…'}:{label?:string}){return <div className={styles.screen}><Spinner size="lg" aria-label={label}/></div>;}
