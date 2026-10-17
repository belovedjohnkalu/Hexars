import { publish } from "@floot/realtime";
import { cloudWorkspace } from "../helpers/cloudWorkspace";
import { upload, getUrl, getInfo } from "@floot/storage";
import { db } from "../helpers/db";
import { cloudTree } from "../helpers/cloudTree";
import { cloudChanges } from "../helpers/cloudChanges";
import { schema, type CloudNode, type OutputType } from "./cloud_POST.schema";
import type { Json } from "../helpers/schema";
const headers = { "Content-Type": "application/json", "Cache-Control": "private, no-store" };
const extensions: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
class CloudError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
export async function handle(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 4096) throw new CloudError("Request too large.", 413);
    const input = schema.parse(JSON.parse(body));
    const row = await cloudWorkspace(request,input);
    let nodes = (Array.isArray(row.nodes) ? row.nodes : []) as unknown as CloudNode[];
    let version = row.version;
    const all = cloudTree.resolve(nodes).filter(n=>!n.removedBy);
    if (input.action === "upload") {
      const filename = "ion/" + row.id + "/" + input.id + "." + extensions[input.contentType];
      const result = await upload({ visibility: "private", filename, contentType: input.contentType, sizeBytes: input.sizeBytes });
      if (!result.ok) throw new CloudError("Couldn’t prepare the picture. Try again.", 400);
      return new Response(JSON.stringify({ nodes: [], version, upload: { url: result.presignedUrl, headers: result.headers } } satisfies OutputType), { headers });
    }
    if (input.action === "add") {
      // A retry of the same creation is safe even after another tab changes the version.
      const existing = nodes.find(n => n.id === input.id);
      if(existing?.removedBy)throw new CloudError("This item was removed. Edit its name to add it again.",409);
      if (!existing) {
        if (input.version !== row.version) throw new CloudError("Your space changed in another tab. Try again.", 409);
          if (input.parentId !== null && !all.some(n => n.id === input.parentId && !n.destination))
          throw new CloudError("Choose an existing cloud.", 400);
        const node: CloudNode = { id: input.id, parentId: input.parentId, name: input.name };
        if (input.imageType) {
          const filename = "ion/" + row.id + "/" + input.id + "." + extensions[input.imageType];
          const info = await getInfo({ visibility: "private", filename });
          if (!info.ok || !info.exists || info.sizeBytes > 3 * 1024 * 1024)
            throw new CloudError("Upload the picture again.", 400);
          node.imageKey = filename;
        }
        nodes = [...nodes, node];
        const updated = await db.updateTable("ionWorkspaces").set({ nodes: nodes as unknown as Json, version: row.version + 1, updatedAt: new Date() })
          .where("id", "=", row.id).where("version", "=", row.version).returning("version").executeTakeFirst();
        if (!updated) throw new CloudError("Your space changed in another tab. Try again.", 409);
        version = updated.version;
      }
    }
    if(input.action==="rename"||input.action==="remove"||input.action==="restore"||input.action==="move"||input.action==="copy"){
      const next=cloudChanges.apply(nodes,input,row.version,cloudTree.seed);
      if(next!==nodes){
        const updated=await db.updateTable("ionWorkspaces").set({nodes:next as unknown as Json,version:row.version+1,updatedAt:new Date()}).where("id","=",row.id).where("version","=",row.version).returning("version").executeTakeFirst();
        if(!updated)throw new CloudError("Your space changed. Try again.",409);
        nodes=next;version=updated.version;
      }
    }
    if(version!==row.version&&row.ownerId){
      try{await publish("cloud-user:"+row.ownerId,{version,workspaceId:row.id});}catch{console.error("Cloud refresh signal delayed");}
    }
    // Signed picture URLs are refreshed on every read, and never stored as authority.
    const visible = await Promise.all(cloudTree.resolve(nodes).filter(n=>!n.removedBy).map(async node => {
      if (!node.imageKey) return node;
      const result = await getUrl({ visibility: "private", filename: node.imageKey, expiresInSeconds: 3600 });
      return { ...node, isImage: true, imageKey: undefined, imageUrl: result.ok ? result.url : undefined };
    }));
    return new Response(JSON.stringify({ nodes: visible, version, workspaceId:row.id, account:!!row.ownerId, undo: cloudChanges.undo(nodes) } satisfies OutputType), { headers });
  } catch (error) {
    const status = error instanceof Error && "status" in error && typeof error.status === "number" ? error.status : error instanceof SyntaxError || (error && typeof error === "object" && "issues" in error) ? 400 : 503;
    if (status === 503) console.error("ION space request failed", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ error: status === 503 ? "Couldn’t open your space. Try again." : error instanceof Error && "status" in error ? error.message : "Check your word or picture and try again." }), { status, headers });
  }
}
