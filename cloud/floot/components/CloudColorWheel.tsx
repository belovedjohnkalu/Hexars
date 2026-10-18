import type { CSSProperties } from 'react';
import { Slider } from './Slider';
import { colorHue,colorName,colorValue,spectrumColor,unusedColor,type CloudColor } from '../helpers/cloudColors';
import styles from './CloudColorWheel.module.css';
const noColors:CloudColor[]=[];
export function CloudColorWheel({value,onChange,disabled=false,usedColors=noColors}:{value:CloudColor;onChange:(c:CloudColor)=>void;disabled?:boolean;usedColors?:readonly (CloudColor|undefined)[]}){
 return <div className={styles.wheel} data-color-wheel>
  <Slider appearance="spectrum" className={styles.spectrum} min={0} max={359.99} step={.01} value={[colorHue(value)]} onValueChange={([hue])=>onChange(unusedColor(spectrumColor(hue),usedColors))} disabled={disabled} thumbLabel="Word color" thumbValueText={colorName(value)} style={{'--selected-color':colorValue(value)} as CSSProperties}/>
 </div>;
}
