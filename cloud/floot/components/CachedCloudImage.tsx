import type {ImgHTMLAttributes} from 'react';
import {useCachedMedia} from '../helpers/useCachedMedia';
export function CachedCloudImage({src='',onLoad,...props}:ImgHTMLAttributes<HTMLImageElement>){const media=useCachedMedia(src);return <img {...props} src={media.src} decoding="async" onLoad={event=>{onLoad?.(event);void media.remember();}}/>;}
