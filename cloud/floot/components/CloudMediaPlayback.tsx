import {useState} from 'react';
import {useCachedMedia} from '../helpers/useCachedMedia';
import {mediaKind} from '../helpers/cloudPhotos';
import styles from './CloudMediaPlayback.module.css';
export function CloudMediaPlayback({url,type,name}:{url:string;type:string;name:string}){const media=useCachedMedia(url),[failed,setFailed]=useState(false),video=mediaKind(type)==='video';return <div className={styles.player}>{failed?<p role="alert">Media unavailable. Reconnect and try again.</p>:video?<video key={url} src={media.src} controls playsInline preload="metadata" aria-label={name} onError={()=>setFailed(true)} onEnded={()=>void media.remember()}/>:<audio key={url} src={media.src} controls preload="metadata" aria-label={name} onError={()=>setFailed(true)} onEnded={()=>void media.remember()}/>}</div>;}
