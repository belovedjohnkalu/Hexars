import { cloudLayout } from "./cloudLayout";
describe("Cloud layout", () => {
  const measure = (text: string, size: number) => text.length * size * .54;
  for (const width of [280,393,820,1280]) it("keeps words readable and separate at " + width + "px", () => {
    const nodes = Array.from({length:30},(_,i)=>({id:String(i),name:i===0?"An unusually long cloud name":i===1?"Z".repeat(80):"Word "+i,percent:i%3*50,...(i===3?{imageUrl:"test.png"}:{})}));
    const result = cloudLayout(nodes,width,480,measure);
    for (const item of result.items) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x+item.width).toBeLessThanOrEqual(result.width);
      expect(item.fontSize).toBeGreaterThanOrEqual(17);
      expect(item.y).toBeGreaterThanOrEqual(0);
      for (const other of result.items.filter(n=>n.id!==item.id)) {
        const overlap=item.x<other.x+other.width&&item.x+item.width>other.x&&item.y<other.y+other.height&&item.y+item.height>other.y;
        expect(overlap).toBeFalse();
      }
    }
  });
});

describe('Square Rules and anchored cloud updates',()=>{
 const measure=(text:string,size:number)=>text.length*size*.54;
 const names=['Board','Starting pieces','Rook','Bishop','Queen','King','Knight','Pawns','Pawn captures','First move','En passant','Promotion','Check','Checkmate','Stalemate','Draw','Castling','Long castling','Short castling','Turn order','Undo','Scoring'];
 const nodes=names.map((name,i)=>({id:String(i),name,percent:i%4*100/3}));
 it('uses two-dimensional space rather than a phone-width column, without shrinking words',()=>{
  const result=cloudLayout(nodes,825,600,measure,{square:true,compact:true});
  const left=Math.min(...result.items.map(r=>r.x)),right=Math.max(...result.items.map(r=>r.x+r.width)),top=Math.min(...result.items.map(r=>r.y)),bottom=Math.max(...result.items.map(r=>r.y+r.height));
  expect(result.width).toBe(result.height);expect((right-left)/(bottom-top)).toBeGreaterThan(.65);expect((right-left)/(bottom-top)).toBeLessThan(1.8);expect(right-left).toBeGreaterThan(393);
  expect(result.items.every(r=>r.fontSize>=17&&r.fontSize<=30)).toBeTrue();
 });
 it('keeps survivor centers and world dimensions after deleting a cloud',()=>{
  const first=cloudLayout(nodes,825,600,measure,{square:true,compact:true}),next=cloudLayout(nodes.filter(n=>n.id!=='0'),825,600,measure,{square:true,compact:true,previous:first});
  expect(next.width).toBe(first.width);expect(next.height).toBe(first.height);
  for(const rect of next.items){const old=first.items.find(n=>n.id===rect.id)!;expect(rect.x+rect.width/2).toBeCloseTo(old.x+old.width/2,5);expect(rect.y+rect.height/2).toBeCloseTo(old.y+old.height/2,5);}
 });
 it('does not collapse the world when the final word is deleted',()=>{
  const first=cloudLayout(nodes.slice(0,1),393,600,measure),next=cloudLayout([],393,600,measure,{previous:first});expect(next.height).toBe(first.height);expect(next.width).toBe(first.width);expect(next.items.length).toBe(0);
 });
 it('places added and resized words without overlapping retained labels',()=>{
  const first=cloudLayout(nodes,825,600,measure,{square:true,compact:true}),changed=[...nodes.map(n=>n.id==='0'?{...n,name:'A longer edited rule with many words',percent:100}:n),{id:'added',name:'Added rule',percent:50}];
  const result=cloudLayout(changed,825,600,measure,{square:true,compact:true,previous:first});
  for(const a of result.items)for(const b of result.items.filter(r=>r.id!==a.id))expect(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y).toBeFalse();
 });
 it('reuses the original anchor for Undo when the visit retains removed anchors',()=>{
  const first=cloudLayout(nodes,825,600,measure,{square:true,compact:true}),deleted=cloudLayout(nodes.slice(1),825,600,measure,{square:true,compact:true,previous:first});
  const anchors={...deleted,items:[...new Map([...first.items,...deleted.items].map(n=>[n.id,n])).values()]};
  const restored=cloudLayout(nodes,825,600,measure,{square:true,compact:true,previous:anchors});
  for(const rect of restored.items){const old=first.items.find(n=>n.id===rect.id)!;expect(rect.x).toBeCloseTo(old.x,5);expect(rect.y).toBeCloseTo(old.y,5);}
 });

});


describe('Owner identifiers in spatial layout',()=>{
 it('reserves separate space for labels without overlaps, including alphabetic overflow',()=>{
  const nodes=Array.from({length:32},(_,i)=>({id:String(i),name:'Cloud '+i,percent:50,identifier:'IL1'+'A'.repeat(i===31?102:Math.floor(i/10))+i%10,...(i===4?{isImage:true}:{})}));
  for(const width of [280,393,1024]){const result=cloudLayout(nodes,width,600,(text,size)=>text.length*size*.54);for(const a of result.items){expect(a.x).toBeGreaterThanOrEqual(0);expect(a.x+a.width).toBeLessThanOrEqual(result.width);for(const b of result.items.filter(n=>n.id!==a.id))expect(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y).toBeFalse();}}
 });
});


describe('Whole cloud labels',()=>{
 const measure=(text:string,size:number)=>text.length*size*.54;
 it('reserves one uninterrupted line for words, sentences, email addresses and photo captions',()=>{
  const names=['Remember','Sign out','Add account','someone.with.a.long.address@example.com','A complete sentence stays together.','A long caption stays together too.'];
  for(const width of [280,393,820]){
   const nodes=names.map((name,i)=>({id:String(i),name,percent:i%2*100,identifier:'IL4'+i,...(i===5?{isImage:true}:{})})),result=cloudLayout(nodes,width,600,measure);
   for(const rect of result.items){const node=nodes.find(n=>n.id===rect.id)!;expect(rect.width).toBeGreaterThanOrEqual(measure(node.name,node.isImage?16:rect.fontSize)+24);expect(rect.height).toBeLessThan(250);}
   const photo=result.items.find(n=>n.id==='5')!;expect(photo.pictureSize).toBeLessThan(photo.width-24);
  }
 });
});

describe('Boards aligned collection',()=>{
 const measure=(text:string,size:number)=>text.length*size*.54;
 const boards=['Gliński','McCooey','Shafran','Brusky','De Vasa','Wellisch'].map((name,i)=>({id:String(i),name:name+'’s Variant',isImage:true,percent:0}));
 it('places six boards in two aligned columns and three rows at phone and desktop widths',()=>{
  for(const width of [320,393,820]){
   const result=cloudLayout(boards,width,600,measure,{boardGrid:true,compact:width<600});
   const centers=result.items.map(n=>Math.round(n.x+n.width/2)),rows=result.items.map(n=>Math.round(n.y));
   expect(new Set(centers).size).toBe(2);expect(new Set(rows).size).toBe(3);
   expect(result.items.every(n=>n.x>=0&&n.x+n.width<=result.width)).toBeTrue();
  }
 });
 it('retains grid slots and centers after deletion and appends new boards',()=>{
  const first=cloudLayout(boards,393,600,measure,{boardGrid:true,compact:true});
  const next=cloudLayout([...boards.slice(0,5),{id:'new',name:'New',isImage:true,percent:0}],393,600,measure,{boardGrid:true,compact:true,previous:first});
  for(const n of next.items.filter(n=>n.id!=='new')){const old=first.items.find(o=>o.id===n.id)!;expect(n.x).toBeCloseTo(old.x,5);expect(n.y).toBeCloseTo(old.y,5);}
  expect(next.items.find(n=>n.id==='new')?.gridSlot).toBe(6);
 });
});


describe('Coarse-pointer cloud targets',()=>{
 const measure=(text:string,size:number)=>text.length*size*.54;
 const nodes=Array.from({length:32},(_,i)=>({id:String(i),name:i===4?'A longer word cloud label':'Word '+i,percent:i%3*50,characters:i*7,...(i===7?{isImage:true}:{})}));
 const assertPacked=(result:ReturnType<typeof cloudLayout>)=>{
  for(const item of result.items){
   expect(item.width).toBeGreaterThanOrEqual(56);expect(item.height).toBeGreaterThanOrEqual(56);
   expect(item.x).toBeGreaterThanOrEqual(0);expect(item.x+item.width).toBeLessThanOrEqual(result.width);
   for(const other of result.items.filter(n=>n.id!==item.id))expect(item.x<other.x+other.width&&item.x+item.width>other.x&&item.y<other.y+other.height&&item.y+item.height>other.y).toBeFalse();
  }
 };
 it('packs larger touch targets without changing font or image proportions',()=>{
  for(const width of [280,393,820]){
   const standard=cloudLayout(nodes,width,600,measure,{organic:true,compact:width<600}),touch=cloudLayout(nodes,width,600,measure,{organic:true,compact:width<600,minTargetSize:56});
   assertPacked(touch);
   for(const item of touch.items){const original=standard.items.find(n=>n.id===item.id)!;expect(item.fontSize).toBe(original.fontSize);expect(item.pictureSize).toBe(original.pictureSize);expect(item.captionSize).toBe(original.captionSize);}
  }
 });
 it('reserves minimum targets through retained layouts, insertions and edited labels',()=>{
  const first=cloudLayout(nodes,393,600,measure,{organic:true,compact:true,minTargetSize:56});
  const next=cloudLayout([...nodes.map(n=>n.id==='0'?{...n,name:'An expanded label'}:n),{id:'new',name:'New',percent:0}],393,600,measure,{organic:true,compact:true,minTargetSize:56,previous:first});
  assertPacked(next);
 });
});

describe('Page-relative linear word sizing',()=>{
 it('maps the smallest word to the readable minimum and interpolates without a two-size exception',()=>{
 const measure=(text:string,size:number)=>text.length*size*.54;
 const layout=cloudLayout([0,25,50,75,100].map(percent=>({id:String(percent),name:'Word',percent})),393,600,measure,{organic:true,compact:true});
 const size=(id:string)=>layout.items.find(n=>n.id===id)!.fontSize;
 expect(size('0')).toBe(15);expect(size('100')).toBeGreaterThan(80);expect(size('50')).toBeCloseTo((size('0')+size('100'))/2,12);
 const binary=cloudLayout([{id:'0',name:'Word',percent:0},{id:'100',name:'Word',percent:100}],393,600,measure,{organic:true,compact:true});expect(binary.items.find(n=>n.id==='100')!.fontSize).toBe(size('100'));
 });
});

describe('Compact opening typography',()=>{it('uses the actual screen cap rather than allowing a wide virtual world to inflate words',()=>{
 const measure=(s:string,n:number)=>s.length*n*.54,items=[{id:'a',name:'Boards',percent:100},{id:'b',name:'Rules',percent:50},{id:'c',name:'Engines',percent:0}];
 const r=cloudLayout(items,1200,650,measure,{organic:true,compact:true,maxFontSize:70,minTargetSize:72});expect(Math.max(...r.items.map(n=>n.fontSize))).toBe(70);for(const a of r.items){expect(a.height).toBeGreaterThanOrEqual(72);for(const b of r.items.filter(n=>n.id!==a.id))expect(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y).toBeFalse();}
});});
