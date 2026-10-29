import {act,cleanup,renderHook} from '@testing-library/react';
import {gameFacing} from './gameFacing';
import {useBoardFacing} from './useBoardFacing';
import {advanceCheckers,checkersView,createCheckers,generateCheckersMoves,type CheckersState} from './checkersRules';
import {checkersStepView} from './checkersInteraction';

describe('Variant board viewpoints',()=>{
 it('starts Kruzno with Black at the lower left, then follows complete turns',()=>{
  let position=createCheckers('kruzno');
  const black=position.pieces.filter(piece=>piece.player===1);
  const center=black.reduce((sum,piece)=>({x:sum.x+piece.q,y:sum.y-(piece.r+piece.q/2)}),{x:0,y:0});
  expect(center.x).toBeLessThan(0);expect(center.y).toBeGreaterThan(0);
  expect(position.activePlayer).toBe(1);
  expect(gameFacing('kruzno',position.activePlayer,0,true)).toBeFalse();
  position=advanceCheckers(position,generateCheckersMoves(position)[0]);
  expect(position.activePlayer).toBe(0);
  expect(gameFacing('kruzno',position.activePlayer,0,true)).toBeTrue();
  position=advanceCheckers(position,generateCheckersMoves(position)[0]);
  expect(position.activePlayer).toBe(1);
  expect(gameFacing('kruzno',position.activePlayer,0,true)).toBeFalse();
 });
 it('keeps an explicit flip relative to each player and restores the reference view on undo',()=>{
  expect(gameFacing('kruzno',1,1,true)).toBeTrue();
  expect(gameFacing('kruzno',0,1,true)).toBeFalse();
  expect(gameFacing('kruzno',1,2,true)).toBeFalse();
  expect(gameFacing('kruzno',0,0,true)).toBeTrue();
  expect(gameFacing('kruzno',1,0,true)).toBeFalse();
 });
 it('waits for the whole multi-jump capture before changing players',()=>{
  const position:CheckersState={variant:'kruzno',activePlayer:1,ply:0,history:[],borderDue:[],quietPly:0,pieces:[
   {q:0,r:0,player:1,type:'man'},{q:1,r:0,player:0,type:'man'},{q:3,r:0,player:0,type:'man'},
  ]};
  const move=generateCheckersMoves(position).find(candidate=>candidate.path.length===3)!;
  expect(move).toBeDefined();
  const partial=checkersStepView(checkersView(position),move.path.slice(0,2));
  expect(partial.activePlayer).toBe(1);expect(gameFacing('kruzno',partial.activePlayer,0,true)).toBeFalse();
  const complete=advanceCheckers(position,move);
  expect(complete.activePlayer).toBe(0);expect(gameFacing('kruzno',complete.activePlayer,0,true)).toBeTrue();
 });
 it('preserves the fixed Kruzno view in computer, online and puzzle play',()=>{
  for(const player of [0,1]){
   expect(gameFacing('kruzno',player)).toBeFalse();
   expect(gameFacing('kruzno',player,1)).toBeTrue();
  }
 });
 it('retains alternating chess/HexDame and three-player Wellisch viewpoints',()=>{
  for(const variant of ['glinski','brusky','hexdame']){
   expect(gameFacing(variant,0)).toBeFalse();expect(gameFacing(variant,1)).toBeTrue();expect(gameFacing(variant,1,1)).toBeFalse();
   expect(gameFacing(variant,1,0,true)).toBeTrue();
  }
  expect(gameFacing('wellisch',2)).toBe(-240);expect(gameFacing('wellisch',2,1)).toBe(0);
 });
});

describe('Kruzno turn transitions',()=>{
 let originalMatchMedia:typeof window.matchMedia;
 beforeEach(()=>{originalMatchMedia=window.matchMedia;jasmine.clock().install();});
 afterEach(()=>{cleanup();jasmine.clock().uninstall();window.matchMedia=originalMatchMedia;});
 it('finishes the piece move before rotating and restores the turn on undo',()=>{
  window.matchMedia=(()=>({matches:false})) as unknown as typeof window.matchMedia;
  const view=renderHook(({ply,player})=>useBoardFacing('game',ply,gameFacing('kruzno',player,0,true)),{initialProps:{ply:0,player:1}});
  expect(view.result.current.flipped).toBeFalse();
  view.rerender({ply:1,player:0});
  expect(view.result.current.turning).toBeTrue();expect(view.result.current.flipped).toBeFalse();
  act(()=>jasmine.clock().tick(220));expect(view.result.current.flipped).toBeTrue();
  act(()=>jasmine.clock().tick(320));expect(view.result.current.turning).toBeFalse();
  view.rerender({ply:0,player:1});act(()=>jasmine.clock().tick(540));
  expect(view.result.current.flipped).toBeFalse();expect(view.result.current.turning).toBeFalse();
 });
 it('changes viewpoint immediately when reduced motion is enabled',()=>{
  window.matchMedia=(()=>({matches:true})) as unknown as typeof window.matchMedia;
  const view=renderHook(({ply,player})=>useBoardFacing('game',ply,gameFacing('kruzno',player,0,true)),{initialProps:{ply:0,player:1}});
  view.rerender({ply:1,player:0});expect(view.result.current.flipped).toBeTrue();expect(view.result.current.turning).toBeFalse();
 });
});
