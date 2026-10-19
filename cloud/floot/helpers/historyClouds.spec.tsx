import { historyClouds } from './historyClouds';
describe('Private chess date hierarchy',()=>{
 it('creates only played years, months and days, with separate variant previews per game',()=>{
  const nodes=historyClouds([{id:'a',variant:'glinski',date:'2026-10-19',time:'09:12'},{id:'b',variant:'wellisch',date:'2026-10-19',time:'10:12'},{id:'c',variant:'glinski',date:'2025-02-01',time:'11:12'}]);
  expect(nodes.filter(n=>n.parentId==='chess-history').map(n=>n.name)).toEqual(['2026','2025']);
  expect(nodes.filter(n=>n.parentId==='history-2026').map(n=>n.name)).toEqual(['October']);
  expect(nodes.filter(n=>n.parentId==='history-2026-10').map(n=>n.name)).toEqual(['19']);
  const games=nodes.filter(n=>n.parentId==='history-2026-10-19');expect(games.length).toBe(2);expect(games.every(n=>n.destination==='saved-game'&&n.isImage)).toBeTrue();
 });
 it('does not invent dates or show games in an empty history',()=>{expect(historyClouds([])).toEqual([]);});
});
