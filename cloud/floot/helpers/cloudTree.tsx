import type { CloudNode } from "../endpoints/cloud_POST.schema";

const seed: CloudNode[] = [
  { id: "hexagonal-chess", parentId: null, name: "Hexagonal Chess", imageUrl: "/_cdn/static/9522e791-e7fa-41d6-867c-2d4013eb3982-hexars-dark-512.png" },
  { id: "engines", parentId: "hexagonal-chess", name: "Engines" },
  { id: "tactical", parentId: "engines", name: "Tactical", note: "Looks for threats, captures and combinations. Runs in the cloud." },
  { id: "rules", parentId: "hexagonal-chess", name: "Rules" },
  { id: "glinski-rules", parentId: "rules", name: "Gliński", note: "91 cells. Tap a piece, then a marked hexagon. Pawns capture to either forward side. A starting pawn cell allows a two-step advance. No castling. Promote at the far edge. En passant lasts one turn. Stalemate scores ¾–¼." },
  { id: "mccooey-rules", parentId: "rules", name: "McCooey", note: "91 cells. Pawns capture through corners. Unmoved pawns may advance twice, except the central pawn, as specified by McCooey’s rules. No castling. Promote at the far edge. En passant lasts one turn. Stalemate scores ½–½." },
  { id: "boards", parentId: "hexagonal-chess", name: "Boards", destination: "board" },
];
function descendants(nodes: CloudNode[], id: string) {
  const visited = new Set<string>([id]);
  const queue = [id];
  for (let i = 0; i < queue.length; i++) {
    for (const node of nodes) if (node.parentId === queue[i] && !visited.has(node.id)) {
      visited.add(node.id); queue.push(node.id);
    }
  }
  return visited.size - 1;
}
function sizes(nodes: CloudNode[], parentId: string | null) {
  const siblings = nodes.filter(n => n.parentId === parentId);
  const counts = siblings.map(n => descendants(nodes, n.id));
  const min = Math.min(...counts), max = Math.max(...counts);
  return siblings.map((node, i) => ({
    ...node, count: counts[i],
    percent: max === min ? 50 : (counts[i] - min) / (max - min) * 100,
  }));
}
export const cloudTree = { seed, descendants, sizes,
  path(nodes: CloudNode[], id: string | null) {
    const result: CloudNode[] = [], seen = new Set<string>();
    let current = nodes.find(n => n.id === id);
    while (current && !seen.has(current.id)) {
      seen.add(current.id); result.unshift(current);
      current = nodes.find(n => n.id === current!.parentId);
    }
    return result;
  },
};
