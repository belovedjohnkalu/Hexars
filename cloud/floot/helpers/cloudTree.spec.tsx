import { cloudTree } from "./cloudTree";
describe("Cloud hierarchy and relative size", () => {
  const nodes = [
    { id:"a", parentId:null, name:"A" }, { id:"e", parentId:null, name:"E" },
    { id:"b", parentId:"a", name:"B" }, { id:"d", parentId:"a", name:"D" },
    { id:"c", parentId:"b", name:"C" }, { id:"f", parentId:"a", name:"F" },
    { id:"g", parentId:"f", name:"G" }, { id:"h", parentId:"f", name:"H" },
  ];
  it("counts descendants without connecting separate branches", () => {
    expect(cloudTree.descendants(nodes,"a")).toBe(6);
    expect(cloudTree.descendants(nodes,"b")).toBe(1);
    expect(cloudTree.descendants(nodes,"d")).toBe(0);
    expect(cloudTree.path(nodes,"c").map(n=>n.id)).toEqual(["a","b","c"]);
  });
  it("normalizes visible siblings at 0, 50, 100 percent", () => {
    expect(cloudTree.sizes(nodes,"a").map(n=>n.percent)).toEqual([50,0,100]);
    expect(cloudTree.sizes(nodes,null).map(n=>n.percent)).toEqual([100,0]);
  });
  it("keeps single and equally empty items visible at equal sizes", () => {
    expect(cloudTree.sizes(nodes,"b")[0].percent).toBe(50);
    expect(cloudTree.sizes([{id:"x",name:"X",parentId:null},{id:"y",name:"Y",parentId:null}],null).map(n=>n.percent)).toEqual([50,50]);
    expect(cloudTree.sizes(nodes,"missing")).toEqual([]);
  });
  it("terminates safely if malformed data contains a cycle", () => {
    const cycle = [{id:"a",parentId:"b",name:"A"},{id:"b",parentId:"a",name:"B"}];
    expect(cloudTree.descendants(cycle,"a")).toBe(1);
    expect(cloudTree.path(cycle,"a").length).toBe(2);
  });
});
