import type {CloudNode} from '../endpoints/cloud_POST.schema';
import type {TimeSnapshot,TimeProduct} from '../endpoints/time_POST.schema';
import {timeClock} from './timeMath';
import {timePrinciples} from './timePrinciples';
export const earningParagraphs=(timePrinciples.find(p=>p.id==='time-earning-rule')?.note||'').split(/\n\s*\n/).filter(Boolean).map((name,i)=>({id:'time-earning-paragraph-'+i,name}));
export const visiblePriceProducts=(snapshot:TimeSnapshot|null)=>snapshot?.userId||snapshot?.dev?snapshot?.products||[]:[];
export function canPurchase(product:TimeProduct|undefined,snapshot:TimeSnapshot|null){return !!snapshot?.userId&&!snapshot.dev&&!!product&&!product.owned&&!!product.affordable&&product.published&&snapshot.pricingReady;}
export function timeHubNodes(nodes:CloudNode[],snapshot:TimeSnapshot|null,totals:{addedUs:string;spentUs:string;balanceUs:string}){
 const amounts:Record<string,string>={'time-added':' +'+timeClock(totals.addedUs),'time-spent':' −'+timeClock(totals.spentUs),'time-remaining':' '+timeClock(totals.balanceUs)};
 return nodes.filter(n=>n.id!=='time-activity').map(n=>n.parentId==='time-activity'?{...n,parentId:'time'}:n).map(n=>n.id in amounts?{...n,parentId:'time',name:n.name+(snapshot?.userId?amounts[n.id]:''),...(snapshot?.userId&&n.id==='time-remaining'?{href:undefined,destination:'control' as const,control:'copy-text' as const}:!snapshot?.userId?{destination:undefined,control:undefined,href:'/login?mode=signin&back='+encodeURIComponent('/?cloud=time&space=home')}:{})}:n);
}
