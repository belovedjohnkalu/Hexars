import {useLayoutEffect} from 'react';
import {useTime} from '../helpers/useTime';
import {useAuth} from '../helpers/useAuth';
export function CloudPresentationSync(){const{snapshot}=useTime(),{authState}=useAuth(),dev=authState.type==='authenticated'&&snapshot?.userId===authState.user.id&&snapshot.dev===true;useLayoutEffect(()=>{document.documentElement.dataset.ionDev=String(dev);return()=>{delete document.documentElement.dataset.ionDev;};},[dev]);return null;}
