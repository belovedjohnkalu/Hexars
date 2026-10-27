import {useTiledUI,layoutWords} from '../helpers/useTiledUI';
import {useEffect,useRef} from 'react';
import {useCloudHold} from '../helpers/useCloudHold';
import {requestPageAction} from '../helpers/pageWorkspaceEvents';
import styles from './TileName.module.css';
export function TileName({name}:{name:string}){
 const words=layoutWords(useTiledUI()),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),lastTap=useRef<number|null>(null),renamed=useRef(-Infinity);
 const cancel=()=>{clearTimeout(timer.current);lastTap.current=null;};
 const rename=()=>{cancel();const now=performance.now();if(now-renamed.current<350)return;renamed.current=now;requestPageAction({action:'tile-rename-direct'});};
 const hold=useCloudHold(()=>{cancel();requestPageAction({action:'tile-rename'});});useEffect(()=>cancel,[]);
 return <button type="button" data-tile-name data-no-navigation-keys className={styles.name} {...hold.handlers({id:'current-tile-name',name,parentId:null})} onClick={event=>{if(event.detail===0){cancel();requestPageAction({action:'tiles'});return;}const now=performance.now();if(lastTap.current!==null&&now-lastTap.current<320){rename();return;}lastTap.current=now;timer.current=setTimeout(()=>{cancel();requestPageAction({action:'tiles'});},320);}} onDoubleClick={event=>{event.preventDefault();rename();}} onKeyDown={event=>{if(event.key==='F2'){event.preventDefault();rename();}else hold.handlers({id:'current-tile-name',name,parentId:null}).onKeyDown(event);}} aria-keyshortcuts="F2" aria-label={words.unit+': '+name}>{name}</button>;
}
