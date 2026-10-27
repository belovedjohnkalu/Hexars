import {chessHubId,communityId} from './chessHubClouds';
import type { CloudNode,CloudScope } from '../endpoints/cloud_POST.schema';
import { chessVariants } from './chessVariants';
export const chessSections={play:'b72fa667-e8d3-41bc-9eda-750383255956',learn:'d8b61dd3-a222-492d-8ccc-9dc08cf12cd2',notes:'329fc2f7-1c41-46e2-b272-ab78135f9c1e',challenges:'6a7b29cf-c0cc-4794-82fa-3b67a4480a47'};
export const chessNavigationAnchors={ [chessSections.play]:{x:-.24,y:-.21},[chessSections.learn]:{x:.20,y:-.04},'chess-history':{x:.20,y:.22},[communityId]:{x:-.22,y:.15}};
export const chessCommunityAnchors={
 'chess-room-start':{x:-.24,y:-.24},'chess-room-strategy':{x:.24,y:-.08},
 'chess-room-variants':{x:-.23,y:.07},'chess-room-games':{x:.22,y:.29},
 'chess-room-feedback':{x:-.24,y:.31},'chess-following':{x:.23,y:-.32},
 'chess-guidelines':{x:-.20,y:.50},'chess-settings':{x:.23,y:.55},
};
const order=new Map(['hexagonal-chess',chessHubId,chessSections.play,chessSections.learn,communityId,'chess-history','chess-first-game','chess-today','boards','online','rules',chessSections.challenges,'game-history','shared-games',chessSections.notes,'glinski-board','mccooey-board','shafran-board','brusky-board','devasa-board','wellisch-board','online-random','online-code','online-create','online-join'].map((id,i)=>[id,i]));
// Engine choice belongs to a selected board. Keep the catalog and IDs in the
// authoritative response; omit its branch only from a context-free canvas.
export function chessNavigationNodes(nodes:CloudNode[],scope:CloudScope,returnVariant:string|null,includeUnfinished=false):CloudNode[]{
 if(scope!=='chess')return nodes;
 const hidden=new Set<string>(['tactical','positional','defensive','materialist','unconventional','universal']);
 if(!includeUnfinished)for(const id of [chessSections.notes,chessSections.challenges]){const n=nodes.find(n=>n.id===id);if(n&&!n.note&&!n.imageUrl&&!n.href&&!n.redirect&&!nodes.some(child=>child.parentId===id&&!child.removedBy))hidden.add(id);}
 if(!chessVariants.isCheckers(returnVariant)){hidden.add('checkers-computer');hidden.add('checkers-online');}
 if(!chessVariants.isId(returnVariant)){
  hidden.add('engines');
 }
 {let changed=true;
  while(changed){changed=false;for(const n of nodes)if(n.parentId&&hidden.has(n.parentId)&&!hidden.has(n.id)){hidden.add(n.id);changed=true;}}
 }
 return nodes.filter(n=>!hidden.has(n.id)).map(n=>n.id==='engines'?{...n,name:'Computer'}:n).sort((a,b)=>(order.get(a.id)??1000)-(order.get(b.id)??1000));
}
