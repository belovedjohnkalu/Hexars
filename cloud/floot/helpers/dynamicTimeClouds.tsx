import {dynamicTimeId} from './dynamicTimeId';
import type {CloudNode} from '../endpoints/cloud_POST.schema';
import {timeLedger} from './timeLedger';
import {receiptClouds} from './functionClouds';
import {timeFormat} from './timeMath';
import {db} from './db';
export async function dynamicTimeClouds(userId:number,id:string):Promise<CloudNode[]>{
 if(!dynamicTimeId(id))throw Object.assign(Error('This cloud is not available.'),{status:404});
 if(id.startsWith('time-tx-')){const r=await timeLedger.receipt(db,id.slice(8,44),userId,false),base='time-tx-'+r.id,labels:Record<string,string>={[base]:(r.direction==='in'?'+':r.direction==='out'?'−':'')+timeFormat(r.amountUs)+' · '+r.other,[base+'-amount']:timeFormat(r.amountUs,true),[base+'-other']:r.other,[base+'-kind']:r.kind[0].toUpperCase()+r.kind.slice(1),[base+'-date']:new Date(r.createdAt).toISOString(),[base+'-copy']:'Copy reference',[base+'-feature']:'Feature',[base+'-creation']:'Creation · '+timeFormat(String(r.metadata.creationCostUs||'0'),true),[base+'-buyers']:String(r.metadata.buyers||0)+' buyers'};return receiptClouds(r).map(n=>({...n,name:labels[n.id],system:true}));}
 const row=await db.selectFrom('ionWorkSessions').select(['id','startedAt','endedAt','description']).where('id','=',id.slice(13)).executeTakeFirst();if(!row)throw Object.assign(Error('This session is not available.'),{status:404});
 return[{id,parentId:'time-work-sessions',name:new Date(row.startedAt).toISOString(),note:row.description,system:true,color:'cyan'}];
}
