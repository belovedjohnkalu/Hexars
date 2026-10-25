import {useState,type ReactNode} from 'react';
import {FloatingBack} from './FloatingBack';
import styles from './ComposerDock.module.css';
export function ComposerDock({to,root=false,children}:{to:string;root?:boolean;children:ReactNode}){const[active,setActive]=useState(false);return <div data-composer-dock data-dock-active={active} className={styles.dock} onFocusCapture={e=>{if((e.target as HTMLElement).hasAttribute('data-cloud-input'))setActive(true);}} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setActive(false);}}><div className={styles.navigation} aria-hidden={active} inert={active}><FloatingBack inline root={root} to={to}/></div><div className={styles.composer}>{children}</div></div>;}
