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
    try{const props={parentId:'a',busy:false,disabled:false,draft,onDraft:()=>{},onAdd:async()=>true},view=render(<CloudComposer {...props}/>),input=view.getByLabelText('Add a word or a picture name');expect(document.activeElement).not.toBe(input);desktop=true;view.rerender(<CloudComposer {...props} parentId="b"/>);await act(async()=>{});expect(document.activeElement).toBe(input);expect(frame).toHaveBeenCalled();}finally{window.matchMedia=original;}
  });
  it("keeps an empty add button disabled", () => {
    const view=render(<CloudComposer parentId={null} busy={false} disabled={false} draft={draft} onDraft={()=>{}} onAdd={async()=>true}/>);
    expect((view.getByRole("button",{name:"Add"}) as HTMLButtonElement).disabled).toBeTrue();
    expect(view.getByLabelText("Add a word or a picture name")).toBeTruthy();
  });
  it("saves to the current parent and clears only after success", async () => {
    const added:jasmine.Spy=jasmine.createSpy("add").and.resolveTo(true);
    const changed=()=>{};
    const view=render(<CloudComposer parentId="parent" busy={false} disabled={false} draft={draft} onDraft={changed} onAdd={added}/>);
    const input=view.getByLabelText("Add a word or a picture name") as HTMLInputElement;
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
    const input=view.getByLabelText("Add a word or a picture name") as HTMLInputElement;
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
    const input=view.getByLabelText("Add a word or a picture name");
    fireEvent.change(input,{target:{value:"思考"}});
    fireEvent.compositionStart(input);
    await act(async()=>{fireEvent.submit(view.getByRole("form",{name:"Add to this cloud"}));});
    expect(added).not.toHaveBeenCalled();
  });
  it("rejects unsupported pictures without uploading", () => {
    const view=render(<CloudComposer parentId={null} busy={false} disabled={false} draft={draft} onDraft={()=>{}} onAdd={async()=>true}/>);
    fireEvent.change(view.getByLabelText("Picture file"),{target:{files:[new File(["test"],"test.svg",{type:"image/svg+xml"})]}});
    expect(view.getByRole("alert").textContent).toContain("PNG");
  });
});
