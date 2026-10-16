import { z } from "zod";

const credentials = { workspaceId: z.string().uuid(), accessToken: z.string().regex(/^[a-f0-9]{64}$/) };
const parentId = z.string().max(80).nullable();
const name = z.string().trim().min(1, "Add a word or a picture name.").max(80, "Use up to 80 characters.");
export const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("load"), ...credentials }),
  z.object({ action: z.literal("add"), ...credentials, id: z.string().uuid(), parentId, name, version: z.number().int().nonnegative(), imageType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]).optional() }),
  z.object({ action: z.literal("upload"), ...credentials, id: z.string().uuid(), contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]), sizeBytes: z.number().int().positive().max(3 * 1024 * 1024) }),
]);
export type CloudNode = {
  id: string; parentId: string | null; name: string;
  imageKey?: string; imageUrl?: string; destination?: "board"; note?: string;
};
export type InputType = z.infer<typeof schema>;
export type OutputType = {
  nodes: CloudNode[]; version: number;
  upload?: { url: string; headers: Record<string, string> };
};
export async function postCloud(input: InputType, init?: RequestInit): Promise<OutputType> {
  const response = await fetch("/_api/cloud", {
    ...init, method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(schema.parse(input)),
  });
  const value = await response.json();
  if (!response.ok) throw Object.assign(new Error(value.error || "Couldn’t save. Try again."), { status: response.status });
  return value;
}
