import type { CloudNode } from '../endpoints/cloud_POST.schema';
// Stable node identities, not editable labels or IL display strings, own privacy.
export const devPromptWorkflow = {"homeRoot":"6208875d-c43c-4548-824f-9c0229fd16bc", "root": "8d489e18-161c-4c8b-a7a4-63cdfecc9394", "inbox": "a6af91c2-fd49-49e9-a385-d911890368c9", "completed": "55b50ec5-26d5-428b-81f2-cae577e42828", "ready": "ef9da214-6a55-4861-a609-dee2726bb486"} as const;
export function visibleDevClouds(nodes:CloudNode[],isDev:boolean):CloudNode[]{
 if(isDev)return nodes;
 const hidden=new Set<string>([devPromptWorkflow.homeRoot,devPromptWorkflow.root,'time-estimates','time-treasury','chess-settings']);let grew=true;
 while(grew){grew=false;for(const n of nodes)if(n.parentId&&hidden.has(n.parentId)&&!hidden.has(n.id)){hidden.add(n.id);grew=true;}}
 return nodes.filter(n=>!hidden.has(n.id));
}
