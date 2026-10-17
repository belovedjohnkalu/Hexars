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
