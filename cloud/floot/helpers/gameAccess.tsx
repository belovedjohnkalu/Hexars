import { getServerUserSession } from './getServerUserSession';
import { NotAuthenticatedError } from './getSetServerSession';
import { z } from 'zod';
export async function optionalGameUser(request:Request){try{return (await getServerUserSession(request)).user;}catch(e){if(e instanceof NotAuthenticatedError)return null;throw e;}}
export async function onlineUser(request:Request){const user=await optionalGameUser(request);if(!user||!z.string().email().safeParse(user.email).success)throw Object.assign(new Error('Sign in with email to play online.'),{status:401});return user;}
