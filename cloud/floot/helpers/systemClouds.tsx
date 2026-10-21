import type { CloudNode } from '../endpoints/cloud_POST.schema';
export const systemClouds:CloudNode[]=[
 {id:'ion',parentId:null,name:'ION',system:true},
 {id:'controls',parentId:'ion',name:'Controls',color:'cyan',system:true,imageUrl:'/_cdn/static/ion-controls-photo.png'},
 {id:'accounts',parentId:'ion',name:'Accounts',color:'lavender',system:true,imageUrl:'/_cdn/static/ion-accounts-photo.png',destination:'accounts'},
 {id:'time',parentId:'ion',name:'Time',color:'amber',system:true,href:'/?cloud=time&space=home'},
 ...(['rename','move','copy','remove','copy-il','view-photos','link','copy-text'] as const).map((control,i)=>({id:'control-'+control,parentId:'controls',name:['Edit','Move','Duplicate','Delete','Copy IL','View photos','Redirect','Copy'][i],destination:'control' as const,control,system:true,color:(['blue','cyan','mint','coral','lavender','amber','cyan'] as const)[i]}))
];
