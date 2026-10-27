import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {generateCheckersMoves,advanceCheckers,checkersResult,readCheckers,cellRadius,type CheckersState} from '../../cloud/floot/helpers/checkersRules.tsx';
import {expandPuzzleView,samePuzzleMove,type PuzzleBank} from '../../cloud/floot/helpers/dailyPuzzleTypes.tsx';
const manifest=JSON.parse(fs.readFileSync('tests/puzzles/manifest.json','utf8'));
const hash=(s:string|Buffer)=>crypto.createHash('sha256').update(s).digest('hex');
assert.equal(hash(manifest.sources.map((p:string)=>p+'\0'+fs.readFileSync(p,'utf8')).join('\0')),manifest.sourceFingerprint,'Shared rules changed: regenerate and revalidate puzzles.');
let positions=0,moves=0;
for(const [file,sha]of Object.entries(manifest.banks)){
 const text=fs.readFileSync(file,'utf8');assert.equal(hash(text),sha,'Puzzle bank changed without validation: '+file);
 const bank=JSON.parse(text.split('export const dailyPuzzleData:PuzzleBank=')[1].trim().replace(/;$/,'')) as PuzzleBank;
 assert.equal(bank.puzzles.length,64);assert.equal(new Set(bank.puzzles.map(p=>p.key)).size,64);
 for(const p of bank.puzzles){
  positions++;assert.equal(p.goal,manifest.goals[bank.variant]);assert.ok(p.position.legalMoves.length>=3);assert.ok(p.answers.length>0&&p.answers.length<=3);
  const view=expandPuzzleView(bank,p.position);assert.equal(view.board.cells.length,bank.geometry.cells.length);assert.equal(new Set(p.position.pieces.map(([i])=>i)).size,p.position.pieces.length);
  for(const a of p.answers){moves++;assert.ok(view.legalMoves.some(m=>samePuzzleMove(m,a.move)));const after=expandPuzzleView(bank,a.after);if(p.goal==='mate'){assert.equal(after.result.status,'checkmate');assert.equal(after.result.winner,view.activePlayer);}else if(p.goal==='king'){assert.ok(after.armyControllers!.filter(player=>player===view.activePlayer).length>view.armyControllers!.filter(player=>player===view.activePlayer).length);}}
  if(bank.variant==='hexdame'||bank.variant==='kruzno'){
   const pieces=view.board.cells.flatMap(c=>c.piece?[{q:c.q,r:c.r,type:c.piece.type,player:c.piece.player}]:[]),state={variant:bank.variant,activePlayer:view.activePlayer,ply:view.ply,pieces,quietPly:0,history:[],borderDue:bank.variant==='kruzno'?pieces.filter(c=>cellRadius(c)===5).map(c=>c.q+','+c.r):[]} as CheckersState;
   readCheckers(state);const legal=generateCheckersMoves(state);assert.equal(legal.length,view.legalMoves.length);assert.ok(legal.every(m=>view.legalMoves.some(candidate=>samePuzzleMove(m,candidate))));
   const winners=legal.filter(m=>{const next=advanceCheckers(state,m);return bank.variant==='hexdame'?next.pieces.find(c=>c.q===m.to.q&&c.r===m.to.r)?.type==='draughts-king':checkersResult(next).status==='win'&&checkersResult(next).winner===state.activePlayer;});
   assert.equal(winners.length,p.answers.length);assert.ok(winners.every(m=>p.answers.some(a=>samePuzzleMove(a.move,m))));
  }
 }
 console.log(bank.variant+': 64 verified daily positions');
}
assert.equal(positions,manifest.positions);console.log(positions+' positions, '+moves+' correct continuations; rules and bank fingerprints match.');
