import { tacticalLevels } from './tacticalLevels';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import { chessVariants } from './chessVariants';
export const chessJourney:CloudNode[]=[
 {id:'chess-history',parentId:'hexagonal-chess',name:'Library',color:'lavender',system:true},
 {id:'game-history',parentId:'chess-history',name:'History',color:'cyan',system:true},
 {id:'shared-games',parentId:'chess-history',name:'Shared Games',color:'mint',system:true},
 {id:'shared-received',parentId:'shared-games',name:'Received',color:'lavender',system:true},
 {id:'shared-sent',parentId:'shared-games',name:'Shared',color:'amber',system:true},
 {id:'online',parentId:'hexagonal-chess',name:'Online',color:'mint',system:true},
 {id:'online-random',parentId:'online',name:'Random matchmaking',color:'cyan',system:true},
 {id:'online-code',parentId:'online',name:'4-digit code',color:'amber',system:true},
 {id:'online-create',parentId:'online-code',name:'Create',color:'mint',system:true},
 {id:'online-join',parentId:'online-code',name:'Join',color:'lavender',system:true},
 {id:'online-lobby',parentId:'online',name:'Online',color:'mint',system:true},
 {id:'online-create-any',parentId:'online-create',name:'Random',color:'white',system:true,isImage:true,imageUrl:'/_cdn/static/feca5456-7684-4f65-804c-38d79a3c4b82-ion-random-transparent.png',href:'/?cloud=online-lobby&kind=create&variant=random'},
 {id:'online-random-any',parentId:'online-random',name:'Random',color:'white',system:true,isImage:true,imageUrl:'/_cdn/static/feca5456-7684-4f65-804c-38d79a3c4b82-ion-random-transparent.png',href:'/?cloud=online-lobby&kind=find&variant=random'},
 ...(['online-random','online-create'] as const).flatMap(parentId=>chessVariants.all.filter(v=>!chessVariants.isCheckers(v.id)).map((v,i)=>({id:parentId+'-'+v.id,parentId,name:v.name+'’s Variant',variant:v.id,isImage:true,color:(["cyan","lavender","rose","amber","mint","blue"] as const)[i],system:true,href:'/?cloud=online-lobby&kind='+(parentId==='online-create'?'create':'find')+'&variant='+v.id}))),
 ...tacticalLevels.map(l=>({id:'computer-level-'+l.level,parentId:'engines',name:l.name,engineId:'universal' as const,destination:'level' as const,level:l.level,color:'cyan' as const,system:true}))
];
