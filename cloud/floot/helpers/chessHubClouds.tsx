import type { CloudNode } from '../endpoints/cloud_POST.schema';

export const chessHubId = 'b380a0b4-2a50-4b87-b8b2-ed43eb40f88a';
export const communityId = 'chess-community';
export const communityRooms = ['chess-room-start', 'chess-room-strategy', 'chess-room-variants', 'chess-room-games', 'chess-room-feedback'] as const;
export const chessHubClouds: CloudNode[] = [
  {id:'chess-continue',parentId:chessHubId,name:'Continue',color:'blue',system:true},
  { id: communityId, parentId: chessHubId, name: 'Community', color: 'mint', system: true },
  ...communityRooms.map((id, i) => ({ id, parentId: communityId, name: ['Start here', 'Strategy', 'Variants', 'Your games', 'Ideas'][i], color: (['cyan', 'amber', 'lavender', 'blue', 'rose'] as const)[i], system: true })),
  { id: 'chess-following', parentId: communityId, name: 'Following', color: 'lavender', system: true },
  { id: 'chess-guidelines', parentId: communityId, name: 'Be kind', color: 'white', system: true, note: 'Ask freely. Explain your ideas. Welcome beginners. Discuss moves, never attack people. Keep personal details private. Do not post harassment, hateful content, sexual content, threats, scams or spam. Hold a discussion or reply to report it. Dev accounts can hide posts, close discussions and review reports.' },
  { id: 'chess-settings', parentId: communityId, name: 'Manage', color: 'coral', system: true },
  { id: 'chess-labels', parentId: 'chess-settings', name: 'Words', color: 'cyan', system: true },
  ...(['new','reply','post','share','copy-il','follow','edit','delete','report','empty','signin'] as const).map((id,i)=>({id:'chess-action-'+id,parentId:'chess-labels',name:['New discussion','Reply','Post','Share','Copy IL','Follow','Edit','Delete','Report','Nothing here yet','Sign in to join'][i],color:'cyan' as const,system:true})),
  { id: 'chess-today', parentId: 'd8b61dd3-a222-492d-8ccc-9dc08cf12cd2', name: 'Today’s idea', color: 'cyan', system: true },
  { id: 'chess-first-game', parentId: 'd8b61dd3-a222-492d-8ccc-9dc08cf12cd2', name: 'Your first game', color: 'mint', system: true, note: 'Start with Gliński’s chess. White moves first. Tap a piece, then a marked hexagon. Tap the piece again to put it down. Blue outlines show legal moves; captures and the last move have their own colours. Protect your king and check the opponent’s king. Try Computer on New, or play together on one device. Your games are saved when you sign in.' },
  { id: 'chess-first-play', parentId: 'chess-first-game', name: 'Play', color: 'cyan', system: true, href: '/glinski?mode=engine&level=0&engine=universal' },
  { id: 'chess-first-rules', parentId: 'chess-first-game', name: 'Rules', color: 'amber', system: true, href: '/?cloud=glinski-rules&space=chess' },
];

const ideas = ['glinski-rule-rook-2', 'glinski-rule-bishop-3', 'glinski-rule-knight-6', 'glinski-rule-capture-8', 'glinski-rule-check-12', 'glinski-rule-double-9', 'glinski-rule-promotion-11', 'glinski-rule-en-passant-10', 'glinski-rule-king-5', 'glinski-rule-stalemate-14', 'glinski-rule-queen-4', 'glinski-rule-mate-13'];
export function chessToday(nodes: CloudNode[], now = new Date()) {
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return nodes.map(n => n.id === 'chess-today' && !n.href && !n.redirect ? { ...n, href: '/?cloud=' + ideas[day % ideas.length] + '&space=chess' } : n);
}
