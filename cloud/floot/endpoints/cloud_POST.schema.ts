import { z } from "zod";
import { cloudColors,type CloudColor } from "../helpers/cloudColors";
export type CloudScope="home"|"public"|"private"|"chess";
const credentials = { scope: z.enum(["home","public","private","chess"]).default("private"), account: z.boolean().optional(), workspaceId: z.string().uuid(), accessToken: z.string().regex(/^[a-f0-9]{64}$/) };
const parentId = z.string().max(80).nullable();
const name = z.string().trim().min(1, "Give this cloud a name.").max(80, "Use up to 80 characters.");
const version = z.number().int().nonnegative();
export const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("load"), connect: z.boolean().optional(), ...credentials }),
  z.object({ action: z.literal("add"), ...credentials, id: z.string().uuid(), parentId, name, version, color:z.enum(cloudColors).optional(), imageType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]).optional() }),
  z.object({ action: z.literal("upload"), ...credentials, id: z.string().uuid(), contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]), sizeBytes: z.number().int().positive().max(3 * 1024 * 1024) }),
  z.object({ action: z.literal("rename"), ...credentials, id: z.string().min(1).max(80), name, color:z.enum(cloudColors).optional(), version }),
  z.object({ action: z.literal("remove"), ...credentials, id: z.string().min(1).max(80), operationId: z.string().uuid(), expectedCount: z.number().int().nonnegative(), version }),
  z.object({ action: z.literal("move"), ...credentials, id: z.string().min(1).max(80), parentId, version }),
  z.object({ action: z.literal("copy"), ...credentials, id: z.string().min(1).max(80), parentId, operationId: z.string().uuid(), version }),
  z.object({ action: z.literal("transfer"), ...credentials, id:z.string().uuid(), targetScope:z.enum(["public","private"]), targetParent:z.string().min(1).max(80), targetVersion:version, operationId:z.string().uuid(), mode:z.enum(["move","copy"]), version }),
  z.object({ action: z.literal("restore"), ...credentials, operationId: z.string().uuid(), version }),
]);
export type CloudNode = {
  id: string; parentId: string | null; name: string; color?:CloudColor;
  imageKey?: string; imageUrl?: string; isImage?: boolean; destination?: "board" | "glinski" | "mccooey" | "tactical" | "level"; note?: string; illustration?:string; variant?:"glinski"|"mccooey"; level?:number; createdBy?:number; canEdit?:boolean; canCopy?:boolean; sizeCount?:number;
  copyOperation?: string; removedBy?: string; removedAt?: string;
};
export type InputType = z.input<typeof schema>;
export type OutputType = {
  nodes: CloudNode[]; version: number; workspaceId?: string; account?: boolean; scope?:CloudScope; canAdd?:boolean; canManage?:boolean; owner?:boolean; userId?:number;
  undo?: { operationId: string; name: string; parentId: string | null; count: number; expiresAt?:number };
  upload?: { url: string; headers: Record<string, string> };
};
export async function postCloud(input: InputType, init?: RequestInit): Promise<OutputType> {
  const response = await fetch("/_api/cloud", {
    ...init, method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schema.parse(input)),
  });
  let value: OutputType & {error?: string};
  try { value = await response.json(); } catch { throw new Error("Couldn’t reach your space. Try again."); }
  if (!response.ok) {
    if(response.status===401&&typeof window!=="undefined")window.dispatchEvent(new Event("ion.session-expired"));
    throw Object.assign(new Error(value.error || "Couldn’t save. Try again."), { status: response.status });
  }
  return value;
}
