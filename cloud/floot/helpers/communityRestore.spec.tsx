import { communityRestore } from './communityRestore';
import { communityUndo } from './communityUndo';
import { jwtVerify } from 'jose';
describe('Community deletion undo',()=>{
  beforeEach(()=>{process.env.JWT_SECRET='community-undo-fixture-only';});
  it('binds undo to the actor, exact post and deleted version, using a separate signing domain',async()=>{
    const target={topicId:'00000000-0000-4000-8000-000000000069',version:3},receipt=await communityRestore.issue(69,target);
    await expectAsync(communityRestore.verify(receipt.undoToken,69,target)).toBeResolved();
    await expectAsync(communityRestore.verify(receipt.undoToken,70,target)).toBeRejected();
    await expectAsync(communityRestore.verify(receipt.undoToken,69,{...target,version:4})).toBeRejected();
    await expectAsync(communityRestore.verify(receipt.undoToken,69,{...target,replyId:'00000000-0000-4000-8000-000000000070'})).toBeRejected();
    await expectAsync(jwtVerify(receipt.undoToken,new TextEncoder().encode(process.env.JWT_SECRET))).toBeRejected();
    expect(receipt.expiresAt-Date.now()).toBeLessThanOrEqual(10000);expect(receipt.expiresAt>Date.now()).toBeTrue();
  });
  it('keeps only this account’s receipt and removes it at its original deadline',()=>{
    jasmine.clock().install();jasmine.clock().mockDate(new Date('2026-10-27T00:00:00Z'));
    try{const value={topicId:'t',version:1,undoToken:'fixture',expiresAt:Date.now()+10000};communityUndo.put(69001,value);expect(communityUndo.get(69001)).toBe(value);expect(communityUndo.get(69002)).toBeUndefined();jasmine.clock().tick(10001);expect(communityUndo.get(69001)).toBeUndefined();}finally{communityUndo.clear(69001);jasmine.clock().uninstall();}
  });
});
