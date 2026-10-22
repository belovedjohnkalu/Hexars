import React from 'react';
import { render,cleanup,act } from '@testing-library/react';
import { useScheduleCalendar } from './useScheduleCalendar';
import { scheduleCalendar } from './scheduleCalendar';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
describe('Live account-local calendar',()=>{
 beforeEach(()=>jasmine.clock().install());afterEach(()=>{cleanup();jasmine.clock().uninstall();});
 const nodes:CloudNode[]=[{id:scheduleCalendar.root,parentId:'ion',name:'Schedule'},{id:'a',parentId:scheduleCalendar.root,name:'22',calendarDate:{year:2026,month:10,day:22}},{id:'b',parentId:scheduleCalendar.root,name:'23',calendarDate:{year:2026,month:10,day:23}},{id:'entry',parentId:'a',name:'Saved schedule'}, {id:'next',parentId:scheduleCalendar.root,name:'2031',calendarDate:{year:2031}}];
 function View({zone,refresh}:{zone:string;refresh:()=>Promise<unknown>}){const result=useScheduleCalendar(nodes,zone,refresh);return <>{result.map(n=><output key={n.id} data-testid={n.id}>{n.calendarStatus}</output>)}</>;}
 it('changes date colors at local midnight without reloading the page',()=>{jasmine.clock().mockDate(new Date('2026-10-22T23:59:59.900Z'));const refresh=jasmine.createSpy('refresh').and.resolveTo(undefined),view=render(<View zone="UTC" refresh={refresh}/>);expect(view.getByTestId('a').textContent).toBe('current');expect(view.getByTestId('b').textContent).toBe('future');act(()=>jasmine.clock().tick(150));expect(view.getByTestId('a').textContent).toBe('past');expect(view.getByTestId('b').textContent).toBe('current');expect(refresh).not.toHaveBeenCalled();});
 it('uses the account zone rather than the device zone',()=>{jasmine.clock().mockDate(new Date('2026-10-22T16:00:00Z'));const view=render(<View zone="Asia/Tokyo" refresh={async()=>{}}/>);expect(view.getByTestId('a').textContent).toBe('past');expect(view.getByTestId('b').textContent).toBe('current');});
 it('reveals and requests the new fourth-ahead year on New Year',()=>{jasmine.clock().mockDate(new Date('2026-12-31T23:59:59.900Z'));const refresh=jasmine.createSpy('refresh').and.resolveTo(undefined),view=render(<View zone="UTC" refresh={refresh}/>);expect(view.queryByTestId('next')).toBeNull();act(()=>jasmine.clock().tick(150));expect(view.getByTestId('next').textContent).toBe('future');expect(refresh.calls.count()).toBe(1);});
 it('reconciles a suspended page immediately on focus',()=>{jasmine.clock().mockDate(new Date('2026-10-22T23:00:00Z'));const view=render(<View zone="UTC" refresh={async()=>{}}/>);expect(view.getByTestId('a').textContent).toBe('current');jasmine.clock().mockDate(new Date('2026-10-23T01:00:00Z'));act(()=>window.dispatchEvent(new window.Event('focus')));expect(view.getByTestId('a').textContent).toBe('past');expect(view.getByTestId('b').textContent).toBe('current');});

});
