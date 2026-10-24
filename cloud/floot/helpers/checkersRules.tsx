import { z } from 'zod';
import type { Hex,ChessMove,GameView } from '../endpoints/game_POST.schema';
export type CheckersVariant='hexdame'|'kruzno';
export type Checker=Hex&{player:0|1;type:'man'|'draughts-king'};
export type CheckersState={variant:CheckersVariant;activePlayer:0|1;ply:number;pieces:Checker[];history:string[];borderDue:string[];quietPly:number;agreed?:boolean;resigned?:number};
export type CheckersMove=ChessMove&{path:Hex[];captures:Hex[]};
export const isCheckers=(id:unknown):id is CheckersVariant=>id==='hexdame'||id==='kruzno';
export const checkerKey=(h:Hex)=>h.q+','+h.r;
const equal=(a:Hex,b:Hex)=>a.q===b.q&&a.r===b.r;
const directions:Hex[]=[{q:1,r:0},{q:0,r:1},{q:-1,r:1},{q:-1,r:0},{q:0,r:-1},{q:1,r:-1}];
const plus=(a:Hex,b:Hex,n=1):Hex=>({q:a.q+b.q*n,r:a.r+b.r*n});
export const checkersRadius=(v:CheckersVariant)=>v==='hexdame'?4:5;
export const cellRadius=(h:Hex)=>Math.max(Math.abs(h.q),Math.abs(h.r),Math.abs(h.q+h.r));
export function checkersCells(v:CheckersVariant):Hex[]{const out:Hex[]=[],radius=checkersRadius(v);for(let q=-radius;q<=radius;q++)for(let r=Math.max(-radius,-q-radius);r<=Math.min(radius,-q+radius);r++)out.push({q,r});return out;}
const valid=(v:CheckersVariant,h:Hex)=>cellRadius(h)<=checkersRadius(v);
export const checkersNotation=(v:CheckersVariant,h:Hex)=>String.fromCharCode(97+h.q+checkersRadius(v))+String(h.r+checkersRadius(v)+1+Math.min(0,h.q));
export function promotionCell(player:number,h:Hex){return player===0?(h.r===4||h.q+h.r===4):(h.r===-4||h.q+h.r===-4);}
export function checkersPositionKey(state:CheckersState){return state.variant+':'+state.activePlayer+':'+state.pieces.map(p=>checkerKey(p)+':'+p.player+':'+p.type).sort().join(';')+':'+[...state.borderDue].sort().join(';');}
export function createCheckers(v:CheckersVariant):CheckersState{
 const pieces:Checker[]=[];
 if(v==='hexdame')for(let a=1;a<=4;a++)for(let b=1;b<=4;b++){pieces.push({q:b-a,r:a,player:1,type:'man'},{q:a-b,r:-a,player:0,type:'man'});}
 else for(let r=-4;r<=-2;r++)for(let q=0;q<=-r;q++){
  // Axial reflection maps the publisher's top-right / bottom-left setup to our upward r-axis.
  pieces.push({q,r:-q-r,player:0,type:'man'},{q:-q||0,r:q+r,player:1,type:'man'});
 }
 const state:CheckersState={variant:v,activePlayer:v==='hexdame'?0:1,ply:0,pieces,history:[],borderDue:[],quietPly:0};state.history=[checkersPositionKey(state)];return state;
}
const point=z.object({q:z.number().int().min(-5).max(5),r:z.number().int().min(-5).max(5)}).strict();
const savedSchema=z.object({variant:z.enum(['hexdame','kruzno']),activePlayer:z.union([z.literal(0),z.literal(1)]),ply:z.number().int().nonnegative(),pieces:z.array(point.extend({player:z.union([z.literal(0),z.literal(1)]),type:z.enum(['man','draughts-king'])}).strict()).max(32),history:z.array(z.string()).max(10000),borderDue:z.array(z.string()).max(24),quietPly:z.number().int().nonnegative(),agreed:z.boolean().optional(),resigned:z.union([z.literal(0),z.literal(1)]).optional()}).strict();
export function readCheckers(value:unknown):CheckersState{
 const state=savedSchema.parse(value);const ids=new Set(state.pieces.map(checkerKey));
 if([0,1].some(p=>state.pieces.filter(c=>c.player===p).length>(state.variant==='hexdame'?16:12))||new Set(state.borderDue).size!==state.borderDue.length||ids.size!==state.pieces.length||state.pieces.some(p=>!valid(state.variant,p)||state.variant==='kruzno'&&p.type!=='man')||state.borderDue.some(k=>!state.pieces.some(p=>checkerKey(p)===k&&cellRadius(p)===5))||state.variant==='hexdame'&&state.borderDue.length)throw new Error('Invalid checkers position');
 return state;
}
export function generateCheckersMoves(state:CheckersState):CheckersMove[]{
 if(state.agreed||state.resigned!==undefined)return[];
 const board=new Map(state.pieces.map(p=>[checkerKey(p),p])),captures:CheckersMove[]=[];
 for(const piece of state.pieces.filter(p=>p.player===state.activePlayer)){
  const occupied=new Map(board);occupied.delete(checkerKey(piece));
  function walk(at:Hex,path:Hex[],taken:Hex[],seen:Set<string>){
   let continued=false;
   for(const d of directions){let enemy=plus(at,d);
    if(piece.type==='draughts-king')while(valid(state.variant,enemy)&&!occupied.has(checkerKey(enemy)))enemy=plus(enemy,d);
    const target=occupied.get(checkerKey(enemy));if(!target||target.player===piece.player||seen.has(checkerKey(enemy)))continue;
    let landing=plus(enemy,d);while(valid(state.variant,landing)&&!occupied.has(checkerKey(landing))){
     continued=true;const nextSeen=new Set(seen);nextSeen.add(checkerKey(enemy));
     // HexDame retains captured blockers until the complete sequence ends.
     if(state.variant==='kruzno')occupied.delete(checkerKey(enemy));
     walk(landing,[...path,landing],[...taken,enemy],nextSeen);
     if(state.variant==='kruzno')occupied.set(checkerKey(enemy),target);
     if(piece.type!=='draughts-king')break;landing=plus(landing,d);
    }
   }
   if(!continued&&taken.length)captures.push({from:{q:piece.q,r:piece.r},to:at,path,captures:taken,capture:true});
  }
  walk(piece,[{q:piece.q,r:piece.r}],[],new Set());
 }
 if(captures.length){const most=Math.max(...captures.map(m=>m.captures.length));return state.variant==='hexdame'?captures.filter(m=>m.captures.length===most):captures;}
 const moves:CheckersMove[]=[];
 for(const piece of state.pieces.filter(p=>p.player===state.activePlayer)){
  const dirs=state.variant==='kruzno'||piece.type==='draughts-king'?directions:state.activePlayer===0?directions.slice(0,3):directions.slice(3);
  for(const d of dirs){let to=plus(piece,d);while(valid(state.variant,to)&&!board.has(checkerKey(to))){moves.push({from:{q:piece.q,r:piece.r},to,path:[{q:piece.q,r:piece.r},to],captures:[],capture:false});if(piece.type!=='draughts-king')break;to=plus(to,d);}}
 }
 if(state.variant==='kruzno'){
  const due=state.pieces.filter(p=>p.player===state.activePlayer&&state.borderDue.includes(checkerKey(p)));
  const exits=moves.filter(m=>due.some(p=>equal(p,m.from))&&cellRadius(m.to)<5);
  if(exits.length)return exits;
  // Only enemy-blocked border checkers may defer their obligation. Friendly
  // obstruction does not waive the publisher's border restriction.
  if(due.some(p=>directions.map(d=>plus(p,d)).filter(h=>valid(state.variant,h)&&cellRadius(h)<5).some(h=>board.get(checkerKey(h))?.player!==1-p.player)))return[];
 }
 return moves;
}
export function advanceCheckers(state:CheckersState,move:CheckersMove):CheckersState{
 const piece=state.pieces.find(p=>equal(p,move.from))!;let nextPiece:Checker={...piece,...move.to};
 if(state.variant==='hexdame'&&piece.type==='man'&&promotionCell(piece.player,move.to))nextPiece={...nextPiece,type:'draughts-king'};
 const captured=new Set(move.captures.map(checkerKey)),pieces=state.pieces.filter(p=>!equal(p,move.from)&&!captured.has(checkerKey(p))).concat(nextPiece);
 const due=state.borderDue.filter(k=>k!==checkerKey(move.from)&&!captured.has(k));if(state.variant==='kruzno'&&cellRadius(move.to)===5)due.push(checkerKey(move.to));
 const next:CheckersState={...state,pieces,activePlayer:state.activePlayer===0?1:0,ply:state.ply+1,borderDue:due,quietPly:move.captures.length||piece.type==='man'&&state.variant==='hexdame'?0:state.quietPly+1,history:[]};
 next.history=move.captures.length||piece.type==='man'&&state.variant==='hexdame'?[checkersPositionKey(next)]:[...state.history,checkersPositionKey(next)];return next;
}
export function checkersResult(state:CheckersState,moves=generateCheckersMoves(state)):GameView['result']{
 const draw=(reason:string):GameView['result']=>({status:'draw',reason,winner:-1,scores:[.5,.5]});
 if(state.resigned!==undefined)return{status:'win',reason:'resignation',winner:1-state.resigned,scores:state.resigned===0?[0,1]:[1,0]};
 if(state.agreed)return draw('agreed');
 if(!moves.length)return{status:'win',reason:state.pieces.some(p=>p.player===state.activePlayer)?'blocked':'captured',winner:1-state.activePlayer,scores:state.activePlayer===0?[0,1]:[1,0]};
 if(state.history.filter(k=>k===checkersPositionKey(state)).length>=3)return draw('repetition');
 // Kruzno has no men advancing to a crown row. A capture resets its 40-move
 // no-progress clock; this is explicitly identified as an ION draw policy.
 if(state.variant==='kruzno'&&state.quietPly>=80)return draw('no-capture-40');
 return{status:'ongoing',reason:'',winner:-1,scores:[0,0]};
}
export function applyCheckersMove(state:CheckersState,request:ChessMove):{state:CheckersState;move:CheckersMove}{
 const legal=generateCheckersMoves(state);if(checkersResult(state,legal).status!=='ongoing')throw new Error('Game has ended');
 const matches=legal.filter(m=>equal(m.from,request.from)&&equal(m.to,request.to)&&(!request.path||request.path.length===m.path.length&&request.path.every((h,i)=>equal(h,m.path[i]))));
 if(matches.length!==1||request.pass||request.promotion)throw new Error('Illegal move: choose a complete legal capture path');
 return{state:advanceCheckers(state,matches[0]),move:matches[0]};
}
export function checkersView(state:CheckersState):GameView{
 const moves=generateCheckersMoves(state),result=checkersResult(state,moves),board=new Map(state.pieces.map(p=>[checkerKey(p),p]));
 const annotated=result.status==='ongoing'?moves.map(move=>{const next=advanceCheckers(state,move),after=new Map(next.pieces.map(p=>[checkerKey(p),p]));const changed=new Set([checkerKey(move.from),checkerKey(move.to),...move.captures.map(checkerKey)]);return{...move,fromNotation:checkersNotation(state.variant,move.from),toNotation:checkersNotation(state.variant,move.to),changes:[...changed].map(k=>{const[q,r]=k.split(',').map(Number),p=after.get(k);return{q,r,piece:p?{type:p.type,player:p.player}:null};})};}):[];
 const stateKey=checkersPositionKey(state);let hash=2166136261;for(const c of stateKey)hash=Math.imul(hash^c.charCodeAt(0),16777619);
 return{variant:state.variant,stateId:state.variant+':'+state.ply+':'+(hash>>>0),activePlayer:state.activePlayer,ply:state.ply,check:false,board:{variant:state.variant,stage:'complete',orientation:'flat',players:[0,1],cells:checkersCells(state.variant).map(h=>{const p=board.get(checkerKey(h));return{...h,colour:((h.q-h.r)%3+3)%3,notation:checkersNotation(state.variant,h),restricted:state.variant==='kruzno'&&cellRadius(h)===5,piece:p?{type:p.type,player:p.player}:null};})},legalMoves:annotated,result};
}
