import {timePrinciples} from './timePrinciples';
import {functionClouds} from './functionClouds';
import {timeHubNodes,visiblePriceProducts,canPurchase,earningParagraphs} from './timePresentation';
import type {TimeSnapshot,TimeProduct} from '../endpoints/time_POST.schema';
const product={id:'engine:tactical',name:'Tactical',owned:false,affordable:false,published:true,priceUs:'1000000'} as TimeProduct;
const snapshot={userId:7,dev:false,products:[product],pricingReady:true} as TimeSnapshot;
describe('Minimal Time presentation',()=>{
 it('shows the full price catalog to signed-in accounts without granting access',()=>{expect(visiblePriceProducts(snapshot)).toEqual([product]);expect(canPurchase(product,snapshot)).toBeFalse();expect(canPurchase({...product,affordable:true},snapshot)).toBeTrue();expect(canPurchase({...product,affordable:true,owned:true},snapshot)).toBeFalse();expect(visiblePriceProducts({...snapshot,userId:null})).toEqual([]);});
 it('keeps the three live totals inside Activity with their original identities',()=>{const nodes=timeHubNodes([{id:'time-activity',parentId:'time',name:'Activity'},{id:'time-added',parentId:'time-activity',name:'Added',identifier:'IL0910'},{id:'time-spent',parentId:'time-activity',name:'Spent'},{id:'time-remaining',parentId:'time-activity',name:'Balance'}],snapshot,{addedUs:'3000000',spentUs:'1000000',balanceUs:'2000000'});expect(nodes.map(n=>n.parentId)).toEqual(['time','time-activity','time-activity','time-activity']);expect(nodes.slice(1).map(n=>n.name)).toEqual(['Added +00:00:03','Spent −00:00:01','Balance 00:00:02']);expect(nodes[1].identifier).toBe('IL0910');expect(nodes[3].control).toBe('copy-text');});
 it('turns each earning paragraph into one stable word-cloud item',()=>{expect(earningParagraphs.length).toBe(3);expect(new Set(earningParagraphs.map(p=>p.id)).size).toBe(3);expect(earningParagraphs.map(p=>p.name)).toEqual(['Earning','Spending','Prices']);expect(earningParagraphs.map(p=>p.note).join('\n\n')).toBe(timePrinciples.find(p=>p.id==='time-earning-rule')!.note);for(const p of earningParagraphs)expect(functionClouds.find(n=>n.id===p.id)?.note).toBe(p.note);});
});
