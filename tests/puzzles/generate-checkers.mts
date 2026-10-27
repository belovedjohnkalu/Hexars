import fs from 'node:fs';
import {createCheckers,checkersCells,checkersView,generateCheckersMoves,advanceCheckers,readCheckers,checkersResult,cellRadius,type CheckersState,type CheckersVariant} from '../../cloud/floot/helpers/checkersRules.tsx';
let seed=20261027;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
function compact(view:any){const pieces=view.board.cells.flatMap((c:any,i:number)=>c.piece?[[i,c.piece]]:[]);const {board,...rest}=view;return{...rest,pieces,legalMoves:rest.legalMoves.map(({changes,fromNotation,toNotation,...m}:any)=>m)};}
for(const variant of ['hexdame','kruzno'] as CheckersVariant[]){
 const cells=checkersCells(variant),puzzles:any[]=[],seen=new Set<string>();let tries=0;
 while(puzzles.length<64&&tries++<500000){
  const activePlayer=variant==='kruzno'?1:0,choices=[...cells].sort(()=>random()-.5),countA=2+Math.floor(random()*2),countB=1+Math.floor(random()*3);
  const pieces=choices.slice(0,countA+countB).map((c,i)=>({...c,player:(i<countA?activePlayer:1-activePlayer) as 0|1,type:'man' as const}));
  const s:CheckersState={variant,activePlayer,ply:20,pieces,history:[],borderDue:variant==='kruzno'?pieces.filter(p=>cellRadius(p)===5).map(p=>p.q+','+p.r):[],quietPly:0};
  readCheckers(s);const legal=generateCheckersMoves(s);if(legal.length<3||checkersResult(s,legal).status!=='ongoing')continue;
  const answers=legal.flatMap(move=>{const next=advanceCheckers(s,move),wins=variant==='hexdame'?next.pieces.find(p=>p.q===move.to.q&&p.r===move.to.r)?.type==='draughts-king':checkersResult(next).status==='win'&&checkersResult(next).winner===activePlayer;return wins?[{move:{from:move.from,to:move.to,path:move.path},after:compact(checkersView(next))}]:[];});
  if(!answers.length||answers.length>3||answers.length===legal.length)continue;
  const key=JSON.stringify(pieces);if(seen.has(key))continue;seen.add(key);
  puzzles.push({key:variant+'-'+(puzzles.length+1),goal:variant==='hexdame'?'promote':'win',position:compact(checkersView(s)),answers,sourceState:s});
 }
 if(puzzles.length!==64)throw Error(variant+' only '+puzzles.length);
 const geometry=checkersView(createCheckers(variant)).board;geometry.cells=geometry.cells.map(c=>({...c,piece:null}));
 fs.writeFileSync('/tmp/ion070-puzzles/'+variant+'.json',JSON.stringify({variant,geometry,puzzles}));console.log(variant+': '+puzzles.length+' verified puzzles from '+tries+' candidates');
}
