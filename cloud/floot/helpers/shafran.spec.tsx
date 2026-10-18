import { boardLayout } from "./boardLayout";
import { ruleIllustration } from "./ruleIllustration";
import { cloudTree } from "./cloudTree";
import { chessVariants } from "./chessVariants";
import type { GameView } from "../endpoints/game_POST.schema";

describe("Shafran presentation", () => {
  const cells: GameView["board"]["cells"] = [];
  for (let q=-4;q<=4;q++) for (let r=Math.max(-5,-5-q);r<=Math.min(4,4-q);r++) cells.push({q,r,notation:String.fromCharCode(101+q)+(r+q+6),colour:((q-r)%3+3)%3,piece:null});
  const board: GameView["board"] = {variant:"shafran",stage:"playable",players:[0,1],cells};
  it("adds a real variant destination and keeps engine return navigation typed", () => {
    expect(chessVariants.all.map(v=>v.cells)).toEqual([91,91,70]);
    expect(chessVariants.isId("shafran")).toBeTrue();
    expect(chessVariants.isId("unknown")).toBeFalse();
    expect(chessVariants.name("shafran")).toBe("Shafran");
    expect(cloudTree.seed.find(n=>n.id==="shafran-board")?.destination).toBe("shafran");
  });
  it("centers the board between cells and fits all hexagons through a half-turn", () => {
    expect(cells.length).toBe(70);
    const layout=boardLayout(cells);
    expect(layout.width).toBe(400);
    expect(layout.height).toBe(499);
    const points=cells.map(c=>layout.position(c));
    expect((Math.min(...points.map(p=>p.y))+Math.max(...points.map(p=>p.y)))/2).toBeCloseTo(300);
    for(const p of points) for(const sign of [-1,1]) {
      expect(Math.abs(sign*(p.x-300))+28).toBeLessThan(layout.width/2);
      expect(Math.abs(sign*(p.y-300))+28*Math.sqrt(3)/2).toBeLessThan(layout.height/2);
    }
    const middle=layout.position({q:0,r:0});
    expect(middle.y).toBeCloseTo(300-14*Math.sqrt(3));
  });
  it("keeps every paragraph a word and every teaching piece on the real board", () => {
    const paragraphs=cloudTree.seed.filter(n=>n.parentId==="shafran-rules");
    expect(paragraphs.length).toBe(22);
    const valid=new Set(cells.map(c=>`${c.q},${c.r}`));
    for(const paragraph of paragraphs) {
      expect(paragraph.isImage).toBeFalse();
      expect(paragraph.note!.length).toBeGreaterThan(40);
      if(paragraph.illustration==="setup")continue;
      const diagram=ruleIllustration(board,paragraph.illustration!,"shafran");
      for(const piece of diagram.pieces)expect(valid.has(`${piece.q},${piece.r}`)).toBeTrue();
      for(const target of diagram.targets)expect(valid.has(target)).toBeTrue();
    }
  });
  it("illustrates both crossed en-passant cells and both choices on each castling flank", () => {
    const names=(kind:string)=>[...ruleIllustration(board,kind,"shafran").targets].map(k=>cells.find(c=>`${c.q},${c.r}`===k)!.notation).sort();
    expect(names("en-passant")).toEqual(["d6","d7"]);
    expect(names("triple")).toEqual(["e3","e4","e5"]);
    expect(names("castle-queen")).toEqual(["b1","c1"]);
    expect(names("castle-bishop")).toEqual(["g3","h4"]);
    expect(names("promotion")).toEqual(["e10"]);
  });
});
