import {useMemo} from 'react';
import {rhombusLayout,nearestRhombus,type OpenTile} from '../helpers/pageTiles';
import {SpatialViewport} from './SpatialViewport';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from './Dialog';
import {Button} from './Button';
import styles from './PageTiles.module.css';
export function PageTiles({tiles,current,onChoose,onClose,onNew}:{tiles:OpenTile[];current:number;onChoose:(id:number)=>void;onClose:()=>void;onNew:()=>void}){
 const layout=useMemo(()=>rhombusLayout(tiles),[tiles]);
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent fullScreen className={styles.overview} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&/^Arrow(Left|Right|Up|Down)$/.test(e.key)){e.preventDefault();const id=nearestRhombus(tiles,current,e.key.slice(5).toLowerCase() as 'left'|'right'|'up'|'down');if(id!==current)onChoose(id);}}}><DialogTitle className={styles.title}>Tiles</DialogTitle><DialogDescription className={styles.description}>Your open pages</DialogDescription><div className={styles.canvas}><SpatialViewport width={layout.width} height={layout.height} viewKey="ion-tiles" label="Tiles" minFitZoom={.72} maxFitZoom={1} fitPadding={28} contentBounds={{x:0,y:0,width:layout.width,height:layout.height}}>
 {layout.tiles.map(t=>{const root=t.tile.screens.find(s=>s.id===t.tile.primary)!,selected=t.tile.id===current;return <Button key={t.tile.id} variant="ghost" className={styles.tile} data-tile-id={t.tile.id} data-current={selected} aria-current={selected?'page':undefined} aria-label={root.label+(t.tile.screens.length>1?' · '+t.tile.screens.length+' screens':'')} style={{left:t.left,top:t.top,width:t.width,height:t.height,clipPath:'polygon('+t.polygon.split(' ').map(pair=>{const[x,y]=pair.split(',').map(Number);return x/t.width*100+'% '+y/t.height*100+'%';}).join(',')+')'}} onClick={()=>onChoose(t.tile.id)}><svg viewBox={'0 0 '+t.width+' '+t.height} aria-hidden="true"><polygon points={t.polygon}/>{t.lines.map((line,i)=><line key={i} {...line}/>)}</svg><span className={styles.caption}><span>{root.label}</span>{t.tile.screens.length>1&&<small>{t.tile.screens.length} screens</small>}</span></Button>;})}
 </SpatialViewport></div><footer className={styles.footer}><Button variant="ghost" onClick={onNew}>New tile</Button><Button variant="ghost" onClick={onClose}>Done</Button></footer></DialogContent></Dialog>;
}
