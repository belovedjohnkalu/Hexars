import { useCallback, useEffect, useRef, useState } from "react";
import { postCloud, type InputType, type OutputType } from "../endpoints/cloud_POST.schema";
import { cloudTree } from "./cloudTree";
type Credentials = { workspaceId: string; accessToken: string };
const failureMessage = (failure: unknown, fallback: string) => failure instanceof Error && !(failure instanceof TypeError) && !(failure instanceof SyntaxError) ? failure.message : fallback;
const key = "ion.private-space.v1";
function credentials(): Credentials {
  const saved = JSON.parse(localStorage.getItem(key) || "null");
  if (saved && typeof saved.workspaceId === "string" && /^[a-f0-9-]{36}$/.test(saved.workspaceId) && typeof saved.accessToken === "string" && /^[a-f0-9]{64}$/.test(saved.accessToken)) return saved;
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const value = { workspaceId: crypto.randomUUID(), accessToken: Array.from(bytes,b => b.toString(16).padStart(2,"0")).join("") };
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}
export function useCloudSpace() {
  const [data, setData] = useState<OutputType>({ nodes: cloudTree.seed, version: 0 });
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const identity = useRef<Credentials | null>(null), current = useRef(data), mounted = useRef(true), locked = useRef(false);
  const accept = useCallback((value: OutputType) => { if (value.version < current.current.version) return; current.current = value; if (mounted.current) setData(value); }, []);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      identity.current = credentials();
      const value = await postCloud({ action: "load", ...identity.current }, { signal });
      if (mounted.current && !signal?.aborted) { accept(value); setError(""); }
    } catch (failure) {
      if (mounted.current && !signal?.aborted) setError(failureMessage(failure, "Couldn’t open your space. Check your connection and try again."));
    } finally { if (mounted.current && !signal?.aborted) setLoading(false); }
  }, [accept]);
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController(); void load(controller.signal);
    const refresh = () => { if (document.visibilityState === "visible" && !locked.current) void load(controller.signal); };
    window.addEventListener("focus", refresh);
    return () => { mounted.current = false; controller.abort(); window.removeEventListener("focus", refresh); };
  }, [load]);
  const add = async (input: { id: string; name: string; parentId: string | null; file?: File; uploaded?: boolean }) => {
    if (!identity.current || loading || locked.current) return false;
    locked.current = true; setBusy(true); setError("");
    try {
      const imageType = input.file?.type as Extract<InputType,{action:"add"}>["imageType"];
      if (input.file && !input.uploaded) {
        const prepared = await postCloud({ action: "upload", ...identity.current, id: input.id, contentType: imageType!, sizeBytes: input.file.size });
        if (!prepared.upload) throw new Error("Couldn’t prepare the picture.");
        const response = await fetch(prepared.upload.url, { method: "PUT", headers: prepared.upload.headers, body: input.file });
        if (!response.ok) throw new Error("Couldn’t upload the picture. Try again.");
        input.uploaded = true;
      }
      const value = await postCloud({ action: "add", ...identity.current, id: input.id, name: input.name, parentId: input.parentId, version: current.current.version, ...(imageType ? { imageType } : {}) });
      accept(value); return true;
    } catch (failure) {
      if (failure && typeof failure === "object" && "status" in failure && failure.status === 409) await load();
      if (mounted.current) setError(failureMessage(failure, "Couldn’t save. Check your connection and try again."));
      return false;
    } finally { locked.current = false; if (mounted.current) setBusy(false); }
  };
  return { ...data, loading, busy, error, add, retry: load };
}
