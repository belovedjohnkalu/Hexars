import React from "react";
import { render, fireEvent, cleanup, act } from "@testing-library/react";
import { CloudComposer } from "../components/CloudComposer";
describe("Cloud composer", () => {
  afterEach(cleanup);
  const draft={name:""};
  it("focuses a desktop composer as it becomes available, without opening touch keyboards",async()=>{
    const original=window.matchMedia;let desktop=false;
    window.matchMedia=(()=>({matches:desktop,addEventListener:()=>{},removeEventListener:()=>{}})) as unknown as typeof window.matchMedia;
    const frame=spyOn(globalThis,'requestAnimationFrame').and.callFake(callback=>{callback(0);return 1;});
    try{const props={parentId:'a',busy:false,disabled:false,draft,onDraft:()=>{},onAdd:async()=>true},view=render(<CloudComposer {...props}/>),input=view.getByLabelText('Add a word or name your file');expect(document.activeElement).not.toBe(input);desktop=true;view.rerender(<CloudComposer {...props} parentId="b"/>);await act(async()=>{});expect(document.activeElement).toBe(input);expect(frame).toHaveBeenCalled();}finally{window.matchMedia=original;}
  });
  it("keeps an empty add button disabled", () => {
    const view=render(<CloudComposer parentId={null} busy={false} disabled={false} draft={draft} onDraft={()=>{}} onAdd={async()=>true}/>);
    expect((view.getByRole("button",{name:"Add"}) as HTMLButtonElement).disabled).toBeTrue();
    expect(view.getByLabelText("Add a word or name your file")).toBeTruthy();
  });
  it('places the color wheel above the input while editing',()=>{const view=render(<CloudComposer parentId={null} colors busy={false} disabled={false} draft={draft} onDraft={()=>{}} onAdd={async()=>true}/>),input=view.getByLabelText('Add a word or name your file');fireEvent.focus(input);const wheel=view.container.querySelector('[data-color-wheel]');expect(wheel).not.toBeNull();expect(wheel!.compareDocumentPosition(input)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();});
  it("saves to the current parent and clears only after success", async () => {
    const added:jasmine.Spy=jasmine.createSpy("add").and.resolveTo(true);
    const changed=()=>{};
    const view=render(<CloudComposer parentId="parent" busy={false} disabled={false} draft={draft} onDraft={changed} onAdd={added}/>);
    const input=view.getByLabelText("Add a word or name your file") as HTMLInputElement;
    fireEvent.change(input,{target:{value:"A thought"}});
    await act(async()=>{fireEvent.submit(view.getByRole("form",{name:"Add to this cloud"}));});
    expect(added).toHaveBeenCalled();
    expect(added.calls.mostRecent().args[0].parentId).toBe("parent");
    expect(added.calls.mostRecent().args[0].name).toBe("A thought");
    expect(input.value).toBe("");
  });
  it("preserves failed drafts and retries with the same creation ID", async () => {
    const added=jasmine.createSpy("add").and.resolveTo(false),changed=()=>{};
    const view=render(<CloudComposer parentId={null} busy={false} disabled={false} draft={draft} onDraft={changed} onAdd={added}/>);
    const input=view.getByLabelText("Add a word or name your file") as HTMLInputElement;
    fireEvent.change(input,{target:{value:"Keep this"}});
    await act(async()=>{fireEvent.submit(view.getByRole("form",{name:"Add to this cloud"}));});
    const id=added.calls.mostRecent().args[0].id;
    await act(async()=>{fireEvent.submit(view.getByRole("form",{name:"Add to this cloud"}));});
    expect(added.calls.mostRecent().args[0].id).toBe(id);
    expect(input.value).toBe("Keep this");
  });
  it("does not submit while an IME composition is active", async () => {
    const added=jasmine.createSpy("add").and.resolveTo(true),changed=()=>{};
    const view=render(<CloudComposer parentId={null} busy={false} disabled={false} draft={draft} onDraft={changed} onAdd={added}/>);
    const input=view.getByLabelText("Add a word or name your file");
    fireEvent.change(input,{target:{value:"思考"}});
    fireEvent.compositionStart(input);
    await act(async()=>{fireEvent.submit(view.getByRole("form",{name:"Add to this cloud"}));});
    expect(added).not.toHaveBeenCalled();
  });
  it("rejects unsupported pictures without uploading", () => {
    const view=render(<CloudComposer parentId={null} busy={false} disabled={false} draft={draft} onDraft={()=>{}} onAdd={async()=>true}/>);
    fireEvent.change(view.getByLabelText("Media files"),{target:{files:[new File(["test"],"test.svg",{type:"image/svg+xml"})]}});
    expect(view.getByRole("alert").textContent).toContain("PNG");
  });
});

describe('Live word counter',()=>{
 afterEach(cleanup);
 const nodes=[{id:'private',parentId:null,name:'Private'}];
 const props={parentId:'private',busy:false,disabled:false,draft:{name:''},onDraft:()=>{},onAdd:async()=>true,nodes,scope:'private' as const};
 it('counts whitespace-separated words as typed and hides pictures below the allowance',()=>{const view=render(<CloudComposer {...props}/>);expect(view.getByLabelText('0 words of 1')).toBeTruthy();fireEvent.change(view.getByLabelText('Add a word or name your file'),{target:{value:'One two'}});expect(view.getByLabelText('2 words of 1')).toBeTruthy();expect((view.getByRole('button',{name:'Add'}) as HTMLButtonElement).disabled).toBeTrue();expect(view.queryByRole('button',{name:'Choose media'})).toBeNull();});
 it('offers pictures only once another thousand words fit',()=>{const deep=[...nodes];for(let i=1;i<=10;i++)deep.push({id:'d'+i,parentId:i===1?'private':'d'+(i-1),name:'D'});const view=render(<CloudComposer {...props} nodes={deep} parentId="d10"/>);expect(view.getByRole('button',{name:'Choose media'})).toBeTruthy();fireEvent.change(view.getByLabelText('Add a word or name your file'),{target:{value:Array(25).fill('word').join(' ')}});expect(view.queryByRole('button',{name:'Choose media'})).toBeNull();});
});
