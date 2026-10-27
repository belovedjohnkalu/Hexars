import type { CloudColor } from "./cloudColors";
import type { CloudPhotoDraft } from './cloudPhotos';
type Draft={name:string;file?:File;photos?:CloudPhotoDraft[];color?:CloudColor;retainMedia?:number[]};
const cache=new Map<string,Draft>();
const storageKey="ion.word-drafts.v1";
function read():Record<string,string>{try{const value=JSON.parse(sessionStorage.getItem(storageKey)||"{}");if(!value||typeof value!=="object"||Array.isArray(value))return {};return Object.fromEntries(Object.entries(value).filter(([,name])=>typeof name==="string")) as Record<string,string>;}catch{return {};}}
export const cloudDrafts={
  get(id:string|null):Draft {const key=id||"root";return cache.get(key)||{name:read()[key]||""};},
  set(id:string|null,draft:Draft) {
    const key=id||"root";
    if(draft.name||draft.file||draft.photos?.length||draft.color)cache.set(key,draft);else cache.delete(key);
    try{const names=read();if(draft.name)names[key]=draft.name;else delete names[key];sessionStorage.setItem(storageKey,JSON.stringify(names));}catch{/* Keep the in-memory draft when storage is restricted. */}
  },
  hasPictures(){return [...cache.values()].some(d=>!!d.file||!!d.photos?.length);},
};
