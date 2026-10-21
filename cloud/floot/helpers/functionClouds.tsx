import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { chessVariants } from './chessVariants';
import { chessEngines } from './chessEngines';
import { timePrinciples } from './timePrinciples';
const node=(id:string,parentId:string,name:string):CloudNode=>({id,parentId,name,system:true});
export const gameActionNames={variants:'Variants',rules:'Rules',engines:'Engines',friend:'Pass and Play',reset:'Board Reset',undo:'Undo',online:'Online',library:'Library',forfeit:'Forfeit',draw:'Draw'};
const products=[...chessVariants.all.filter(v=>v.id!=='glinski').map(v=>({id:'variant:'+v.id,name:v.name})),...chessEngines.filter(e=>e.id!=='universal').map(e=>({id:'engine:'+e.id,name:e.name}))];
// Stable functional identities. Names/amounts may change; identifiers never do.
export const functionClouds:CloudNode[]=[
 ...['balance','activity','send','receive','earn','prices','treasury','estimates'].map(id=>node('time-'+id,'time',id[0].toUpperCase()+id.slice(1))),
 node('time-balance-value','time-balance','Balance'),node('time-earned','time-balance','Earned'),node('time-earned-value','time-earned','Earned'),
 node('time-added','time-activity','Added'),node('time-spent','time-activity','Spent'),node('time-remaining','time-activity','Balance'),node('time-name','time-receive','Player name'),
 node('time-status','time-earn','Earning'),node('time-earning-rule','time-earn','How it works'),node('time-principles','time-earn','Principles'),
 ...timePrinciples.filter(p=>p.id!=='time-earning-rule').map(p=>node(p.id,'time-principles',p.name)),
 ...products.map(p=>node('time-price-'+p.id,'time-prices',p.name)),
 node('time-treasury-value','time-treasury','Treasury balance'),node('time-treasury-activity','time-treasury','Activity'),node('time-payout','time-treasury','Pay out'),
 node('time-free-work','time-estimates','Free work'),...products.map(p=>node('time-cost-'+p.id,'time-estimates',p.name)),
 ...chessVariants.all.flatMap(v=>Object.entries(gameActionNames).map(([id,name])=>node('game-'+v.id+'-'+id,v.id+'-board',name)))
];
export function receiptClouds(receipt:{id:string;direction:string}){
 const id='time-tx-'+receipt.id;
 return[node(id,receipt.direction==='in'?'time-added':receipt.direction==='out'?'time-spent':'time-treasury-activity','Transaction'),...['amount','other','kind','date','copy','feature','creation','buyers'].map(key=>node(id+'-'+key,id,key))];
}
export function savedFunctionClouds(gameId:string,moves:{ply:number}[],seats:number[]){
 const root='saved-view-'+gameId,child=(id:string,parent:string)=>node(root+':'+id,parent,id);
 return[node(root,'chess-history','Saved game'),...['notations','opponents','share','controls'].map(id=>child(id,root)),child('notation-copy',root+':notations'),...moves.map((m,i)=>child('notation-'+i,root+':notations')),...seats.map(seat=>child('saved-opponent-'+seat,root+':opponents')),...['saved-delete','saved-share','saved-share-nickname','saved-copy-il','saved-copy-notation'].map(id=>child(id,root+':controls'))];
}
