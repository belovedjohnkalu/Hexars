import {useTiledUI} from '../helpers/useTiledUI';
import { useEffect,useMemo,useRef,useState } from 'react';
import { Link,useLocation,useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FloatingBack } from './FloatingBack';
import { AppHead } from './AppHead';
import { Button } from './Button';
import { Input } from './Input';
import { Dialog,DialogContent,DialogTitle,DialogDescription } from './Dialog';
import { CloudBoard } from './CloudBoard';
import { CloudCanvas } from './CloudCanvas';
import {actionTileGroup} from '../helpers/actionTileGroup';
import {RhombusSurface} from './RhombusSurface';
import { SpatialViewport } from './SpatialViewport';
import { LoadingScreen } from './LoadingScreen';
import { postLibrary } from '../endpoints/library_POST.schema';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import type { VariantId } from '../endpoints/game_POST.schema';
import { chessVariants } from '../helpers/chessVariants';
import { boardLayout } from '../helpers/boardLayout';
import { gameSessions } from '../helpers/gameSessions';
import { useTitleRefresh } from '../helpers/useTitleRefresh';
import { useCloudHoldGuard } from '../helpers/useCloudHold';
import styles from './SavedGame.module.css';
export function savedReturn(value:string|null){return value&&/^\/(?:\?|(?:glinski|mccooey|shafran|brusky|devasa|wellisch|hexdame|kruzno)\?)/.test(value)&&!value.startsWith('//')?value:'/?cloud=chess-history';}
export function SavedGame({variant}:{variant:VariantId}){
 useCloudHoldGuard();const tiled=useTiledUI(),location=useLocation(),navigate=useNavigate(),params=new URLSearchParams(location.search),linked=gameSessions.fromHash(),gameId=params.get('game')||linked?.gameId,shareId=params.get('shareId')||undefined,token=params.get('share')||undefined,rawPly=params.get('ply'),ply=rawPly!==null&&/^\d+$/.test(rawPly)?Number(rawPly):undefined,panel=params.get('panel');
 const titleRefresh=useTitleRefresh(),[face,setFace]=useState(0),[copy,setCopy]=useState(''),heading=useRef<HTMLHeadingElement>(null),area=useRef<HTMLElement>(null),[size,setSize]=useState({width:393,height:650}),gesture=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{if(copy!=='Copied')return;const timer=setTimeout(()=>setCopy(''),1800);return()=>clearTimeout(timer);},[copy]);
 const input={action:'get' as const,gameId,shareId,token,ply},query=useQuery({queryKey:['saved-game',gameId,shareId,token,ply],queryFn:({signal})=>postLibrary(input,signal),retry:1,staleTime:0}),data=query.data;
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[panel,gameId]);
 useEffect(()=>{const el=area.current;if(!el)return;const resize=()=>setSize({width:el.clientWidth,height:el.clientHeight});resize();const observer=new ResizeObserver(resize);observer.observe(el);return()=>observer.disconnect();},[]);
 const rootParams=new URLSearchParams(params);rootParams.delete('panel');const rootURL='/'+(data?.game.variant||variant)+'?'+rootParams+location.hash;
 const panelURL=(name:string)=>{const q=new URLSearchParams(params);q.set('panel',name);return '/'+(data?.game.variant||variant)+'?'+q+location.hash;};
 const back=panel?rootURL:savedReturn(params.get('back')),label=panel==='notations'?'Notations':panel==='opponents'?(data?.game.variant==='wellisch'?'Opponents':'Opponent'):chessVariants.label(data?.game.variant||variant);
 const notations=data?.moves.map((move,i)=>`${i+1}. ${move.notation}`).join('\n')||'';
 const nodes=useMemo<CloudNode[]>(()=>{if(!data)return[];if(panel==='notations')return[{id:'notation-copy',parentId:'saved-panel',name:'Copy',color:'cyan',destination:'control',control:'copy'},...data.moves.map((m,i)=>{const q=new URLSearchParams(rootParams);q.set('ply',String(m.ply));q.set('back',panelURL('notations'));return{id:'notation-'+i,parentId:'saved-panel',name:(i+1)+'. '+m.notation,color:(["white","lavender","mint"] as const)[i%3],href:'/'+data.game.variant+'?'+q+location.hash};})];if(panel==='opponents'){
  const seats=data.game.board.players.filter(seat=>data.mode==='two_players'||data.humanPlayer===null||seat!==data.humanPlayer);
  return seats.map(seat=>({id:'saved-opponent-'+seat,parentId:'saved-panel',name:['White','Black','Gold'][seat]+' · '+(data.mode==='online'?data.players.find(p=>p.seat===seat)?.name||'Player':data.mode==='engine'?data.engineName:'Pass and Play'),color:(["white","lavender","amber"] as const)[seat]}));
 }return[];},[data,panel,location.search]).map(n=>({...n,identifier:data?.identifiers?.[n.id]}));
 const identifier=(key:string)=>data?.identifiers?.[key]?<span className={styles.identifier} data-identifier={data.identifiers[key]}>{data.identifiers[key]}</span>:null;
 const game=data?.game,layout=boardLayout(game?.board.cells||[],game?.board.orientation),boardWidth=Math.min(Math.max(280,size.width-24),Math.max(260,(size.height-(tiled?170:112))*layout.width/layout.height)),worldWidth=Math.max(size.width,boardWidth+24),worldHeight=Math.max(size.height,boardWidth*layout.height/layout.width+190),actionLayout=actionTileGroup(data?.canShare?['notations','opponents','share']:['notations','opponents'],Math.min(340,worldWidth-24),128,{notations:{name:'Notations',identifier:data?.identifiers?.notations},opponents:{name:game?.variant==='wellisch'?'Opponents':'Opponent',identifier:data?.identifiers?.opponents},share:{name:'Share',identifier:data?.identifiers?.share}}),boardTop=tiled?actionLayout.height+12:112,actionFace=(id:string)=>tiled?actionLayout.faces.find(f=>f.id===id):undefined,actionStyle=(id:string)=>{if(!tiled)return{left:worldWidth*(id==='notations'?.25:id==='opponents'?.75:.5),top:id==='share'?80:32,maxWidth:worldWidth*.44};const f=actionFace(id)!;return{left:f.x+(worldWidth-actionLayout.width)/2,top:f.y+4,width:f.width,height:f.height,clipPath:'polygon('+f.polygon.split(' ').map(p=>p.replace(',', 'px ')+'px').join(',')+')'};};
 async function copyText(){try{await navigator.clipboard.writeText(notations);setCopy('Copied');}catch{setCopy(notations||'No moves yet.');}}
 return <div data-layout={tiled?"tiled":"organic"} className={styles.app}><AppHead title={label+' · ION'}/><header className={styles.header}><h1 ref={heading} tabIndex={-1}  aria-busy={titleRefresh.refreshing}><button type="button" {...titleRefresh.handlers} onClick={titleRefresh.handlers.onClick}>{label}</button></h1></header><main ref={area} className={styles.main}>
 {query.isPending?<LoadingScreen label="Opening saved game"/>:query.error?<div className={styles.error}><p>{query.error.message}</p><Button variant="ghost" onClick={()=>void query.refetch()}>Retry</Button></div>:game&&data?<>
 {panel?<CloudCanvas showIdentifiers={!!data.dev} identity={'saved-'+data.gameId} nodes={nodes} parentId="saved-panel" scope="chess" opening={null} loading={false} onOpen={(e,_id,to)=>{e.preventDefault();navigate(to);}} onCommand={()=>void copyText()} onHighlight={n=>{if(panel==='notations')navigate('/?cloud=controls&game='+data.gameId+'&notation='+encodeURIComponent(n.name)+'&origin='+encodeURIComponent(location.pathname+location.search+location.hash)+(shareId?'&shareId='+shareId:'')+(token?'&token='+token:''));}}/>:<SpatialViewport width={worldWidth} height={worldHeight} viewKey={'saved-'+data.gameId+(tiled?':tiled':':organic')} label="Saved board">
 <Button asChild variant="ghost" className={styles.word} style={actionStyle('notations')}><Link to={panelURL('notations')}><RhombusSurface face={actionFace('notations')}><span>Notations</span>{identifier('notations')}</RhombusSurface></Link></Button>
 <Button asChild variant="ghost" className={styles.word+' '+styles.opponent} style={actionStyle('opponents')}><Link to={panelURL('opponents')}><RhombusSurface face={actionFace('opponents')}><span>{game.variant==='wellisch'?'Opponents':'Opponent'}</span>{identifier('opponents')}</RhombusSurface></Link></Button>
 {data.canShare&&<Button asChild variant="ghost" className={styles.word} style={actionStyle('share')}><Link to={'/?'+new URLSearchParams({cloud:'controls',game:data.gameId,shareMode:'nickname',origin:location.pathname+location.search+location.hash,...(shareId?{shareId}:{}),...(token?{token}:{})})}><RhombusSurface face={actionFace('share')}><span>Share</span>{identifier('share')}</RhombusSurface></Link></Button>}
 <div data-no-pan className={styles.board} data-saved-game={data.gameId} data-saved-ply={game.ply} style={{width:boardWidth,left:(worldWidth-boardWidth)/2,top:boardTop}} onKeyDown={e=>{if(e.key.toLowerCase()==='f'){e.preventDefault();setFace(n=>n+1);}}} onPointerDown={e=>{if(e.isPrimary&&e.button===0)gesture.current={x:e.clientX,y:e.clientY};}} onPointerUp={e=>{const start=gesture.current;gesture.current=null;if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dy)>45&&Math.abs(dy)>Math.abs(dx)*1.5)setFace(n=>n+1);else if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5){const q=new URLSearchParams(params);q.set('ply',String(Math.max(0,Math.min(data.moves.length,game.ply+(dx>0?-1:1)))));navigate('/'+game.variant+'?'+q+location.hash,{replace:true});}}} onPointerCancel={()=>{gesture.current=null;}}>
 <CloudBoard game={game} selected={null} onCell={()=>{}} flipped={face%2===1} rotation={game.variant==='wellisch'?-120*(face%3):undefined} coordinates={false} theme="neutral" disabled lastMove={data.moves[(ply??data.moves.length)-1]}/>
 </div></SpatialViewport>}
 </>:null}
 </main><footer className={styles.footer}>{copy==='Copied'&&<span role="status">Copied</span>}</footer><FloatingBack to={back}/>
 <Dialog open={!!copy&&copy!=='Copied'} onOpenChange={open=>{if(!open)setCopy('');}}><DialogContent><DialogTitle>{copy==='Copied'?'Copied':'Copy notations'}</DialogTitle><DialogDescription>{copy==='Copied'?'Ready to paste.':'Select the moves to copy them.'}</DialogDescription>{copy!=='Copied'&&<Input aria-label="Notations" readOnly value={copy.replace(/\n/g,' · ')} onFocus={e=>e.currentTarget.select()}/>}<Button variant="ghost" onClick={()=>setCopy('')}>Done</Button></DialogContent></Dialog>
 </div>;
}
