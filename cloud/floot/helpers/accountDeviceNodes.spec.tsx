import { accountDeviceNodes } from './accountDeviceNodes';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
describe('Device-local account lists',()=>{
 const root:CloudNode={id:'accounts',parentId:null,name:'Accounts'};
 const a:CloudNode={id:'remembered-11',parentId:'accounts',name:'Player A'};
 const b:CloudNode={id:'remembered-22',parentId:'accounts',name:'Player B'};
 const stored:CloudNode[]=[b,{id:'remembered-22-open',parentId:b.id,name:'Open',accountAction:'switch:22'},{id:'private-label',parentId:b.id,name:'Do not leak this label'}, {id:'account-remember',parentId:'accounts',name:'Remember',accountAction:'remember'}, {id:'custom',parentId:'accounts',name:'My own note'}];
 it('does not import another device’s remembered accounts or their descendants from synced account content',()=>{
  const nodes=accountDeviceNodes([root,a],stored);expect(nodes.map(n=>n.id)).toEqual(['accounts','remembered-11','custom']);expect(JSON.stringify(nodes)).not.toContain('Player B');
 });
 it('keeps only this device’s explicitly saved accounts and preserves permitted label edits while using trusted identity and actions',()=>{
  const nodes=accountDeviceNodes([root,b,{id:'remembered-22-open',parentId:b.id,name:'Open',accountAction:'switch:22'}],[...stored,{...b,name:'My label'}]);
  expect(nodes.find(n=>n.id===b.id)?.name).toBe('My label');expect(nodes.find(n=>n.id==='remembered-22-open')?.accountAction).toBe('switch:22');
 });
 it('does not restore stale sign-in/sign-out commands after session changes',()=>{
  const nodes=accountDeviceNodes([root,{id:'account-signin',parentId:'accounts',name:'Sign in',accountAction:'signin'}],[{id:'account-signout',parentId:'accounts',name:'Sign out',accountAction:'signout'},...stored]);expect(nodes.map(n=>n.id)).toEqual(['accounts','account-signin','custom']);
 });
 it('never resurrects a dev-only user-count word for a regular account',()=>{
  const counter:CloudNode={id:'account-signed-in-users',parentId:'accounts',name:'Signed in'};
  expect(accountDeviceNodes([root],[counter]).map(n=>n.id)).toEqual(['accounts']);
  expect(accountDeviceNodes([root,counter],[]).some(n=>n.id===counter.id)).toBeTrue();
 });
});
