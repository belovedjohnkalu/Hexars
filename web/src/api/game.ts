import superjson from "superjson";
import type { InputType, OutputType } from "../../../shared/protocol/contracts";
import { accessToken } from "./auth";
export type * from "../../../shared/protocol/contracts";

export async function postGame(input: InputType, init?: RequestInit): Promise<OutputType> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${await accessToken()}`);
  const response = await fetch("/api/game", {
    ...init, method: "POST", headers, body: superjson.stringify(input),
  });
  const payload = await response.json();
  const result = (payload && "json" in payload ? superjson.deserialize(payload) : payload) as OutputType | { error: string };
  if (!response.ok || "error" in result) {
    throw Object.assign(new Error("error" in result ? result.error : "Game unavailable"), { status: response.status });
  }
  return result;
}
