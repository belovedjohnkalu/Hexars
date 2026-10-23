import { chessVariants } from './chessVariants';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const notificationsId='17a6bf07-e0f7-4f71-9e4c-1b4f3527a3a2';
export const pushAccountKey='ion.push-account';
export function notificationRoute(data:Record<string,unknown>):string|null{
 if(typeof data.route!=='string'||!data.route.startsWith('/')||data.route.startsWith('//'))return null;
 try{const url=new URL(data.route,'https://ion.floot.app');if(url.origin!=='https://ion.floot.app'||url.hash)return null;
 const p=url.searchParams;if(url.pathname==='/'&&p.get('cloud')==='time-receipt'&&p.get('space')==='home'&&uuid.test(p.get('receipt')||''))return '/?'+new URLSearchParams({cloud:'time-receipt',space:'home',receipt:p.get('receipt')!});
 if(chessVariants.isId(url.pathname.slice(1))&&p.get('mode')==='saved'&&uuid.test(p.get('game')||'')&&uuid.test(p.get('shareId')||''))return url.pathname+'?'+new URLSearchParams({mode:'saved',game:p.get('game')!,shareId:p.get('shareId')!,back:'/?cloud=shared-received&space=chess'});
 }catch{}return null;
}
