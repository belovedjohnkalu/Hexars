import {isPagePane,type PageDirection} from './pageWorkspace';
export type PageAction=
 |{action:'split';direction:PageDirection}
 |{action:'close'}|{action:'refresh'}|{action:'tiles'}|{action:'tile-step';step:1|-1}
 |{action:'focus';direction:PageDirection}|{action:'tile-direction';direction:PageDirection}
 |{action:'move';target:number;direction:PageDirection}
 |{action:'drag';phase:'move'|'end'|'cancel';dx:number;dy:number;startX:number;startY:number};
export function validPageAction(value:unknown):value is PageAction{
 if(!value||typeof value!=='object')return false;const a=value as Record<string,unknown>,directions=['left','right','up','down'];
 if(['close','refresh','tiles'].includes(String(a.action)))return true;
 if(a.action==='tile-step')return a.step===1||a.step===-1;
 if(['split','focus','tile-direction'].includes(String(a.action)))return directions.includes(String(a.direction));
 if(a.action==='move')return Number.isSafeInteger(a.target)&&Number(a.target)>=0&&directions.includes(String(a.direction));
 return a.action==='drag'&&['move','end','cancel'].includes(String(a.phase))&&['dx','dy','startX','startY'].every(k=>typeof a[k]==='number'&&Number.isFinite(a[k])&&Math.abs(Number(a[k]))<100000);
}
export function requestPageAction(detail:PageAction){if(isPagePane())window.parent.postMessage({type:'ion.page-action',...detail},location.origin);else window.dispatchEvent(new window.CustomEvent('ion.page-action',{detail}));}
export function pageKeyboardAction(event:KeyboardEvent,multiple:boolean):PageAction|null{
 if(!/^Arrow(Left|Right|Up|Down)$/.test(event.key))return null;
 const direction=event.key.slice(5).toLowerCase() as PageDirection;
 if(event.ctrlKey||event.metaKey)return{action:'tile-direction',direction};
 return multiple&&(direction==='left'||direction==='right')?{action:'focus',direction}:null;
}
