import { z } from "zod";
const credentials = { workspaceId: z.string().uuid(), accessToken: z.string().regex(/^[a-f0-9]{64}$/) };
const parentId = z.string().max(80).nullable();
const name = z.string().trim().min(1, "Give this cloud a name.").max(80, "Use up to 80 characters.");
const version = z.number().int().nonnegative();
export const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("load"), ...credentials }),
  z.object({ action: z.literal("add"), ...credentials, id: z.string().uuid(), parentId, name, version, imageType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]).optional() }),
  z.object({ action: z.literal("upload"), ...credentials, id: z.string().uuid(), contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]), sizeBytes: z.number().int().positive().max(3 * 1024 * 1024) }),
  z.object({ action: z.literal("rename"), ...credentials, id: z.string().uuid(), name, version }),
  z.object({ action: z.literal("remove"), ...credentials, id: z.string().uuid(), operationId: z.string().uuid(), expectedCount: z.number().int().nonnegative(), version }),
  z.object({ action: z.literal("restore"), ...credentials, operationId: z.string().uuid(), version }),
]);
export type CloudNode = {
  id: string; parentId: string | null; name: string;
  imageKey?: string; imageUrl?: string; isImage?: boolean; destination?: "board"; note?: string;
  removedBy?: string; removedAt?: string;
};
export type InputType = z.infer<typeof schema>;
export type OutputType = {
  nodes: CloudNode[]; version: number;
  undo?: { operationId: string; name: string; parentId: string | null; count: number };
  upload?: { url: string; headers: Record<string, string> };
};
export async function postCloud(input: InputType, init?: RequestInit): Promise<OutputType> {
  const response = await fetch("/_api/cloud", {
    ...init, method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schema.parse(input)),
  });
  let value: OutputType & {error?: string};
  try { value = await response.json(); } catch { throw new Error("Couldn’t reach your space. Try again."); }
  if (!response.ok) throw Object.assign(new Error(value.error || "Couldn’t save. Try again."), { status: response.status });
  return value;
}
