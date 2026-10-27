import {cloudLayout} from './cloudLayout';
import {chessCommunityAnchors} from './chessNavigation';
import { chessHubClouds,chessToday } from './chessHubClouds';
import { gameSessions } from './gameSessions';
import { deviceData } from './deviceData';
import { playerName } from './playerName';
import type { OutputType } from '../endpoints/game_POST.schema';
describe('Chess hub returns and public identities',()=>{
  afterEach(()=>{localStorage.clear();deviceData.setIdentity(null);});
  it('rotates the daily lesson without replacing a dev redirect or name',()=>{const today=chessHubClouds.find(n=>n.id==='chess-today')!,a=chessToday([today],new Date(2026,9,27)),b=chessToday([today],new Date(2026,9,28));expect(a[0].href).not.toBe(b[0].href);expect(chessToday([{...today,name:'A new idea',href:'/?il=IL01'}])[0]).toEqual({...today,name:'A new idea',href:'/?il=IL01'});});
  it('keeps automatic game resume inside the current account',()=>{const result={gameId:'00000000-0000-4000-8000-000000000069',accessToken:'a'.repeat(64),mode:'two_players',game:{variant:'glinski',result:{status:'ongoing'}},moves:[]} as unknown as OutputType;deviceData.setIdentity(69011);gameSessions.save(result);expect(gameSessions.stored('glinski','two_players')?.gameId).toBe(result.gameId);expect(gameSessions.last(69011)?.gameId).toBe(result.gameId);deviceData.setIdentity(69012);expect(gameSessions.stored('glinski','two_players')).toBeNull();expect(gameSessions.last(69012)).toBeNull();expect(gameSessions.last(null)).toBeNull();});
  it('uses a safe public fallback for an old email-shaped display name',()=>{expect(playerName('player@example.invalid')).toBe('Player');expect(playerName('  Knight  ')).toBe('Knight');});
});


describe('Community phone arrangement',()=>{
 it('spreads a first visit across both axes without overlapping words',()=>{
  const items=chessHubClouds.filter(n=>n.parentId==='chess-community'&&n.id!=='chess-settings').map(n=>({...n,percent:0,characters:0}));
  const layout=cloudLayout(items,390,640,(s,n)=>s.length*n*.54,{organic:true,square:true,compact:true,proportional:true,anchors:chessCommunityAnchors,labelMaxWidth:304,maxFontSize:70,minTargetSize:72});
  const bounds={width:Math.max(...layout.items.map(n=>n.x+n.width))-Math.min(...layout.items.map(n=>n.x)),height:Math.max(...layout.items.map(n=>n.y+n.height))-Math.min(...layout.items.map(n=>n.y))};
  expect(bounds.width/bounds.height).toBeGreaterThan(.8);
  for(const a of layout.items)for(const b of layout.items.filter(n=>n.id!==a.id))expect(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y).toBeFalse();
 });
});
