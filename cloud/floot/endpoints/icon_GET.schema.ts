import { z } from "zod";
export const schema=z.object({});
export type OutputType=string;
export async function getIcon(){return (await fetch('/_api/icon')).text();}
