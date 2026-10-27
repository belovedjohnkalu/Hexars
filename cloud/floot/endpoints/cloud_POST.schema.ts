import {photoTypes,mediaMaxBytes,type PhotoType} from '../helpers/cloudPhotos';
import type { EngineId } from '../helpers/chessEngines';
import { cloudNames } from "../helpers/cloudNames";
import type { VariantId } from "./game_POST.schema";
import { z } from "zod";
import { redirectSchema,type CloudRedirect } from '../helpers/cloudLinks';
import { isCloudColor,type CloudColor } from "../helpers/cloudColors";
export type CloudScope="home"|"public"|"private"|"chess"|"accounts"|"schedule";
const credentials = { functionalId:z.string().max(100).optional(), expectedUserId:z.number().int().positive().optional(), scope: z.enum(["home","public","private","chess","accounts","schedule"]).default("private"), account: z.boolean().optional(), workspaceId: z.string().uuid(), accessToken: z.string().regex(/^[a-f0-9]{64}$/) };
const parentId = z.string().max(80).nullable();
const name = z.string().trim().min(1, "Give this cloud a name.");
const version = z.number().int().nonnegative();
export const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("load"), connect: z.boolean().optional(), timeZone:z.string().max(100).optional(), ...credentials }),
  z.object({ action: z.literal("add"), ...credentials, id: z.string().uuid(), parentId, name, version, color:z.custom<CloudColor>(isCloudColor,"Choose a color from the wheel.").optional(), imageType: z.enum(photoTypes).optional(), images:z.array(z.object({id:z.string().uuid(),contentType:z.enum(photoTypes)})).optional() }),
  z.object({ action: z.literal("upload"), ...credentials, id: z.string().uuid(), fileId:z.string().uuid().optional(), contentType: z.enum(photoTypes), sizeBytes: z.number().int().positive().max(200*1024*1024) }),
  z.object({action:z.literal('update'),...credentials,id:z.string().min(1).max(100),name,color:z.custom<CloudColor>(isCloudColor).optional(),note:z.string().nullable().optional(),photoMode:z.enum(['keep','replace','remove']).default('keep'),assetId:z.string().uuid().optional(),images:z.array(z.object({id:z.string().uuid(),contentType:z.enum(photoTypes)})).optional(),version}),
  z.object({ action: z.literal("rename"), ...credentials, id: z.string().min(1).max(80), name, color:z.custom<CloudColor>(isCloudColor,"Choose a color from the wheel.").optional(), version }),
  z.object({action:z.literal('link'),...credentials,id:z.string().min(1).max(80),target:redirectSchema.nullable(),words:z.array(z.number().int().nonnegative()).optional(),version}),
  z.object({ action: z.literal("remove"), ...credentials, id: z.string().min(1).max(80), operationId: z.string().uuid(), expectedCount: z.number().int().nonnegative(), keepChildren: z.boolean().optional(), version }),
  z.object({ action: z.literal("move"), ...credentials, id: z.string().min(1).max(80), parentId, version }),
  z.object({ action: z.literal("copy"), ...credentials, id: z.string().min(1).max(80), parentId, operationId: z.string().uuid(), version }),
  z.object({ action: z.literal("transfer"), ...credentials, id:z.string().uuid(), targetScope:z.enum(["public","private"]), targetParent:z.string().min(1).max(80), targetVersion:version, operationId:z.string().uuid(), mode:z.enum(["move","copy"]), version }),
  z.object({ action: z.literal("restore"), ...credentials, operationId: z.string().uuid(), version }),
]).superRefine((input, context) => {
  if(input.action==='upload'&&input.sizeBytes>mediaMaxBytes(input.contentType))context.addIssue({code:'custom',path:['sizeBytes'],message:'File is too large.'});
  if (!("name" in input)) return;
  const result = cloudNames.schema(input.scope).safeParse(input.name);
  if (!result.success) for (const issue of result.error.issues) context.addIssue({ ...issue, path: ["name", ...issue.path] });
});
export type CloudNode = {
  publishing?:'pending'|'failed';publishError?:string;mediaTypes?:PhotoType[];
  author?:{name:string}; contentEdits?:Array<'name'|'color'|'note'|'images'>;
  homeFeature?:boolean; canHide?:boolean; hiddenFeature?:boolean;
  lockedItem?:string;redirect?:CloudRedirect;wordRedirect?:{words:number[];target:CloudRedirect};shareId?:string;
  href?:string; savedGameId?:string; engineId?:EngineId;
  calendarDate?:{year:number;month?:number;day?:number}; calendarStatus?:'past'|'current'|'future';
  id: string; parentId: string | null; name: string; color?:CloudColor; identifier?:string;
  imageKey?: string; imageUrl?: string; imageKeys?:string[]; imageUrls?:string[]; isImage?: boolean; destination?: "board" | VariantId | "tactical" | "level" | "control" | "account" | "accounts" | "space" | "saved-game"; space?:CloudScope; control?:"rename"|"move"|"copy"|"remove"|"copy-il"|"view-photos"|"link"|"copy-text"; accountAction?:string; system?:boolean; note?: string; illustration?:string; variant?:VariantId; level?:number; createdBy?:number; canEdit?:boolean; canCopy?:boolean; sizeCount?:number; sizeCharacters?:number; sizeWords?:number;
  copyOperation?: string; removedBy?: string; removedAt?: string; promotedBy?:string; promotedFrom?:string;
};
export type InputType = z.input<typeof schema>;
export type OutputType = {
  nodes: CloudNode[]; version: number; timeZone?:string; signedInUsers?:number; signedInUsersExpireAt?:string; workspaceId?: string; account?: boolean; scope?:CloudScope; canAdd?:boolean; canManage?:boolean; dev?:boolean; owner?:boolean; userId?:number;
  undo?: { operationId: string; name: string; parentId: string | null; count: number; expiresAt?:number };
  upload?: { url: string; headers: Record<string, string> };
};
export async function postCloud(input: InputType, init?: RequestInit): Promise<OutputType> {
  const response = await fetch("/_api/cloud", {
    ...init, method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schema.parse(input)),
  });
  let value: OutputType & {error?: string};
  try { value = await response.json(); } catch { throw Object.assign(new Error("Couldn’t reach your cloud. Try again."),{status:503}); }
  if (!response.ok) {
    if(response.status===401&&typeof window!=="undefined")window.dispatchEvent(new window.Event("ion.session-expired"));
    throw Object.assign(new Error(value.error || "Couldn’t save. Try again."), { status: response.status });
  }
  return value;
}
