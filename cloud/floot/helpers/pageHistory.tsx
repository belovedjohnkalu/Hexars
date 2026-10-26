import {safePageURL} from './pageURL';
import {isControlsPage} from './visitedPages';
export type PageHistory={entries:string[];cursor:number;returns?:Record<number,number>};
export function readPageHistory(raw:unknown,url:string):PageHistory{
 const h=raw as PageHistory;if(!h||!Array.isArray(h.entries)||!h.entries.length||!h.entries.every(p=>typeof p==='string'&&safePageURL(p)===p)||!Number.isSafeInteger(h.cursor)||h.cursor<0||h.cursor>=h.entries.length)return{entries:[safePageURL(url)||'/'],cursor:0};
 const returns:Record<number,number>={};for(const[k,v]of Object.entries(h.returns||{})){const n=Number(k);if(Number.isSafeInteger(n)&&n>=0&&n<h.entries.length&&Number.isSafeInteger(v)&&v>n&&v<h.entries.length)returns[n]=v;}
 const cursor=h.entries[h.cursor]===url?h.cursor:h.entries.lastIndexOf(url);return cursor>=0?{entries:[...h.entries],cursor,returns}:pushPageHistory({...h,returns},url);
}
export function pushPageHistory(h:PageHistory,path:string,replace=false):PageHistory{
 const url=safePageURL(path);if(!url||h.entries[h.cursor]===url)return h;
 if(replace)return{...h,entries:h.entries.map((p,i)=>i===h.cursor?url:p)};
 return{entries:[...h.entries.slice(0,h.cursor+1),url],cursor:h.cursor+1,returns:Object.fromEntries(Object.entries(h.returns||{}).filter(([k,v])=>Number(k)<h.cursor&&v<h.cursor))};
}
export function pageHistoryTarget(h:PageHistory,step:1|-1){
 if(step===1){const remembered=h.returns?.[h.cursor];if(remembered!==undefined&&remembered<h.entries.length&&!isControlsPage(h.entries[remembered])&&h.entries[remembered]!==h.entries[h.cursor])return remembered;}
 for(let i=h.cursor+step;i>=0&&i<h.entries.length;i+=step)if(!isControlsPage(h.entries[i])&&h.entries[i]!==h.entries[h.cursor])return i;return null;
}
export function stepPageHistory(h:PageHistory,step:1|-1):PageHistory{
 const cursor=pageHistoryTarget(h,step);return cursor===null?h:{...h,cursor,...(step===-1?{returns:{...h.returns,[cursor]:h.cursor}}:{})};
}
