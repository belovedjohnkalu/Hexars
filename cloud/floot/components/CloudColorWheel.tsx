import { useEffect,useMemo,useRef,type CSSProperties } from 'react';
import { Slider } from './Slider';
import { spectrumSoftness,spectrumGradient,softnessGradient,colorHue,colorName,colorValue,spectrumColor,unusedColor,type CloudColor } from '../helpers/cloudColors';
import styles from './CloudColorWheel.module.css';
const noColors:CloudColor[]=[];
export function CloudColorWheel({value,onChange,disabled=false,usedColors=noColors}:{value:CloudColor;onChange:(c:CloudColor)=>void;disabled?:boolean;usedColors?:readonly (CloudColor|undefined)[]}){
 const softness=useMemo(()=>spectrumSoftness(value),[value]),hue=colorHue(value);
 const hold=useRef<{id:number;x:number;y:number}|null>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),whiteHeld=useRef(false);
 const cancel=()=>{clearTimeout(timer.current);hold.current=null;};
 useEffect(()=>{if(disabled)cancel();return cancel;},[disabled]);
 return <div className={styles.wheel} data-color-wheel title="Hold for white · W when focused"
 onPointerDownCapture={e=>{if(e.button!==0||disabled)return;cancel();whiteHeld.current=false;hold.current={id:e.pointerId,x:e.clientX,y:e.clientY};timer.current=setTimeout(()=>{if(!hold.current)return;whiteHeld.current=true;onChange('white');},300);}}
 onPointerMoveCapture={e=>{if(whiteHeld.current){e.preventDefault();return;}const start=hold.current;if(start&&(e.pointerId!==start.id||Math.hypot(e.clientX-start.x,e.clientY-start.y)>8))cancel();}}
 onPointerUpCapture={cancel} onPointerCancelCapture={cancel} onLostPointerCapture={cancel}
 onContextMenu={e=>e.preventDefault()}
 onKeyDownCapture={e=>{whiteHeld.current=false;if(!disabled&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.toLowerCase()==='w'){e.preventDefault();e.stopPropagation();onChange('white');}}}>
  <Slider preserveInputFocusOnTouch appearance="spectrum" className={styles.spectrum} min={0} max={359.99} step={.01} value={[colorHue(value)]} onValueChange={([hue])=>{if(!whiteHeld.current)onChange(unusedColor(spectrumColor(hue,softness),usedColors));}} disabled={disabled} thumbLabel="Word color" thumbValueText={colorName(value)} style={{'--selected-color':colorValue(value),'--spectrum-gradient':spectrumGradient(softness)} as CSSProperties}/>
  <Slider preserveInputFocusOnTouch appearance="spectrum" className={styles.spectrum} min={0} max={1} step={.01} value={[softness]} onValueChange={([tone])=>{if(!whiteHeld.current)onChange(unusedColor(spectrumColor(hue,tone),usedColors));}} disabled={disabled} thumbLabel="Color softness" thumbValueText={Math.round(softness*100)+'% soft'} title="Rich to soft" style={{'--selected-color':colorValue(value),'--spectrum-gradient':softnessGradient(hue)} as CSSProperties}/>
 </div>;
}
