import { z } from 'zod';
export const nicknameSchema=z.string().trim().max(40,'Use 40 characters or fewer.').refine(value=>!value||!z.string().email().safeParse(value).success,'Use a nickname instead of your email.');
