import type {CloudNode} from '../endpoints/cloud_POST.schema';
// Page headings have editable presentation without adding extra navigation words.
export const timePageClouds:CloudNode[]=[{id:'time-functional-pages',parentId:'time',name:'Pages',system:true},...Object.entries({'time-receipt':'Transaction','time-product':'Feature','time-cost':'Estimate','time-work-session':'Work session'}).map(([id,name])=>({id,parentId:'time-functional-pages',name,system:true}))];
export const timePageCloud=(id:string)=>timePageClouds.find(n=>n.id===id&&id!=='time-functional-pages');
