import { devPromptWorkflow,visibleDevClouds } from './devPromptWorkflow';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
describe('Dev-only prompt branches',()=>{
 const nodes:CloudNode[]=[{id:'ion',parentId:null,name:'ION'},{id:devPromptWorkflow.root,parentId:'ion',name:'Renamed queue'},{id:'child',parentId:devPromptWorkflow.root,name:'Prompt with secret text',imageKey:'private-picture'},{id:'deep',parentId:'child',name:'Deep context'},{id:'public',parentId:'ion',name:'Public'}];
 it('removes the whole branch from guest and regular-account responses before pictures are signed',()=>{const result=visibleDevClouds(nodes,false);expect(result.map(n=>n.id)).toEqual(['ion','public']);expect(JSON.stringify(result)).not.toContain('secret');expect(JSON.stringify(result)).not.toContain('private-picture');});
 it('shares the existing branch with devs and keeps stable identities and labels',()=>{expect(visibleDevClouds(nodes,true)).toBe(nodes);});
 it('remains private across order changes and does not match a public word simply named Complete',()=>{const shuffled=[nodes[3],nodes[2],nodes[0],nodes[1],nodes[4],{id:'other',parentId:'public',name:'Complete'}];expect(visibleDevClouds(shuffled,false).map(n=>n.id)).toEqual(['ion','public','other']);});
 it('hides the ION Prompts root, its sibling branches and their descendants, even after renaming',()=>{
  const tree:CloudNode[]=[...nodes,{id:devPromptWorkflow.homeRoot,parentId:'ion',name:'Renamed prompts'},{id:'archive',parentId:devPromptWorkflow.homeRoot,name:'Completed'},{id:'archived-prompt',parentId:'archive',name:'Private task'}];
  expect(visibleDevClouds(tree,false).map(n=>n.id)).toEqual(['ion','public']);
  expect(visibleDevClouds(tree,true)).toBe(tree);
 });
});
