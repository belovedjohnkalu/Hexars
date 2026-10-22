import { db } from './db';
import { accountTimeZone } from './accountTimeZone';
describe('Account time zone authority',()=>{
 it('uses the saved account preference even when another device detects a different zone',async()=>{
 const select={select:()=>select,where:()=>select,executeTakeFirstOrThrow:async()=>({timeZone:'Asia/Tokyo'})};spyOn(db,'selectFrom').and.returnValue(select as never);const update=spyOn(db,'updateTable');expect(await accountTimeZone(7,'America/Los_Angeles')).toBe('Asia/Tokyo');expect(update).not.toHaveBeenCalled();
 });
 it('initializes only the signed-in account and does not replace an existing preference',async()=>{
 let count=0;const select={select:()=>select,where:()=>select,executeTakeFirstOrThrow:async()=>({timeZone:++count===1?null:'Europe/London'})},conditions:unknown[][]=[];
 const update={set:()=>update,where:(...args:unknown[])=>{conditions.push(args);return update;},execute:async()=>[]};spyOn(db,'selectFrom').and.returnValue(select as never);spyOn(db,'updateTable').and.returnValue(update as never);
 expect(await accountTimeZone(7,'Europe/London')).toBe('Europe/London');expect(conditions).toEqual([['id','=',7],['timeZone','is',null]]);
 });
 it('does not write guest preferences',async()=>{const update=spyOn(db,'updateTable');expect(await accountTimeZone(null,'Pacific/Kiritimati')).toBe('Pacific/Kiritimati');expect(update).not.toHaveBeenCalled();});
});
