import { publicSnapshotCache } from './publicSnapshotCache';
import type { PublicBootstrap } from '../endpoints/public_bootstrap_GET.schema';
describe('Public read-model change detection',()=>{
  const value={home:{version:1,nodes:[{id:'ion',name:'ION',imageUrl:'https://storage.example/picture?signature=one'}]},chess:{version:1,nodes:[{id:'chess',name:'Chess'}]},time:{labels:{play:'Play'},buyers:2,observedAt:'2026-10-27T00:00:00Z'}} as unknown as PublicBootstrap;
  it('does not wake visitors for regenerated signed URLs, clocks, row versions or a new buyer count',()=>{const next={...value,home:{...value.home,version:2,nodes:value.home.nodes.map(n=>({...n,imageUrl:'https://storage.example/picture?signature=two'}))},time:{...value.time,buyers:100,observedAt:'2026-10-27T00:00:15Z'}};expect(publicSnapshotCache.fingerprint(next)).toBe(publicSnapshotCache.fingerprint(value));});
  it('does invalidate the visible result after a real word, picture or label changes',()=>{expect(publicSnapshotCache.fingerprint({...value,chess:{...value.chess,nodes:[{id:'chess',parentId:null,name:'A different word'}]}})).not.toBe(publicSnapshotCache.fingerprint(value));expect(publicSnapshotCache.fingerprint({...value,time:{...value.time,labels:{play:'Begin'}}})).not.toBe(publicSnapshotCache.fingerprint(value));});
});
