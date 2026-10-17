import { useCallback, useEffect, useRef, useState } from "react";
import { postCloud, type InputType, type OutputType } from "../endpoints/cloud_POST.schema";
import { RealtimeClient } from "./RealtimeClient";
import { cloudTree } from "./cloudTree";
type Credentials={workspaceId:string;accessToken:string;account?:boolean};
type Change=Extract<InputType,{action:"rename"|"remove"|"restore"|"move"|"copy"}>;
type NewNode={id:string;name:string;parentId:string|null;file?:File;uploaded?:boolean};
const key="ion.private-space.v1";
let cached:{workspaceId:string;data:OutputType}|null=null;
const message=(failure:unknown,fallback:string)=>failure instanceof Error&&!(failure instanceof TypeError)&&!(failure instanceof SyntaxError)?failure.message:fallback;
function credentials():Credentials {
  let saved:Credentials|null=null;
  try {saved=JSON.parse(localStorage.getItem(key)||"null");} catch {throw new Error("Browser storage is unavailable. Allow website data, then try again.");}
  if(saved&&/^[a-f0-9-]{36}$/.test(saved.workspaceId)&&/^[a-f0-9]{64}$/.test(saved.accessToken))return saved;
  if(saved)throw new Error("Your saved space couldn’t be opened. Keep this browser’s website data and try again.");
  const bytes=crypto.getRandomValues(new Uint8Array(32));
  const value={workspaceId:crypto.randomUUID(),accessToken:Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("")};
  try {localStorage.setItem(key,JSON.stringify(value));}catch{throw new Error("Allow browser storage to keep your space, then try again.");}
  return value;
}
export function useCloudSpace(accountId:number|null=null,authLoading=false){
  const [data,setData]=useState<OutputType>(()=>{try{return !accountId&&cached?.workspaceId===JSON.parse(localStorage.getItem(key)||"null")?.workspaceId?cached!.data:{nodes:cloudTree.seed,version:0};}catch{return {nodes:cloudTree.seed,version:0};}});
  const [loading,setLoading]=useState(true),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[phase,setPhase]=useState<"idle"|"uploading"|"saving">("idle");
  const scope=useRef<string>(""),identity=useRef<Credentials|null>(null),current=useRef(data),mounted=useRef(true),locked=useRef(false),uploadController=useRef<AbortController|null>(null);
  const accept=useCallback((value:OutputType)=>{
    if(value.version<current.current.version)return;
    current.current=value;
    if(identity.current&&!identity.current.account)cached={workspaceId:identity.current.workspaceId,data:value};
    if(mounted.current)setData(value);
  },[]);
  const load=useCallback(async(signal?:AbortSignal)=>{
    try{
      const guest=credentials(),nextScope=accountId?"account:"+accountId:guest.workspaceId;
      if(scope.current!==nextScope){scope.current=nextScope;current.current={nodes:cloudTree.seed,version:0};if(mounted.current){setData(current.current);setReady(false);}}
      if(accountId)cached=null;
      identity.current={...guest,account:!!accountId};
      const value=await postCloud({action:"load",...identity.current,connect:!!accountId&&sessionStorage.getItem("ion.connect-space")==="yes"},{signal});
      if(mounted.current&&!signal?.aborted){accept(value);if(accountId)sessionStorage.removeItem("ion.connect-space");setError("");setReady(true);}
    }catch(failure){if(mounted.current&&!signal?.aborted)setError(message(failure,"Couldn’t open your space. Check your connection and try again."));}
    finally{if(mounted.current&&!signal?.aborted)setLoading(false);}
  },[accept,accountId]);
  useEffect(()=>{
    mounted.current=true;if(authLoading)return;const controller=new AbortController();void load(controller.signal);
    const refresh=()=>{if(document.visibilityState==="visible"&&!locked.current)void load(controller.signal);};
    window.addEventListener("focus",refresh);window.addEventListener("online",refresh);document.addEventListener("visibilitychange",refresh);
    return()=>{mounted.current=false;controller.abort();window.removeEventListener("focus",refresh);window.removeEventListener("online",refresh);document.removeEventListener("visibilitychange",refresh);};
  },[load,authLoading]);
  useEffect(()=>{
    if(!accountId||authLoading)return;
    const client=new RealtimeClient();let timer:ReturnType<typeof setTimeout>|undefined;
    const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(!locked.current)void load();else refresh();},300);};
    const off=client.subscribe("cloud-user:"+accountId,refresh),again=client.onReconnect(refresh);
    void client.connect();return()=>{clearTimeout(timer);off();again();client.close();};
  },[accountId,authLoading,load]);
  async function mutate(body:Omit<Change,"workspaceId"|"accessToken"|"version">|NewNode,kind:"change"|"add"){
    if(!identity.current||!ready||locked.current)return false;
    locked.current=true;setBusy(true);setError("");
    try{
      if(kind==="add"){
        const item=body as NewNode,imageType=item.file?.type as Extract<InputType,{action:"add"}>["imageType"];
        if(item.file&&!item.uploaded){
          setPhase("uploading");const controller=new AbortController();uploadController.current=controller;
          const prepared=await postCloud({action:"upload",...identity.current,id:item.id,contentType:imageType!,sizeBytes:item.file.size},{signal:controller.signal});
          if(!prepared.upload)throw new Error("Couldn’t prepare the picture. Try again.");
          const response=await fetch(prepared.upload.url,{method:"PUT",headers:prepared.upload.headers,body:item.file,signal:controller.signal});
          if(!response.ok)throw new Error("Couldn’t upload the picture. Try again.");
          item.uploaded=true;uploadController.current=null;
        }
        setPhase("saving");
        const request=()=>postCloud({action:"add",...identity.current!,id:item.id,name:item.name,parentId:item.parentId,version:current.current.version,...(imageType?{imageType}:{})});
        let value:OutputType;
        try{value=await request();}catch(failure){if(!(failure&&typeof failure==="object"&&"status" in failure&&failure.status===409))throw failure;await load();value=await request();}
        accept(value);
      }else{
        setPhase("saving");const input={...body,...identity.current,version:current.current.version} as Change;
        const value=await postCloud(input);accept(value);
      }
      return true;
    }catch(failure){
      if(failure&&typeof failure==="object"&&"status" in failure&&failure.status===409)await load();
      const cancelled=failure instanceof Error&&failure.name==="AbortError";
      if(mounted.current)setError(cancelled?"":message(failure,"Couldn’t save. Check your connection and try again."));
      return false;
    }finally{locked.current=false;uploadController.current=null;if(mounted.current){setBusy(false);setPhase("idle");}}
  }
  return {...data,loading,ready,busy,error,phase,add:(input:NewNode)=>mutate(input,"add"),
    rename:(id:string,name:string)=>mutate({action:"rename",id,name} as Omit<Change,"workspaceId"|"accessToken"|"version">,"change"),
    remove:(id:string,expectedCount:number,operationId:string)=>mutate({action:"remove",id,expectedCount,operationId} as Omit<Change,"workspaceId"|"accessToken"|"version">,"change"),
    relocate:(id:string,parentId:string|null,copy:boolean,operationId:string)=>mutate({action:copy?"copy":"move",id,parentId,operationId} as Omit<Change,"workspaceId"|"accessToken"|"version">,"change"),
    restore:(operationId:string)=>mutate({action:"restore",operationId} as Omit<Change,"workspaceId"|"accessToken"|"version">,"change"),
    cancelUpload:()=>uploadController.current?.abort(),retry:load,clearError:()=>setError("")};
}
