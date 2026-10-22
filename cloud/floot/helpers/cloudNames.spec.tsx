import { cloudNames } from "./cloudNames";
import { schema } from "../endpoints/cloud_POST.schema";
import { cloudDrafts } from "./cloudDrafts";

describe("Private cloud names",()=>{
  const long=Array.from({length:160},(_,i)=>"word"+i).join(" ");
  const credentials={workspaceId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",accessToken:"a".repeat(64),version:0};
  it("accepts names beyond 80 characters and 80 words for creation and editing",()=>{
    for(const action of ["add","rename"] as const){
      const input={...credentials,action,scope:"private" as const,id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",parentId:"private",name:long};
      expect(schema.parse(input).action).toBe(action);
      expect(cloudNames.schema("private").parse(long)).toBe(long);
    }
    expect(schema.parse({...credentials,action:"add",scope:"private",id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",parentId:"private",name:"A".repeat(6000)}).action).toBe("add");
  });
  it("preserves public validation, empty-name validation and full private drafts",()=>{
    expect(cloudNames.schema("public").safeParse(long).success).toBeTrue();
    expect(cloudNames.schema("private").safeParse("   ").success).toBeFalse();
    const key="private-long-qa";cloudDrafts.set(key,{name:long});
    expect(cloudDrafts.get(key).name).toBe(long);
    cloudDrafts.set(key,{name:""});
  });
  it("only shortens the display preview, without splitting emoji or modifying storage",()=>{
    const emoji="🫧".repeat(200);expect(Array.from(cloudNames.preview(emoji)).length).toBe(160);
    expect(cloudNames.preview("Short word")).toBe("Short word");
    expect(long.split(" ").length).toBe(160);
  });
});

describe('Long names in every word space',()=>{
 const long='An unrestricted name '.repeat(40).trim();
 it('accepts full names for Home, Chess, Accounts, Public and Private on create and edit',()=>{
 const credentials={workspaceId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',accessToken:'a'.repeat(64),version:0};
 for(const scope of ['home','chess','accounts','public','private'] as const){expect(cloudNames.schema(scope).parse(long)).toBe(long);for(const action of ['add','rename'] as const)expect(schema.parse({...credentials,action,scope,id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',parentId:'ion',name:long}).name).toBe(long);}
 });
});
