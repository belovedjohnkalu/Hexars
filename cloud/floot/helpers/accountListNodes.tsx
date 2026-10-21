import type { CloudNode } from '../endpoints/cloud_POST.schema';
export function accountListNodes(saved:Array<{id:number;displayName:string}>,userId:number|null):CloudNode[]{
 const nodes:CloudNode[]=[{id:'account-others',parentId:'accounts',name:'Other Accounts',color:'lavender',system:true}];
 for(const account of saved){const id='remembered-'+account.id,current=account.id===userId;
  nodes.push({id,parentId:current?'accounts':'account-others',name:account.displayName,color:current?'mint':'lavender',system:true});
  if(!current)nodes.push({id:id+'-open',parentId:id,name:'Open',destination:'account',accountAction:'switch:'+account.id,system:true,color:'blue'});
  nodes.push({id:id+'-forget',parentId:id,name:'Forget',destination:'account',accountAction:'forget:'+account.id,system:true,color:'coral'});
 }
 return nodes;
}
