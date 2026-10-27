import { publicSnapshotCache } from './publicSnapshotCache';
export async function refreshPublicBootstrap(payload:{key:string;origin:string;leaseId:string}) {await publicSnapshotCache.refresh(payload);}
