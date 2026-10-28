import type { CloudNode } from '../endpoints/cloud_POST.schema';
export const systemClouds:CloudNode[]=[
 {id:'ion',parentId:null,name:'ION',system:true},
 {id:'controls',parentId:'ion',name:'Controls',color:'cyan',system:true,imageUrl:'/_cdn/static/75eac983-9589-4893-b186-d1769e9bb10f-ion-controls-transparent.png'},
 {id:'accounts',parentId:'ion',name:'Accounts',color:'lavender',system:true,imageUrl:'/_cdn/static/39361196-e165-43fc-b5aa-7c954dafb70c-ion-accounts-transparent.png',destination:'accounts'},
 {id:'time',parentId:'ion',name:'Reserve',imageUrl:'/_cdn/static/f864addf-257e-412b-b49a-4abe66f700b9-ion-reserve-transparent.png',color:'amber',system:true,href:'/?cloud=time&space=home'},
 {id:'home-hidden-features',parentId:'ion',name:'Hidden',color:'lavender',system:true,imageUrl:'/_cdn/static/ac831181-4d44-42ff-873b-612ed6b72241-ion-hidden-transparent.png'},
 ...(['rename','move','copy','remove','copy-il','view-photos','link','copy-text'] as const).map((control,i)=>({id:'control-'+control,parentId:'controls',name:['Edit','Move','Duplicate','Delete','Copy IL','View photos','Redirect','Copy'][i],destination:'control' as const,control,system:true,color:(['blue','cyan','mint','coral','lavender','amber','cyan'] as const)[i]})).filter(n=>n.control!=='view-photos')
];
