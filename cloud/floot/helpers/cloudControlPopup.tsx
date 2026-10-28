import type {CloudNode,CloudScope} from '../endpoints/cloud_POST.schema';
import {controlsURL,safeCloudReturn} from './cloudRoutes';

export type CloudControlRequest={id:string;source:CloudScope;origin:string;functional?:string;game?:string;shareId?:string;token?:string;notation?:string};

// The request only identifies the target. CloudControls reloads it through the
// ordinary server-authorized scope before enabling any editing action.
export function openCloudControls(node:CloudNode,scope:CloudScope,origin:string,extra:Partial<Pick<CloudControlRequest,'game'|'shareId'|'token'|'notation'>>={}){
 const params=new URL(controlsURL(node,scope,origin),'https://ion.invalid').searchParams;
 const detail:CloudControlRequest={id:node.id,source:params.get('source') as CloudScope,origin:safeCloudReturn(origin),...(params.get('functional')?{functional:params.get('functional')!}:{}),...extra};
 window.dispatchEvent(new window.CustomEvent<CloudControlRequest>('ion.cloud-controls',{detail}));
}
