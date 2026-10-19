import {markPaths} from '../helpers/appMark';
export function AppMark({className}:{className?:string}){return <svg viewBox="0 0 1280 1280" className={className} aria-hidden="true" focusable="false">{markPaths.map((d,i)=><path key={i} d={d} pathLength={1} fill="none" stroke="currentColor" strokeWidth={14} strokeLinejoin="miter"/>)}</svg>;}
