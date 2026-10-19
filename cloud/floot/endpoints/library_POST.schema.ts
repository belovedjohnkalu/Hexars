import { z } from 'zod';
import type { GameView,MoveRecord } from './game_POST.schema';
const locator={gameId:z.string().uuid().optional(),shareId:z.string().uuid().optional(),token:z.string().regex(/^[a-f0-9]{64}$/).optional()};
export const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('get'),...locator,nodeId:z.string().max(120).optional(),ply:z.number().int().nonnegative().optional()}).strict(),
 z.object({action:z.literal('remove'),gameId:z.string().uuid().optional(),shareId:z.string().uuid().optional()}).strict(),
 z.object({action:z.literal('restore'),gameId:z.string().uuid().optional(),shareId:z.string().uuid().optional(),removedAt:z.string().datetime()}).strict(),
 z.object({action:z.literal('share'),gameId:z.string().uuid(),recipientEmail:z.string().trim().toLowerCase().email().optional()}).strict()
]);
export type LibraryGame={gameId:string;game:GameView;moves:MoveRecord[];mode:string;engineName:string;humanPlayer:number|null;players:Array<{seat:number;name:string}>;canShare:boolean;canRemove:boolean;shareRole?:'sender'|'recipient';dev:boolean;identifier?:string};
export type LibraryUndo={gameId?:string;shareId?:string;removedAt:string;expiresAt:number};
export type LibraryInput=z.infer<typeof schema>;
export async function postLibrary<T=LibraryGame>(input:LibraryInput,signal?:AbortSignal):Promise<T>{const r=await fetch('/_api/library',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(schema.parse(input)),signal});const out=await r.json();if(!r.ok)throw Object.assign(new Error(out.error||'Couldn’t open this game.'),{status:r.status});return out;}
