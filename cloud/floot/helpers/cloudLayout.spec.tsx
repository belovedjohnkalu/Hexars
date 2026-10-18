import { cloudLayout } from "./cloudLayout";
describe("Cloud layout", () => {
  const measure = (text: string, size: number) => text.length * size * .54;
  for (const width of [280,393,820,1280]) it("keeps words readable and separate at " + width + "px", () => {
    const nodes = Array.from({length:30},(_,i)=>({id:String(i),name:i===0?"An unusually long cloud name":i===1?"Z".repeat(80):"Word "+i,percent:i%3*50,...(i===3?{imageUrl:"test.png"}:{})}));
    const result = cloudLayout(nodes,width,480,measure);
    for (const item of result.items) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x+item.width).toBeLessThanOrEqual(width);
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
  for(const width of [280,393,1024]){const result=cloudLayout(nodes,width,600,(text,size)=>text.length*size*.54);for(const a of result.items){expect(a.x).toBeGreaterThanOrEqual(0);expect(a.x+a.width).toBeLessThanOrEqual(width);for(const b of result.items.filter(n=>n.id!==a.id))expect(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y).toBeFalse();}}
 });
});
