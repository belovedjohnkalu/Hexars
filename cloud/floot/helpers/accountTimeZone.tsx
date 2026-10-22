import { db } from './db';
import { scheduleCalendar } from './scheduleCalendar';
export async function accountTimeZone(userId:number|null,detected?:string){
 if(!userId)return scheduleCalendar.zone(detected);
 let saved=await db.selectFrom('users').select('timeZone').where('id','=',userId).executeTakeFirstOrThrow();
 if(!saved.timeZone&&detected){const value=scheduleCalendar.zone(detected);await db.updateTable('users').set({timeZone:value}).where('id','=',userId).where('timeZone','is',null).execute();saved=await db.selectFrom('users').select('timeZone').where('id','=',userId).executeTakeFirstOrThrow();}
 return scheduleCalendar.zone(saved.timeZone||detected);
}
