import { timePrice } from './timeMath';
import type { TimeSnapshot } from '../endpoints/time_POST.schema';
export function applyBuyerCount(snapshot:TimeSnapshot,buyers:number,observedAt:string):TimeSnapshot {
  if(!Number.isSafeInteger(buyers)||buyers<0||!Number.isFinite(Date.parse(observedAt))||Date.parse(observedAt)<=Date.parse(snapshot.buyersObservedAt||'1970-01-01'))return snapshot;
  return{...snapshot,buyers,buyersObservedAt:observedAt,products:snapshot.products.map(product=>{
    const priceUs=product.costUs!==null&&buyers?timePrice(product.costUs,buyers):null;
    return{...product,priceUs,affordable:!!product.published&&snapshot.pricingReady&&priceUs!==null&&BigInt(priceUs)<=BigInt(snapshot.balanceUs)};
  })};
}
