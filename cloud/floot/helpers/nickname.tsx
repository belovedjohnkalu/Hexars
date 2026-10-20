import { z } from 'zod';
export const nicknameSchema=z.string().trim().max(40,'Use 40 characters or fewer.').refine(value=>!value||!z.string().email().safeParse(value).success,'Use a player name instead of your email.');

export function isNicknameTaken(error:unknown){if(!error||typeof error!=='object')return false;const value=error as {code?:string;constraint?:string;constraint_name?:string};return value.code==='23505'&&(value.constraint_name||value.constraint)==='users_nickname_unique_idx';}
