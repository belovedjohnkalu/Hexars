import type {CloudNode} from '../endpoints/cloud_POST.schema';
import {tacticalLevels} from './tacticalLevels';
export const checkersRoot='e28bff47-f4b4-45f3-abef-8c8d2e63cd4e';
const entries=[{id:'hexdame' as const,name:'HexDame',color:'cyan' as const},{id:'kruzno' as const,name:'Kruzno’s Checkers',color:'lavender' as const}];
const rules={hexdame:[
 ['Board','61 cells, with 16 men for each side. White moves first. A player wins when the opponent has no legal move, whether captured out or blocked.','setup'],
 ['Men','A man steps to one of the three empty adjacent cells ahead. Captures can go forward or backward along any of the six edge directions.','advance'],
 ['Captures','A capture is required whenever one is available. Jump over an adjacent enemy into the empty cell beyond. Complete the entire chain with that same piece. Choose a chain taking the greatest total number of enemies; kings and men count equally. Equal-length choices are both legal. Tap successive highlighted landing cells to choose a route.','capture'],
 ['Kings','A king slides along any of the six edge lines. To capture, pass through empty cells to the first enemy, jump it, and land on an empty cell beyond. Every continuation must obey the maximum-capture rule.','king'],
 ['Crowning','A man becomes a king only when its complete turn ends on either far edge: nine possible crown cells. Passing through those cells during a chain does not crown it; continue capturing as a man.','promotion'],
 ['Capture details','Captured pieces remain on the board as obstacles until the chain ends. Never jump the same piece twice. Empty cells, including the starting cell, may be revisited.','capture'],
 ['Draws','Three occurrences of the same position with the same side to move produce an automatic draw in ION. Pass-and-play users can also agree to a draw; online agreement requires both players. There is no chess insufficient-material rule or three-kings-versus-one automatic draw.',''],
 ['Reference','Rules and starting diagram: https://www.mindsports.nl/index.php/arena/hexdame/72-rules . The four pages cover movement and captures. ION applies repetition automatically instead of requiring a claim.','']
 ],kruzno:[
 ['Board','91 cells; 12 checkers per side in the publisher’s arrangement. Black starts in ION, following English checkers. Capture every opponent checker or block all its legal moves to win.','setup'],
 ['Movement','Step to any empty edge-adjacent cell in all six directions. There are no kings or promotions.','advance'],
 ['Captures','Captures are compulsory. Jump an adjacent enemy into the empty cell beyond, then continue any available jumps with that checker. Choose any complete chain; it need not be the longest. Captured pieces are removed after each jump.','capture'],
 ['Outer ring','A checker entering the shaded outer ring owes an exit on its next non-capturing turn. Captures take priority. If an inward exit is open, use it before another quiet move. An enemy-blocked checker may defer; friendly obstruction does not waive the exit.','border'],
 ['Draws','ION declares threefold repetition or 40 consecutive moves by each side without a capture a draw. Players may agree to a draw. These are app adjudication policies where the publisher’s short rules are silent.',''],
 ['Reference','Publisher: https://www.kruzno.com/hexcheckers.html . Capture priority over border exits was explicitly chosen for ION.','']
 ]};
export const checkersClouds:CloudNode[]=[
 {id:checkersRoot,parentId:'hexagonal-chess',name:'Checkers',system:true,color:'cyan'},
 ...entries.flatMap(v=>[
  {id:v.id+'-board',parentId:checkersRoot,name:v.name,variant:v.id,destination:v.id,isImage:true,system:true,color:v.color},
  {id:v.id+'-rules',parentId:v.id+'-board',name:'Rules',variant:v.id,system:true,color:'amber' as const},
  ...rules[v.id].map(([name,note,illustration],i)=>({id:v.id+'-rule-'+i,parentId:v.id+'-rules',name,note,variant:v.id,...(illustration?{illustration}:{}),system:true,color:(['white','cyan','lavender','mint','amber'] as const)[i%5]}))
 ]),
 {id:'checkers-computer',parentId:checkersRoot,name:'Computer',system:true,color:'coral'},
 ...tacticalLevels.map(l=>({id:'checkers-level-'+l.level,parentId:'checkers-computer',name:l.name,engineId:'universal' as const,destination:'level' as const,level:l.level,system:true,color:'coral' as const})),
 {id:'checkers-online',parentId:checkersRoot,name:'Online',system:true,color:'mint'},
 {id:'checkers-matchmaking',parentId:'checkers-online',name:'Matchmaking',system:true,color:'cyan'},
 {id:'checkers-code',parentId:'checkers-online',name:'4-digit code',system:true,color:'amber'},
 {id:'checkers-create',parentId:'checkers-code',name:'Create',system:true,color:'mint'},
 {id:'checkers-join',parentId:'checkers-code',name:'Join',system:true,color:'lavender',href:'/?cloud=online-join&space=chess'},
 ...(['checkers-matchmaking','checkers-create'] as const).flatMap(parentId=>[
  ...entries.map(v=>({id:parentId+'-'+v.id,parentId,name:v.name,variant:v.id,isImage:true,system:true,color:v.color,href:'/?cloud=online-lobby&space=chess&kind='+(parentId==='checkers-create'?'create':'find')+'&variant='+v.id+'&family=checkers'})),
  {id:parentId+'-random',parentId,name:'Random',system:true,color:'white' as const,href:'/?cloud=online-lobby&space=chess&kind='+(parentId==='checkers-create'?'create':'find')+'&variant=random&family=checkers'}
 ])
];
