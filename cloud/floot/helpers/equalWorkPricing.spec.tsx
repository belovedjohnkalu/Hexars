import { equalWorkShare } from './workTotals';
import { timePrice } from './timeMath';
import { signedInUserCount } from './signedInUsers';
import { db } from './db';
describe('Equal work pricing and real signed-in population',()=>{
 it('divides the total once across paid features, then across signed-in accounts, rounding only to microseconds',()=>{expect(equalWorkShare('36000000000',10)).toBe('3600000000');expect(timePrice(equalWorkShare('36000000000',10),5)).toBe('720000000');for(const total of ['1','7','100','36000000001'])for(const features of [1,3,11])for(const buyers of [1,5,8])expect(timePrice(equalWorkShare(total,features),buyers)).toBe(((BigInt(total)+BigInt(features*buyers)-1n)/BigInt(features*buyers)).toString());});
 it('does not offer an invalid zero-buyer quote or divide by zero features',()=>{expect(()=>equalWorkShare('1',0)).toThrow();expect(()=>timePrice('1',0)).toThrow();});
 it('counts distinct real accounts using server session expiry, not browser credential expiry',async()=>{const clauses:string[]=[];const q={innerJoin:()=>q,select:()=>q,where:(k:string)=>{clauses.push(k);return q;},executeTakeFirstOrThrow:async()=>({buyers:5})};spyOn(db,'selectFrom').and.returnValue(q as never);expect(await signedInUserCount()).toBe(5);expect(clauses).toContain('sessions.expiresAt');expect(clauses).toContain('users.email');expect(clauses).not.toContain('credentialExpiresAt');});
});
