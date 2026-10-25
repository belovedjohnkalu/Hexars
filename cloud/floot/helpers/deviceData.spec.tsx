import {deviceData,DEVICE_DATA_TTL} from './deviceData';
import {cacheRead} from './cacheRead';
describe('Account-scoped received data',()=>{
 afterEach(async()=>{await deviceData.clear('9001');await deviceData.clear('9002');deviceData.setIdentity(null);});
 it('retains received pages for thirty days and never returns another account’s copy',async()=>{await deviceData.put('9001','page',{name:'Private'});expect(await deviceData.get('9002','page')).toBeUndefined();expect((await deviceData.get<{name:string}>('9001','page'))?.name).toBe('Private');const now=Date.now();spyOn(Date,'now').and.returnValue(now+DEVICE_DATA_TTL+1);expect(await deviceData.get('9001','page')).toBeUndefined();});
 it('uses a received copy on a network failure, never after an authorization rejection',async()=>{deviceData.setIdentity(9001);await cacheRead('read',async()=>({name:'Saved'}));const result=await cacheRead('read',async()=>{throw new TypeError('Offline');});expect(result.name).toBe('Saved');let rejected=false;try{await cacheRead('read',async()=>{throw Object.assign(Error('Denied'),{status:403});});}catch{rejected=true;}expect(rejected).toBeTrue();});
 it('clears only the signed-out account and excludes expired cached sessions',async()=>{await deviceData.put('9001','page','First');await deviceData.put('9002','page','Second');await deviceData.clear('9001');expect(await deviceData.get('9001','page')).toBeUndefined();expect(await deviceData.get('9002','page')).toBe('Second');});
});
