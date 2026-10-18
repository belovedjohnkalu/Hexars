import { z } from "zod";
import type { CloudScope } from "../endpoints/cloud_POST.schema";

export const cloudNames = {
  schema(scope: CloudScope, allowEmpty = false) {
    const value = z.string().trim();
    const required = allowEmpty ? value : value.min(1, "Give this cloud a name.");
    return scope === "private" ? required : required.max(80, "Use up to 80 characters.");
  },
  preview(name: string, length = 160) {
    const characters = Array.from(name);
    return characters.length > length ? characters.slice(0, length - 1).join("") + "…" : name;
  },
};
