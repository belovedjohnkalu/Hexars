import { boardLayout } from './boardLayout';
import { ruleIllustration } from './ruleIllustration';
import { cloudTree } from './cloudTree';
import { chessVariants } from './chessVariants';
import { schema,type GameView } from '../endpoints/game_POST.schema';
describe('Brusky and De Vasa presentation',()=>{
 for(const variant of ['brusky','devasa'] as const){
  const board:GameView['board']={variant,orientation:'pointy',stage:'game',players:[0,1],cells:[]};
  for(let q=variant==='brusky'?-5:-4;q<=(variant==='brusky'?6:4);q++)for(let r=variant==='brusky'?Math.max(-4,-q-6):-4;r<=(variant==='brusky'?Math.min(3,6-q):4);r++)board.cells.push({q,r,notation:String.fromCharCode((variant==='brusky'?102:101)+q)+((variant==='brusky'?4:5)-r),colour:((q-r)%3+3)%3,piece:null});
  it(variant+' fits every pointy hex and its half-turn inside the native board frame',()=>{
   expect(board.cells.length).toBe(variant==='brusky'?84:81);const layout=boardLayout(board.cells,'pointy');expect(layout.vertexAngle).toBe(Math.PI/6);
   for(const cell of board.cells){const p=layout.position(cell);expect(Math.abs(p.x-300)+28*Math.sqrt(3)/2).toBeLessThan(layout.width/2);expect(Math.abs(p.y-300)+28).toBeLessThan(layout.height/2);}
   const up=layout.position({q:0,r:-1}),down=layout.position({q:0,r:1});expect(up.y).toBeLessThan(down.y);
  });
  it(variant+' has a board destination and complete paragraph clouds with valid illustrated cells',()=>{
   expect(chessVariants.isId(variant)).toBeTrue();expect(cloudTree.seed.find(n=>n.id===variant+'-board')?.destination).toBe(variant);
   const paragraphs=cloudTree.seed.filter(n=>n.parentId===variant+'-rules'),valid=new Set(board.cells.map(c=>c.q+','+c.r));expect(paragraphs.length).toBe(23);
   for(const node of paragraphs){expect(node.isImage).toBeFalse();expect(node.note!.length).toBeGreaterThan(70);if(node.illustration==='setup')continue;const diagram=ruleIllustration(board,node.illustration!,variant);for(const p of diagram.pieces)expect(valid.has(p.q+','+p.r)).toBeTrue();for(const p of diagram.targets)expect(valid.has(p)).toBeTrue();}
   const captures=ruleIllustration(board,'initial-capture',variant);expect(captures.targets.size).toBe(variant==='brusky'?3:2);
   const pawn=captures.pieces.find(p=>p.type==='pawn'&&p.player===0)!;for(const [q,r] of [[0,-1],[1,-1]])expect(captures.targets.has((pawn.q+q)+','+(pawn.r+r))).toBeFalse();
   if(variant==='brusky'){expect(captures.targets.has((pawn.q+1)+','+(pawn.r-2))).toBeTrue();expect(captures.caption).toContain('Neither adjacent');expect(paragraphs.find(n=>n.illustration==='advance')?.note).toContain('cannot capture an enemy on either');}
   const blockers=ruleIllustration(board,'blocked',variant);expect(blockers.targets.size).toBe(variant==='brusky'?0:1);
  });
 }
 it('accepts Brusky’s outer l-file moves and rejects unsupported variants',()=>{
  const base={action:'move',gameId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',accessToken:'a'.repeat(64),version:0};
  expect(schema.safeParse({...base,move:{from:{q:6,r:-3},to:{q:6,r:-1}}}).success).toBeTrue();expect(schema.safeParse({...base,move:{from:{q:7,r:0},to:{q:0,r:0}}}).success).toBeFalse();
 });
});
