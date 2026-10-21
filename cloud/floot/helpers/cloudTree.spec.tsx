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

describe('Recursive character weights',()=>{
 const nodes=[{id:'a',parentId:null,name:'A'},{id:'b',parentId:null,name:'B'},{id:'c',parentId:'a',name:'ten letters'},{id:'d',parentId:'c',name:'🫧',note:'Rule text'},{id:'e',parentId:'b',name:'Short'}];
 it('includes every character at every depth, including note text and Unicode code points',()=>{
  const weights=cloudTree.characterWeights(nodes);expect(weights.get('d')).toBe(10);expect(weights.get('c')).toBe(21);expect(weights.get('a')).toBe(22);expect(weights.get('b')).toBe(6);
  const after=cloudTree.characterWeights(nodes.map(n=>n.id==='d'?{...n,name:n.name+'!'}:n));expect(after.get('a')).toBe(23);expect(after.get('c')).toBe(22);expect(after.get('b')).toBe(6);
 });
 it('keeps descendant counts separate for deletion confirmation and excludes deleted text',()=>{
  const sizes=cloudTree.sizes(nodes,null);expect(sizes[0].count).toBe(2);expect(sizes[0].characters).toBe(22);
  expect(cloudTree.characterWeights([...nodes,{id:'gone',name:'Deleted text',parentId:'a',removedBy:'removed'}]).get('a')).toBe(22);
 });
});

describe('Picture word equivalents',()=>{
 it('gives one picture exactly the same content weight as one thousand words',()=>{const nodes=[{id:'photo',parentId:null,name:'Label',isImage:true},{id:'text',parentId:null,name:'Label '+Array(1000).fill('word').join(' ')}];const weights=cloudTree.wordWeights(nodes);expect(weights.get('photo')).toBe(weights.get('text'));expect(cloudTree.sizes(nodes,null).map(n=>n.percent)).toEqual([50,50]);});
 it('adds each picture in a collage through every ancestor without inflating descendant count',()=>{const nodes=[{id:'root',parentId:null,name:'Root'},{id:'photos',parentId:'root',name:'Photos',imageUrls:['one','two','three']}];expect(cloudTree.wordWeights(nodes).get('root')).toBe(3002);expect(cloudTree.descendants(nodes,'root')).toBe(1);});
});
