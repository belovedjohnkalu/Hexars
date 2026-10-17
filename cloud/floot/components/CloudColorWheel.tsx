import { useRef,type CSSProperties } from 'react';
import { RadioGroup,RadioGroupItem } from './RadioGroup';
import { cloudColors,colorName,colorValue,type CloudColor } from '../helpers/cloudColors';
import styles from './CloudColorWheel.module.css';
export function CloudColorWheel({value,onChange,disabled=false}:{value:CloudColor;onChange:(c:CloudColor)=>void;disabled?:boolean}){
 const start=useRef<{x:number;index:number}|null>(null),moved=useRef(false),index=Math.max(0,cloudColors.indexOf(value));
 const choose=(n:number)=>{if(!disabled)onChange(cloudColors[Math.max(0,Math.min(cloudColors.length-1,n))]);};
 return <div className={styles.wheel} data-color-wheel onWheel={e=>{choose(index+Math.sign(e.deltaX||e.deltaY));}} onPointerDown={e=>{if(e.button!==0)return;start.current={x:e.clientX,index};moved.current=false;}} onPointerMove={e=>{if(!start.current)return;const steps=Math.round((start.current.x-e.clientX)/44);if(steps){moved.current=true;e.currentTarget.setPointerCapture(e.pointerId);choose(start.current.index+steps);}}} onPointerUp={e=>{start.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{start.current=null;}} onClickCapture={e=>{if(moved.current){e.preventDefault();e.stopPropagation();moved.current=false;}}}>
 <RadioGroup value={value} onValueChange={v=>onChange(v as CloudColor)} orientation="horizontal" className={styles.track} aria-label="Word color" style={{transform:`translateX(calc(50% - ${index*44+22}px))`}}>{cloudColors.map(c=><RadioGroupItem key={c} value={c} disabled={disabled} onFocus={()=>{if(!disabled)onChange(c);}} aria-label={colorName(c)} className={styles.swatch} style={{'--swatch':colorValue(c)} as CSSProperties}/>)}</RadioGroup><span className={styles.selection} aria-hidden="true"/>
 </div>;
}
