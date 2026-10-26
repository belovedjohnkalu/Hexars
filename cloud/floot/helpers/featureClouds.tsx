import {isRetiredGameCloud} from './retiredGameClouds';
import { scheduleCalendar } from './scheduleCalendar';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import type { TimeProduct } from '../endpoints/time_POST.schema';
import { chessVariants } from './chessVariants';
import {isFreeVariant,isRetiredPriceCloud} from './computerPolicy';
export function featureClouds(nodes:CloudNode[],products:TimeProduct[],dev=false):CloudNode[]{
 nodes=nodes.filter(n=>!isRetiredGameCloud(n.id));const retired=new Set(nodes.flatMap(n=>[n.id,n.parentId||'']).filter(isRetiredPriceCloud));let removing=true;while(removing){removing=false;for(const n of nodes)if(n.parentId&&retired.has(n.parentId)&&!retired.has(n.id)){retired.add(n.id);removing=true;}}nodes=nodes.filter(n=>!retired.has(n.id));
 if(dev)return nodes.map(n=>({...n,lockedItem:undefined}));
 const byId=new Map(nodes.map(n=>[n.id,n])),catalog=new Map(products.map(p=>[p.id,p])),memo=new Map<string,{show:boolean;item?:string}>(),visiting=new Set<string>();
 const inspect=(node:CloudNode):{show:boolean;item?:string}=>{
  const known=memo.get(node.id);if(known)return known;if(visiting.has(node.id))return{show:false};visiting.add(node.id);
  const parent=node.parentId?byId.get(node.parentId):undefined,above=parent?inspect(parent):{show:true,item:undefined};
  const variant=node.variant??(chessVariants.isId(node.destination)?node.destination:chessVariants.all.find(v=>node.id===v.id+'-board'||node.id===v.id+'-rules')?.id);
  const item=node.id===scheduleCalendar.root||node.calendarDate?'feature:schedule':variant?!isFreeVariant(variant)?'variant:'+variant:undefined:above.item,product=item?catalog.get(item):undefined;
  const result={show:above.show&&(!item||!!product&&(product.owned||!!product.affordable)),item};memo.set(node.id,result);visiting.delete(node.id);return result;
 };
 const visible=nodes.flatMap(node=>{const state=inspect(node);const locked=state.item&&!catalog.get(state.item)?.owned?state.item:undefined;return state.show?[{...node,...(locked?{note:undefined,illustration:undefined}:{}),lockedItem:locked}]:[];});
 // Hide empty generated year/month/day paths when all their games are hidden.
 const remaining=new Set(visible.map(n=>n.id)),counts=new Map<string,number>();for(const n of visible)if(n.parentId)counts.set(n.parentId,(counts.get(n.parentId)||0)+1);
 const queue=visible.filter(n=>n.id.startsWith('history-u')&&!counts.get(n.id)).map(n=>n.id);
 for(let i=0;i<queue.length;i++){const id=queue[i],parent=byId.get(id)?.parentId;remaining.delete(id);if(parent){counts.set(parent,(counts.get(parent)||0)-1);if(!counts.get(parent)&&parent.startsWith('history-u'))queue.push(parent);}}
 return visible.filter(n=>remaining.has(n.id));
}
