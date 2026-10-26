import {earningParagraphs} from './timePresentation';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { chessVariants } from './chessVariants';
import {isFreeVariant} from './computerPolicy';
import { timePrinciples } from './timePrinciples';
const node=(id:string,parentId:string,name:string):CloudNode=>({id,parentId,name,system:true});
export const gameActionNames={variants:'Variants',rules:'Rules',engines:'Computer',friend:'Pass and Play',reset:'Board Reset',undo:'Undo',online:'Online',library:'Library',forfeit:'Forfeit',draw:'Draw'};
const products=[{id:'feature:schedule',name:'Schedule'},...chessVariants.all.filter(v=>!isFreeVariant(v.id)).map(v=>({id:'variant:'+v.id,name:v.name}))];
// Stable functional identities. Names/amounts may change; identifiers never do.
export const functionClouds:CloudNode[]=[node('page-tiles','controls','Tiles'),node('page-tile-new','page-tiles','New Tile'),node('page-tile-rename','page-tiles','Rename'),node('page-tile-delete','page-tiles','Delete'),
 ...['balance','activity','send','receive','earn','prices','treasury','estimates'].map(id=>node('time-'+id,'time',id==='estimates'?'Work':id[0].toUpperCase()+id.slice(1))),
 node('time-balance-value','time-balance','Balance'),node('time-earned','time-balance','Earned'),node('time-earned-value','time-earned','Earned'),
 node('time-added','time-activity','Added'),node('time-spent','time-activity','Spent'),node('time-remaining','time-activity','Balance'),node('time-name','time-receive','Player name'),
 node('time-status','time-earn','Earning'),node('time-earning-rule','time-earn','How it works'),node('time-principles','time-earn','Principles'),
 ...timePrinciples.filter(p=>p.id!=='time-earning-rule').map(p=>({...node(p.id,'time-principles',p.name),note:p.note})),
 ...products.map(p=>node('time-price-'+p.id,'time-prices',p.name)),
 ...products.flatMap(p=>[node('time-price-value-'+p.id,'time-price-'+p.id,'Price'),node('time-purchase-'+p.id,'time-price-'+p.id,'Purchase')]),
 ...earningParagraphs.map(p=>({...node(p.id,'time-earning-rule',p.name),note:p.note})),
 node('time-treasury-value','time-treasury','Treasury balance'),node('time-treasury-activity','time-treasury','Activity'),node('time-payout','time-treasury','Pay out'),
 ...['time-work-total','time-work-sessions','time-work-baseline','time-work-start'].map((id,i)=>node(id,'time-estimates',['Total','Sessions','Earlier work','Start'][i])),
 ...chessVariants.all.flatMap(v=>Object.entries(gameActionNames).filter(([id])=>!['kruzno','hexdame'].includes(v.id)||!['forfeit','draw'].includes(id)).map(([id,name])=>node('game-'+v.id+'-'+id,v.id+'-board',name))),
 ...['kruzno','hexdame'].flatMap(v=>[node('game-'+v+'-online-forfeit',v+'-board','Forfeit'),node('game-'+v+'-online-draw',v+'-board','Draw')])
];
export function receiptClouds(receipt:{id:string;direction:string}){
 const id='time-tx-'+receipt.id;
 return[node(id,receipt.direction==='in'?'time-added':receipt.direction==='out'?'time-spent':'time-treasury-activity','Transaction'),...['amount','other','kind','date','copy','feature','creation','buyers'].map(key=>node(id+'-'+key,id,key))];
}
export function savedFunctionClouds(gameId:string,moves:{ply:number}[],seats:number[]){
 const root='saved-view-'+gameId,child=(id:string,parent:string)=>node(root+':'+id,parent,id);
 return[node(root,'chess-history','Saved game'),...['notations','opponents','share','controls'].map(id=>child(id,root)),child('notation-copy',root+':notations'),...moves.map((m,i)=>child('notation-'+i,root+':notations')),...seats.map(seat=>child('saved-opponent-'+seat,root+':opponents')),...['saved-delete','saved-share','saved-share-nickname','saved-copy-il','saved-copy-notation'].map(id=>child(id,root+':controls'))];
}
