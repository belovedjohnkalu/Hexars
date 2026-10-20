import { chessEngines } from './chessEngines';
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
 {id:'online-create-any',parentId:'online-create',name:'Random',color:'white',system:true,isImage:true,imageUrl:'/_cdn/static/edf791ca-fa79-4012-b741-55366beae7dc.png',href:'/?cloud=online-lobby&kind=create&variant=random'},
 {id:'online-random-any',parentId:'online-random',name:'Random',color:'white',system:true,isImage:true,imageUrl:'/_cdn/static/edf791ca-fa79-4012-b741-55366beae7dc.png',href:'/?cloud=online-lobby&kind=find&variant=random'},
 ...(['online-random','online-create'] as const).flatMap(parentId=>chessVariants.all.map((v,i)=>({id:parentId+'-'+v.id,parentId,name:v.name+'’s Variant',variant:v.id,isImage:true,color:(["cyan","lavender","rose","amber","mint","blue"] as const)[i],system:true,href:'/?cloud=online-lobby&kind='+(parentId==='online-create'?'create':'find')+'&variant='+v.id}))),
 {id:'positional',parentId:'engines',name:'Positional',color:'mint',system:true},
 ...['Pre-Beginner','Beginner','Easy','Medium','Hard','Expert'].map((name,i)=>({id:'positional-level-'+i,parentId:'positional',name,engineId:'positional' as const,destination:'level' as const,level:i,color:'mint' as const,system:true})),
 {id:'defensive',parentId:'engines',name:'Defensive',color:'lavender',system:true},
 ...tacticalLevels.map(l=>({id:'defensive-level-'+l.level,parentId:'defensive',name:l.name,engineId:'defensive' as const,destination:'level' as const,level:l.level,color:'lavender' as const,system:true})),
 ...chessEngines.filter(e=>e.id==='materialist'||e.id==='unconventional').flatMap(engine=>[
  {id:engine.id,parentId:'engines',name:engine.name,color:engine.color,system:true},
  ...tacticalLevels.map(l=>({id:engine.id+'-level-'+l.level,parentId:engine.id,name:l.name,engineId:engine.id,destination:'level' as const,level:l.level,color:engine.color,system:true}))
 ])
];
