import { cloudDrafts } from "./cloudDrafts";
describe("Cloud drafts",()=>{
  afterEach(()=>{cloudDrafts.set("draft-test",{name:""});sessionStorage.removeItem("ion.word-drafts.v1");});
  it("reads a saved text draft and ignores malformed values",()=>{
    sessionStorage.setItem("ion.word-drafts.v1",JSON.stringify({"saved-test":"A thought","bad":{name:"invalid"}}));
    expect(cloudDrafts.get("saved-test").name).toBe("A thought");
    expect(cloudDrafts.get("bad").name).toBe("");
  });
  it("keeps words through session storage and tracks pending pictures",()=>{
    const file=new File(["image"],"picture.png",{type:"image/png"});
    cloudDrafts.set("draft-test",{name:"Remember this",file});
    expect(JSON.parse(sessionStorage.getItem("ion.word-drafts.v1")!)["draft-test"]).toBe("Remember this");
    expect(cloudDrafts.get("draft-test").file).toBe(file);expect(cloudDrafts.hasPictures()).toBeTrue();
    cloudDrafts.set("draft-test",{name:""});expect(cloudDrafts.hasPictures()).toBeFalse();
  });
});
