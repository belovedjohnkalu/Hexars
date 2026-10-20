import React from 'react';
import { render,act,cleanup } from '@testing-library/react';
import { useTimeEarning } from './useTimeEarning';
const credit=()=>{};
function View({user=10}:{user?:number}){const status=useTimeEarning(user,credit);return <span>{status}</span>;}
describe('Time earning lifecycle',()=>{
 let elapsed=0,focused=true,hidden=false,operations:string[],other=false;
 const tick=async(ms:number)=>{elapsed+=ms;await act(async()=>{jasmine.clock().tick(ms);await Promise.resolve();await Promise.resolve();});};
 beforeEach(()=>{jasmine.clock().install();elapsed=0;focused=true;hidden=false;operations=[];other=false;spyOn(performance,'now').and.callFake(()=>elapsed);spyOn(document,'hasFocus').and.callFake(()=>focused);spyOnProperty(document,'visibilityState','get').and.callFake(()=>hidden?'hidden':'visible');spyOn(globalThis,'fetch').and.callFake(async(_url,init)=>{const body=JSON.parse(String(init?.body));operations.push(body.operation);return new Response(JSON.stringify({earning:{active:body.operation!=='stop'&&!other,elsewhere:other,creditedUs:'0'}}),{status:200});});});
 afterEach(()=>{cleanup();jasmine.clock().uninstall();});
 it('claims one session, heartbeats, and stops while hidden',async()=>{const v=render(<View/>);await tick(0);expect(operations).toEqual(['claim']);await tick(15000);expect(operations).toEqual(['claim','heartbeat']);hidden=true;await act(async()=>{document.dispatchEvent(new window.Event('visibilitychange'));await Promise.resolve();});await tick(0);expect(operations.at(-1)).toBe('stop');const count=operations.length;await tick(60000);expect(operations.length).toBe(count);v.unmount();});
 it('does not fight another device by automatically reclaiming every heartbeat',async()=>{render(<View/>);await tick(0);other=true;await tick(15000);const count=operations.length;await tick(45000);expect(operations.length).toBe(count);});
 it('pauses after three minutes and cleans its timer on unmount',async()=>{const v=render(<View/>);await tick(0);await tick(181000);expect(operations.at(-1)).toBe('stop');v.unmount();await tick(0);const count=operations.length;await tick(60000);expect(operations.length).toBe(count);});
});
