import type {CloudNode,CloudScope} from '../endpoints/cloud_POST.schema';
import {controlsURL} from './cloudRoutes';
export type CloudEditRequest={id:string;scope:CloudScope;functional?:string};
export function cloudEditRequest(node:CloudNode,scope:CloudScope,functional?:string){if(!node.canEdit||node.lockedItem||node.publishing)return false;const target=new URL(controlsURL(node,scope,'/'),'https://ion.invalid').searchParams;window.dispatchEvent(new window.CustomEvent<CloudEditRequest>('ion.edit-cloud',{detail:{id:node.id,scope:target.get('source') as CloudScope,functional:functional||target.get('functional')||undefined}}));return true;}
