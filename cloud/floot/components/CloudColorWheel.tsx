import { useEffect,useMemo,useRef } from 'react';
import { colorWheelPoint,colorWheelMarker } from '../helpers/colorWheelGeometry';
import { spectrumSoftness,colorHue,colorName,colorValue,spectrumColor,unusedColor,type CloudColor } from '../helpers/cloudColors';
import styles from './CloudColorWheel.module.css';
const noColors:CloudColor[]=[];
let palette:ImageData|undefined;
function paint(canvas:HTMLCanvasElement){
 const ctx=canvas.getContext('2d');if(!ctx?.createImageData||!ctx.putImageData)return;
 const size=canvas.width;
 if(!palette){palette=ctx.createImageData(size,size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const distance=Math.hypot(x+.5-size/2,y+.5-size/2)/(size/2);if(distance>1)continue;
  const point=colorWheelPoint(x+.5,y+.5,size),hex=spectrumColor(point.hue,point.softness),offset=(y*size+x)*4;
  for(let c=0;c<3;c++)palette.data[offset+c]=parseInt(hex.slice(1+c*2,3+c*2),16);
  palette.data[offset+3]=Math.round(Math.min(1,(1-distance)*size/2)*255);
 }}ctx.putImageData(palette,0,0);
}
export function CloudColorWheel({value,onChange,disabled=false,usedColors=noColors}:{value:CloudColor;onChange:(c:CloudColor)=>void;disabled?:boolean;usedColors?:readonly (CloudColor|undefined)[]}){
 const softness=useMemo(()=>spectrumSoftness(value),[value]),hue=colorHue(value),lastHue=useRef(hue),canvas=useRef<HTMLCanvasElement>(null),root=useRef<HTMLDivElement>(null);
 const gesture=useRef<{id:number;x:number;y:number}|null>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),whiteHeld=useRef(false);
 const cancel=()=>{clearTimeout(timer.current);gesture.current=null;};
 useEffect(()=>{if(canvas.current)paint(canvas.current);},[]);
 useEffect(()=>{if(softness<.99)lastHue.current=hue;},[hue,softness]);
 useEffect(()=>{if(disabled)cancel();return cancel;},[disabled]);
 const marker=colorWheelMarker(hue, value==='white'?1:softness);
 function choose(x:number,y:number){const bounds=root.current?.getBoundingClientRect();if(!bounds)return;const point=colorWheelPoint(x-bounds.left,y-bounds.top,bounds.width,lastHue.current);lastHue.current=point.hue;onChange(unusedColor(spectrumColor(point.hue,point.softness),usedColors));}
 function finish(id:number){if(gesture.current?.id!==id)return;cancel();if(root.current?.hasPointerCapture?.(id))root.current.releasePointerCapture(id);}
 return <div className={styles.wrap}><div ref={root} className={styles.wheel} data-color-wheel role="slider" tabIndex={disabled?-1:0} aria-label="Word color" aria-disabled={disabled} aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(hue)} aria-valuetext={colorName(value)+' · '+Math.round(softness*100)+'% soft'} aria-description="Around for hue, toward the center for softness. Left and right change hue; up and down change softness. Hold or press W for white." title="Around for hue · Inward for softness · Hold for white"
 onPointerDown={e=>{if(e.button!==0||disabled||gesture.current)return;e.preventDefault();const active=document.activeElement;if(e.pointerType==='mouse'&&!(active?.matches('input,textarea')&&active.closest('form')===e.currentTarget.closest('form')))e.currentTarget.focus({preventScroll:true});whiteHeld.current=false;gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture?.(e.pointerId);choose(e.clientX,e.clientY);timer.current=setTimeout(()=>{if(gesture.current){whiteHeld.current=true;onChange('white');}},300);}}
 onPointerMove={e=>{const start=gesture.current;if(!start||start.id!==e.pointerId||disabled)return;e.preventDefault();if(whiteHeld.current)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>8)clearTimeout(timer.current);choose(e.clientX,e.clientY);}}
 onPointerUp={e=>{e.preventDefault();finish(e.pointerId);}} onPointerCancel={e=>finish(e.pointerId)} onLostPointerCapture={e=>{if(gesture.current?.id===e.pointerId)cancel();}}
 onContextMenu={e=>e.preventDefault()}
 onKeyDown={e=>{if(disabled||e.ctrlKey||e.metaKey||e.altKey)return;let h=lastHue.current,t=softness;const step=e.shiftKey?10:2;whiteHeld.current=false;
 if(e.key.toLowerCase()==='w'){e.preventDefault();cancel();onChange('white');return;}
 if(e.key==='ArrowLeft')h-=step;else if(e.key==='ArrowRight')h+=step;else if(e.key==='ArrowUp')t=Math.min(1,t+.05);else if(e.key==='ArrowDown')t=Math.max(0,t-.05);else if(e.key==='Home')t=0;else if(e.key==='End')t=1;else return;
 e.preventDefault();e.stopPropagation();lastHue.current=(h+360)%360;onChange(unusedColor(spectrumColor(h,t),usedColors));}}>
 <canvas ref={canvas} width={160} height={160} className={styles.palette} aria-hidden="true"/>
 <span className={styles.marker} style={{left:marker.x+'%',top:marker.y+'%',background:colorValue(value)}}/>
 </div></div>;
}
