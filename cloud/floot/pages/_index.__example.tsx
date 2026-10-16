import { defineScreens, pending, httpError } from "@floot/examples";
import { cloudTree } from "../helpers/cloudTree";
import type { OutputType, CloudNode } from "../endpoints/cloud_POST.schema";
let nodes: CloudNode[] = [...cloudTree.seed];
let version = 0;
export default defineScreens({
  screens: [
    { title: "Explore", description: "Add a thought and open it. Preview changes stay in this example.", route: "/", backend: {
      cloud_POST: async (request: Request): Promise<OutputType> => {
        const input = await request.json();
        if(input.action === "add" && !nodes.some(n=>n.id===input.id)) { nodes = [...nodes,{id:input.id,parentId:input.parentId,name:input.name}];version++; }
        return {nodes,version};
      }
    }},
    { title: "Opening", route: "/", backend: {cloud_POST: pending} },
    { title: "Connection lost", route: "/", backend: {cloud_POST: httpError(503)} },
    { title: "Empty cloud", route: "/?cloud=tactical", backend: {cloud_POST: {nodes:cloudTree.seed,version:0} satisfies OutputType} }
  ]
});
