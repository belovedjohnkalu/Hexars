import {useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUp,ArrowDown} from 'lucide-react';
import {requestPageAction} from '../helpers/pageWorkspaceEvents';
import type {PageDirection} from '../helpers/pageWorkspace';
import type {TileScreen} from '../helpers/pageTiles';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './Dialog';
import {Button} from './Button';
import {PageControls} from './PageControls';
import styles from './TitleScreenMenu.module.css';
export function TitleScreenMenu({screens,current,onCloudControls,onOpen,onClose}:{screens:TileScreen[];current:number;onCloudControls?:()=>void;onOpen?:()=>void;onClose:()=>void}){
 const[mode,setMode]=useState<'root'|'target'|'side'|'split'>('root'),[target,setTarget]=useState<number|null>(null),[page,setPage]=useState(0),targets=screens.filter(s=>s.id!==current);
 const run=(action:Parameters<typeof requestPageAction>[0])=>{onClose();requestPageAction(action);};
 const chooseSide=(direction:PageDirection)=>run(mode==='split'?{action:'split',direction}:{action:'move',target:target!,direction});
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className={styles.menu}><DialogTitle>{mode==='root'?'Screen':mode==='target'?'Move beside':mode==='split'?'New screen':'Place screen'}</DialogTitle><DialogDescription className={styles.sr}>Arrange screens or open cloud controls.</DialogDescription>
 <div className={styles.choices}>{mode==='root'?<>
 {onOpen&&<Button variant="ghost" onClick={()=>{onClose();onOpen();}}>View cloud</Button>}{onCloudControls&&<Button variant="ghost" onClick={()=>{onClose();onCloudControls();}}>Cloud controls</Button>}
 <Button variant="ghost" onClick={()=>setMode('split')}>Split screen</Button>{targets.length>0&&<Button variant="ghost" onClick={()=>setMode('target')}>Move screen</Button>}
 <Button variant="ghost" onClick={()=>run({action:'tiles'})}>Tiles</Button><Button variant="ghost" className={styles.close} onClick={()=>run({action:'close'})}>Close screen</Button>
 </>:mode==='target'?<>{targets.slice(page*2,page*2+2).map(s=><Button variant="ghost" key={s.id} aria-label={s.label} title={s.label} onClick={()=>{setTarget(s.id);setMode('side');}}><span className={styles.screenName}>{s.label}</span></Button>)}<PageControls page={page} total={Math.ceil(targets.length/2)} onChange={setPage} label="Screens"/></>:<div className={styles.directions}>{([['left',ArrowLeft,'Left'],['right',ArrowRight,'Right'],['up',ArrowUp,'Above'],['down',ArrowDown,'Below']] as const).map(([direction,Icon,label])=><Button variant="ghost" key={direction} onClick={()=>chooseSide(direction)}><Icon size={20}/>{label}</Button>)}</div>}
 </div>{mode!=='root'&&<Button variant="ghost" onClick={()=>setMode('root')}>Back</Button>}
 </DialogContent></Dialog>;
}
