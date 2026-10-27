import {communityIdentity} from './communityIdentity';
import {communityPaging} from './communityPaging';
describe('Community identity boundaries',()=>{
  it('separates a cloud, topic and reply even when a client reuses a UUID',()=>{
    const id='12345678-1234-4234-8234-123456789abc';
    expect(new Set([id,communityIdentity.topic(id),communityIdentity.reply(id)]).size).toBe(3);
  });
  it('does not remove a topic in response to a reply event with the same UUID',()=>{
    const topics=[{id:'same'}] as any;
    expect(communityPaging.patchTopics(topics,{kind:'reply',removed:'same'})).toBe(topics);
  });
});
