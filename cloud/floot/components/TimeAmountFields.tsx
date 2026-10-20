import { useId } from 'react';
import { Input } from './Input';
import { timeFromSeconds } from '../helpers/timeMath';
import styles from './TimeSpace.module.css';
export type TimeFields={hours:string;minutes:string;seconds:string};
export function timeFieldsAmount(fields:TimeFields){if(!/^\d{0,9}$/.test(fields.hours)||!/^\d{0,2}$/.test(fields.minutes)||Number(fields.minutes||0)>59)throw new Error('Use whole hours and 0–59 minutes.');const seconds=timeFromSeconds(fields.seconds||'0');if(BigInt(seconds)>=60000000n)throw new Error('Use seconds below 60.');return (BigInt(fields.hours||0)*3600000000n+BigInt(fields.minutes||0)*60000000n+BigInt(seconds)).toString();}
export function TimeAmountFields({value,onChange,disabled}:{value:TimeFields;onChange:(value:TimeFields)=>void;disabled:boolean}){const id=useId();return <div className={styles.amount}>{(['hours','minutes','seconds'] as const).map(unit=><label className={styles.field} key={unit} htmlFor={id+unit}>{unit[0].toUpperCase()+unit.slice(1)}<Input id={id+unit} aria-label={unit[0].toUpperCase()+unit.slice(1)} inputMode={unit==='seconds'?'decimal':'numeric'} autoComplete="off" value={value[unit]} placeholder="0" readOnly={disabled} onChange={e=>onChange({...value,[unit]:e.target.value})}/></label>)}</div>;}
