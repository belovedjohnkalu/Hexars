import { ChevronLeft,ChevronRight } from 'lucide-react';
import { Button } from './Button';
import styles from './PageControls.module.css';
export function PageControls({page,total,onChange,label='Page'}:{page:number;total:number;onChange:(page:number)=>void;label?:string}){if(total<2)return null;return <div className={styles.controls} role="group" aria-label={label+' navigation'}><Button variant="ghost" size="icon" aria-label={'Previous '+label.toLowerCase()} disabled={page<=0} onClick={()=>onChange(page-1)}><ChevronLeft size={18}/></Button><span role="status" aria-live="polite">{page+1} / {total}</span><Button variant="ghost" size="icon" aria-label={'Next '+label.toLowerCase()} disabled={page>=total-1} onClick={()=>onChange(page+1)}><ChevronRight size={18}/></Button></div>;}
