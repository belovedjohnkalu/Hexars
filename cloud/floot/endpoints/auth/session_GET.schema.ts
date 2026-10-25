import { z } from "zod";
import superjson from "superjson";
import { User } from "../../helpers/User";

// no schema, just a simple GET request
export const schema = z.object({});

export type OutputType =
  | {
      user: User;
      expiresAt?:number;
    }
  | {
      error: string;
    };

export const getSession = async (
  body: z.infer<typeof schema> = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/auth/session`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const value=superjson.parse<OutputType>(await result.text());if(!result.ok)throw Object.assign(new Error('error'in value?value.error:'Session check failed'),{status:result.status});return value;
};
