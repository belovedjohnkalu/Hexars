import { createHmac } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
type Target={topicId:string;replyId?:string;version:number};
function key(){if(!process.env.JWT_SECRET)throw new Error('Undo unavailable');return createHmac('sha256',process.env.JWT_SECRET).update('ion-community-undo-v1').digest();}
async function issue(userId:number,target:Target){
  const exp=Math.floor(Date.now()/1000)+10;
  const undoToken=await new SignJWT({...target}).setProtectedHeader({alg:'HS256'}).setAudience('community-undo').setSubject(String(userId)).setExpirationTime(exp).sign(key());
  return{...target,undoToken,expiresAt:exp*1000};
}
async function verify(token:string,userId:number,target:Target){
  try{const {payload}=await jwtVerify(token,key(),{audience:'community-undo',algorithms:['HS256']});if(payload.sub!==String(userId)||payload.topicId!==target.topicId||payload.replyId!==target.replyId||payload.version!==target.version)throw Error();}
  catch{throw Object.assign(new Error('Undo has expired.'),{status:410});}
}
export const communityRestore={issue,verify};
