import { z } from "zod";
import type { CloudScope } from "../endpoints/cloud_POST.schema";

export const cloudNames = {
  schema(scope: CloudScope, allowEmpty = false, maxWords?:bigint) {
    const value = z.string().trim();
    const required = allowEmpty ? value : value.min(1, "Give this cloud a name.");
    return scope==='private'||scope==='public'?required.refine(name=>maxWords===undefined||BigInt(name.trim().match(/\S+/gu)?.length??0)<=maxWords,'Use up to '+maxWords+' '+(maxWords===1n?'word':'words')+' here.'):required;
  },
  preview(name: string, length = 160) {
    const characters = Array.from(name);
    return characters.length > length ? characters.slice(0, length - 1).join("") + "…" : name;
  },
};
