import type {TimeSnapshot,TimeReceipt} from '../endpoints/time_POST.schema';
import {scheduleCalendar} from './scheduleCalendar';
import {chessVariants} from './chessVariants';
export function purchaseDestination(productId:string,preferred?:string|null){
 if(preferred?.startsWith('/')&&!preferred.startsWith('//'))try{
  const url=new URL(preferred,'https://ion.invalid');
  if(url.origin==='https://ion.invalid'&&!['controls','time-product','time-receipt'].includes(url.searchParams.get('cloud')||''))return url.pathname+url.search+url.hash;
 }catch{}
 const variant=productId.replace(/^variant:/,'');
 if(chessVariants.isId(variant))return '/'+variant+'?mode=friend';
 if(productId==='feature:schedule')return '/?'+new URLSearchParams({cloud:scheduleCalendar.root,space:'schedule'});
 return '/?cloud=time&space=home';
}
// Only the server's committed outgoing purchase receipt grants this immediate
// UI projection. The subsequent refresh and every API action still recheck it.
export function applyPurchaseReceipt(snapshot:TimeSnapshot,receipt:TimeReceipt){
 const id=receipt.metadata.productId;
 if(receipt.kind!=='purchase'||receipt.direction!=='out'||typeof id!=='string')return snapshot;
 return {...snapshot,products:snapshot.products.map(p=>p.id===id?{...p,owned:true}:p)};
}
