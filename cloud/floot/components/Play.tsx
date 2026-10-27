import {gameActionNames} from '../helpers/functionClouds';
import {useTiledUI} from '../helpers/useTiledUI';
import {onlineGameAction} from '../helpers/retiredGameClouds';
import {useDisplayName} from '../helpers/useDisplayName';
import {isFreeVariant} from '../helpers/computerPolicy';
import {gameFacing} from '../helpers/gameFacing';
import {pathPrefix,checkersStepView} from '../helpers/checkersInteraction';
import {checkersRoot} from '../helpers/checkersClouds';
import { useMatchChat } from '../helpers/useMatchChat';
import { cloudLayout } from '../helpers/cloudLayout';
import { RhombusSurface } from './RhombusSurface';
import {gameActionMosaic} from '../helpers/gameActionMosaic';
import { Input } from './Input';
import { ArrowUp } from 'lucide-react';
import { useTime } from '../helpers/useTime';
import { TimeAccess } from './TimeAccess';
import { engineId as resolveEngineId, engineName } from '../helpers/chessEngines';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppHead } from "./AppHead";
import { FloatingBack } from './FloatingBack';
import { Button } from "./Button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./Dialog";
import { SavedGame } from './SavedGame';
import { LoadingScreen } from './LoadingScreen';
import { Spinner } from "./Spinner";
import { PageControls } from "./PageControls";
import { CloudBoard } from "./CloudBoard";
import { ChessPiece } from "./ChessPiece";
import { SpatialViewport } from "./SpatialViewport";
import { gameSessions } from "../helpers/gameSessions";
import { useCloudGame } from "../helpers/useCloudGame";
import { gameOutcome } from "../helpers/gameOutcome";
import { useBoardFacing } from "../helpers/useBoardFacing";
import { useInstallApp } from "../helpers/useInstallApp";
import { postGame, type VariantId, type Hex, type ChessMove, type GameView } from "../endpoints/game_POST.schema";
import { previewMove } from "../helpers/previewMove";
import { gameCloudLayout } from "../helpers/gameCloudLayout";
import { boardLayout } from "../helpers/boardLayout";
import { chessVariants } from "../helpers/chessVariants";
import { useAuth } from '../helpers/useAuth';
import { useTitleRefresh } from '../helpers/useTitleRefresh';
import styles from "./Play.module.css";
const moveInput=(m:ChessMove)=>({from:m.from,to:m.to,...(m.path?{path:m.path}:{}),...(m.promotion?{promotion:m.promotion}:{}),...(m.pass?{pass:true as const}:{})});
const key=(h:Hex)=>h.q+','+h.r;
export function Play({variant}:{variant:VariantId}){const location=useLocation(),params=new URLSearchParams(location.search),items=isFreeVariant(variant)?[]:['variant:'+variant];return params.get('mode')==='saved'?<SavedGame variant={variant}/>:<TimeAccess items={items}><LivePlay variant={variant}/></TimeAccess>;}
function LivePlay({variant}:{variant:VariantId}){
 const tiled=useTiledUI(),checkers=chessVariants.isCheckers(variant),variantURL=checkers?'/?cloud='+checkersRoot+'&space=chess':'/?cloud=boards';
 const time=useTime(),identifier=(action:string)=>{const value=time.snapshot?.identifiers?.['game-'+variant+'-'+action];return value?<span className={styles.identifier} data-identifier={value}>{value}</span>:null;};
 useInstallApp();const titleRefresh=useTitleRefresh(),location=useLocation(),navigate=useNavigate();
 const mode=new URLSearchParams(location.search).get('mode')==='friend'?'two_players':'engine';
 const rawLevel=new URLSearchParams(location.search).get('level');const value=Number(rawLevel??3),difficulty=Number.isInteger(value)&&value>=0&&value<=5?value:3;
 const {authState}=useAuth(),engineId='universal' as const;
 const cloud=useCloudGame(variant,mode,difficulty,engineId,authState.type==='authenticated'?authState.user.id:null,authState.type!=='loading'),data=cloud.data,game=data?.game;
 const [selected,setSelected]=useState<Hex|null>(null),[promotions,setPromotions]=useState<ChessMove[]>([]),[reset,setReset]=useState(false),[resultOpen,setResultOpen]=useState(false);
 const [forfeit,setForfeit]=useState(false),chatComposing=useRef(false),chatInput=useRef<HTMLInputElement>(null);
 const [capturePath,setCapturePath]=useState<Hex[]>([]);
 const [promotionPage,setPromotionPage]=useState(0);
 const [viewOffset,setViewOffset]=useState(0);
 useEffect(()=>setPromotionPage(0),[promotions]);
 const [review,setReview]=useState<{ply:number;game:GameView}|null>(null),[reviewBusy,setReviewBusy]=useState(false),[reviewError,setReviewError]=useState('');
 const [size,setSize]=useState({width:390,height:650}),[measured,setMeasured]=useState(false),area=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null),keep=useRef<HTMLButtonElement>(null),endKey=useRef('');
 const desired=useRef<number|null>(null),sequence=useRef(0),reviewAbort=useRef<AbortController|null>(null),swipe=useRef<{x:number;y:number;axis:'x'|'y'|null;pointer:number}|null>(null),suppressClick=useRef(false);
 const shown=review?.game||cloud.playback?.game||(game?previewMove(game,cloud.pendingMove):undefined),ended=!!game&&game.result.status!=='ongoing',thinking=!!data&&data.mode==='engine'&&game?.activePlayer!==data.humanPlayer&&!ended;
 const online=data?.mode==='online'||new URLSearchParams(location.search).get('mode')==='online';
 const chat=useMatchChat(data?.gameId,authState.type==='authenticated'?authState.user.id:null,online&&!ended);
 useEffect(()=>{if(!online||!data||ended)return;const frame=requestAnimationFrame(()=>{if(matchMedia('(hover: hover) and (pointer: fine)').matches&&!document.querySelector('[role=dialog]'))chatInput.current?.focus({preventScroll:true});});return()=>cancelAnimationFrame(frame);},[online,data?.gameId,ended]);
 const basePlayer=data?.mode==='two_players'?(shown?.activePlayer??0):(data?.humanPlayer??0);
 const facing=useBoardFacing(data?.gameId,shown?.ply,gameFacing(variant,basePlayer,viewOffset));
 const selectedGame=!!gameSessions.fromHash()||!!data&&data.mode===mode&&(mode==='two_players'||data.difficulty===difficulty&&resolveEngineId(data.engineId)===engineId);
 const canPlay=selectedGame&&!!game&&!ended&&!cloud.offline&&!cloud.playingTurn&&!cloud.busy&&!cloud.switchingSide&&!cloud.error&&!thinking&&(data?.mode!=='online'||game.activePlayer===data.humanPlayer)&&!facing.turning&&!review&&!reviewBusy;
 const candidates=game?.legalMoves.filter(m=>selected&&key(m.from)===key(selected))||[];
 const canUndo=data?.mode!=='online'&&selectedGame&&!!data?.moves.length&&!cloud.playingTurn&&!cloud.busy&&!facing.turning&&!review&&(data.mode==='two_players'||data.moves.some(m=>m.player===data.humanPlayer));
 const name=chessVariants.label(variant),hubName=useDisplayName('hexagonal-chess','Board Games');
 const display=shown&&checkers&&!review&&!cloud.pendingMove?checkersStepView(shown,capturePath):shown,displaySelected=checkers&&capturePath.length?capturePath[capturePath.length-1]:selected;
 const pathMove=capturePath.length>1?{from:capturePath[capturePath.length-2],to:capturePath[capturePath.length-1]}:undefined;
 useEffect(()=>{const el=area.current;if(!el)return;const observer=new ResizeObserver(()=>{setSize({width:el.clientWidth,height:Math.max(1,el.clientHeight)});setMeasured(true);});observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[variant]);
 useEffect(()=>{setSelected(null);setPromotions([]);setCapturePath([]);},[game?.stateId]);
 useEffect(()=>{setForfeit(false);setCapturePath([]);setViewOffset(0);setSelected(null);setPromotions([]);setReset(false);setResultOpen(false);endKey.current='';setReview(null);desired.current=null;reviewAbort.current?.abort();setReviewBusy(false);setReviewError('');},[data?.gameId]);
 useEffect(()=>{if(game?.variant==='wellisch'&&canPlay&&game.legalMoves.length&&game.legalMoves.every(m=>m.promotion&&key(m.from)===key(m.to)))setPromotions(game.legalMoves);},[game?.stateId,canPlay,data?.gameId]);
 useEffect(()=>{if(!ended||!data||!game||cloud.playingTurn)return;setForfeit(false);setPromotions([]);const id=data.gameId+':'+game.stateId;if(endKey.current!==id){endKey.current=id;setResultOpen(true);}},[ended,data?.gameId,game?.stateId,cloud.playingTurn]);
 useEffect(()=>()=>reviewAbort.current?.abort(),[]);
 function choose(hex:Hex){if(!canPlay||!game)return;if(checkers){
  const branches=game.legalMoves.filter(m=>pathPrefix(m,capturePath.length?capturePath:selected?[selected]:[]));
  const next=branches.filter(m=>m.path&&capturePath.length&&key(m.path[capturePath.length]??m.to)===key(hex));
  if(next.length){const path=[...capturePath,hex],complete=next.find(m=>m.path!.length===path.length);if(complete){setSelected(null);setCapturePath([]);void cloud.play(moveInput(complete));}else setCapturePath(path);return;}
  if(capturePath.length&&key(capturePath[capturePath.length-1])===key(hex)){setSelected(null);setCapturePath([]);return;}
  const own=game.board.cells.find(c=>key(c)===key(hex))?.piece?.player===game.activePlayer;setSelected(own?hex:null);setCapturePath(own?[hex]:[]);return;
 }const moves=candidates.filter(m=>key(m.to)===key(hex));if(moves.length>1){setPromotions(moves);return;}if(moves.length===1){setSelected(null);void cloud.play(moveInput(moves[0]));}else setSelected(selected&&key(selected)===key(hex)?null:game.board.cells.find(c=>key(c)===key(hex))?.piece?.player===game.activePlayer?hex:null);}
 async function history(ply:number){
  if(!data||!game)return;ply=Math.max(0,Math.min(game.ply,ply));desired.current=ply;setCapturePath([]);setSelected(null);reviewAbort.current?.abort();const seq=++sequence.current;
  if(ply===game.ply){setReview(null);desired.current=null;setReviewBusy(false);setReviewError('');return;}
  const controller=new AbortController();reviewAbort.current=controller;setReviewBusy(true);setReviewError('');
  try{const result=await postGame({action:'review',gameId:data.gameId,accessToken:data.accessToken,ply},{signal:controller.signal});if(seq===sequence.current)setReview({ply,game:result.game});}
  catch(e){if(!controller.signal.aborted){setReviewError('Couldn’t load that move. Try again.');desired.current=review?.ply??null;}}
  finally{if(seq===sequence.current)setReviewBusy(false);}
 }
 function down(e:PointerEvent<HTMLDivElement>){if(e.button!==0||!e.isPrimary){swipe.current=null;return;}suppressClick.current=false;swipe.current={x:e.clientX,y:e.clientY,axis:null,pointer:e.pointerId};}
 function move(e:PointerEvent<HTMLDivElement>){const start=swipe.current;if(!start||start.pointer!==e.pointerId)return;const dx=Math.abs(e.clientX-start.x),dy=Math.abs(e.clientY-start.y);if(!start.axis){if(dx>40&&dy<dx*.6)start.axis='x';else if(dy>40&&dx<dy*.6)start.axis='y';}if(start.axis){e.preventDefault();suppressClick.current=true;e.currentTarget.setPointerCapture(e.pointerId);}}
 function flipBoard(){if(!data)return;setCapturePath([]);setSelected(null);setPromotions([]);setReview(null);desired.current=null;reviewAbort.current?.abort();if(data.mode==='engine'&&game?.ply===0)cloud.switchSide();else setViewOffset(value=>(value+1)%(variant==='wellisch'?3:2));}
 function up(e:PointerEvent<HTMLDivElement>){const start=swipe.current;swipe.current=null;if(start?.pointer===e.pointerId){if(start.axis==='x')void history((desired.current??game?.ply??0)+(e.clientX>start.x?-1:1));else if(start.axis==='y'&&e.clientY-start.y>40)flipBoard();}if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}
 async function restart(){if(data?.mode==='online'){navigate('/?cloud=online');return;}if(await cloud.newGame(data?.mode==='two_players'?'two_players':'engine',variant==='kruzno'?1:0,variant)){setViewOffset(0);setReset(false);setResultOpen(false);setReview(null);}}
 const layout=boardLayout(shown?.board.cells??[],shown?.board.orientation);
 const {boardWidth,boardHeight,worldWidth:baseWidth,worldHeight:baseHeight}=gameCloudLayout(size.width,size.height,layout.width/layout.height);
 const actionText=useMemo(()=>Object.fromEntries(Object.entries(gameActionNames).map(([id,name])=>{const key=online&&(id==='forfeit'||id==='draw')?onlineGameAction(variant,id):id;return[id,{name:time.snapshot?.labels?.['game-'+variant+'-'+key]||name,identifier:time.snapshot?.identifiers?.['game-'+variant+'-'+key]}];})),[time.snapshot?.labels,time.snapshot?.identifiers,variant,online]);
 const actionLayout=useMemo(()=>gameActionMosaic(baseWidth,boardHeight,size.height,online,boardWidth,tiled,actionText),[baseWidth,boardHeight,size.height,online,boardWidth,tiled,actionText]),boardY=actionLayout.boardY,actionFace=(id:string)=>actionLayout.faces.get(id),actionStyle=(id:string)=>{if(!tiled)return actionLayout.anchors!.get(id)!;const f=actionFace(id)!;return{left:f.x,top:f.y,width:f.width,height:f.height,clipPath:'polygon('+f.polygon.split(' ').map(p=>p.replace(',', 'px ')+'px').join(',')+')'};},actionLabel=(id:string,fallback:string)=>actionLayout.lines?.get(id==='online-forfeit'?'forfeit':id==='online-draw'?'draw':id)?.join('\n')||time.snapshot?.labels?.['game-'+variant+'-'+id]||fallback;
 const chatLayout=useMemo(()=>cloudLayout(chat.messages.map(m=>({id:m.id,name:m.name+' · '+m.text,identifier:m.identifier,percent:0})),baseWidth,120,(text,size)=>Array.from(text).length*size*.62,{rhombi:tiled,organic:!tiled,proportional:!tiled,maxFontSize:20}),[chat.messages,baseWidth,tiled]);
 const chatY=boardY+boardHeight+24,worldWidth=baseWidth,worldHeight=Math.max(actionLayout.worldHeight,online&&chat.messages.length?chatY+chatLayout.height+20:0);
 const drawVoted=!!data?.drawVotes?.includes(data.humanPlayer),drawCount=data?.drawVotes?.length??0;
 const side=game?.activePlayer===0?'White':game?.activePlayer===2?'Gold':'Black';
 const status=cloud.offline?'Offline · saved board':cloud.playingTurn?'Moving…':review?`Move ${review.ply} of ${game?.ply}`:!game?cloud.missing?'Game unavailable':'Opening…':ended?'Game over':cloud.pendingMove?'Moving…':thinking?(variant==='wellisch'?`${engineName(data.engineId)} · ${side}`:'Thinking…'):checkers&&capturePath.length>1?'Continue capture':game.check?(variant==='wellisch'?`${side} · Check`:'Check'):data?.mode==='two_players'?side+'’s turn':data?.mode==='online'&&game.activePlayer!==data.humanPlayer?side+'’s turn':'Your turn';
 const outcome=game?gameOutcome(game.result,data?.mode||'two_players',data?.humanPlayer??0,(checkers?'Computer':engineName(data?.engineId))):{title:'Draw',score:'½ – ½',detail:''};
 return <div className={styles.app} data-layout={tiled?"tiled":"organic"} data-online={online} data-game-id={data?.gameId} data-human-player={data?.humanPlayer} data-game-version={data?.version}><AppHead title={name+' · '+hubName}/>
 <header className={styles.header}><h1  aria-busy={titleRefresh.refreshing} ref={heading} tabIndex={-1}><button type="button" {...titleRefresh.handlers} onClick={titleRefresh.handlers.onClick}>{name}</button></h1><div className={styles.status} data-three-players={variant==='wellisch'} data-checkers={checkers} role="status" aria-live="polite">{status}{thinking&&<Spinner size="sm" aria-label={(checkers?'Computer':engineName(data?.engineId))+' is thinking'}/>}{canPlay&&game?.legalMoves[0]?.pass&&<Button variant="ghost" onClick={()=>void cloud.play(moveInput(game.legalMoves[0]))}>Pass</Button>}</div></header>
 <main ref={area} className={styles.space} aria-label={name+' game'}><SpatialViewport width={worldWidth} height={worldHeight} viewKey={'game-'+variant+(tiled?':tiled':':organic')} label="Board" ready={measured&&!!shown} refitKey={size.width+":"+size.height} contentBounds={actionLayout.desktop?{x:0,y:0,width:baseWidth,height:actionLayout.worldHeight}:online||size.width>size.height*1.6?{x:(baseWidth-boardWidth)/2-10,y:boardY-10,width:boardWidth+20,height:boardHeight+20}:undefined}>
 <nav className={styles.words} aria-label="Game actions" style={{width:worldWidth,height:worldHeight}}>
 {!online&&<>
 <Button asChild variant="ghost" className={styles.word} style={{...actionStyle('variants'),color:'var(--word-cyan)'}}><Link to={variantURL}><RhombusSurface face={actionFace('variants')}><span>{actionLabel('variants','Variants')}</span>{identifier('variants')}</RhombusSurface></Link></Button>
 <Button asChild variant="ghost" className={styles.word} style={{...actionStyle('rules'),color:'var(--word-amber)'}}><Link to={'/?cloud='+(checkers?variant+'-rules':'rules')+'&return='+variant+'&mode='+(data?.mode==='two_players'?'friend':'engine')+'&level='+(data?.difficulty??difficulty)+'&engine='+(data?.engineId??engineId)+'&saved='+encodeURIComponent(data?gameSessions.hash(data):'')}><RhombusSurface face={actionFace('rules')}><span>{actionLabel('rules','Rules')}</span>{identifier('rules')}</RhombusSurface></Link></Button>
 <Button asChild variant="ghost" className={styles.word} style={{...actionStyle('engines'),color:'var(--word-coral)'}}><Link to={'/?cloud='+(checkers?'checkers-computer':'engines')+'&return='+variant+'&mode='+(data?.mode==='two_players'?'friend':'engine')+'&level='+(data?.difficulty??difficulty)+'&engine='+(data?.engineId??engineId)+'&saved='+encodeURIComponent(data?gameSessions.hash(data):'')}><RhombusSurface face={actionFace('engines')}><span>{actionLabel('engines','Computer')}</span>{identifier('engines')}</RhombusSurface></Link></Button>
 <Button asChild variant="ghost" className={styles.word} style={{...actionStyle('friend'),color:'var(--word-mint)'}}><Link to={'/'+variant+'?mode=friend'} aria-current={data?.mode==='two_players'?'page':undefined} onClick={()=>{try{localStorage.removeItem('ion.engine');}catch{}}}><RhombusSurface face={actionFace('friend')}><span>{actionLabel('friend','Pass and Play')}</span>{identifier('friend')}</RhombusSurface></Link></Button>
 {data?.mode!=='online'&&<Button variant="ghost" className={styles.word+' '+styles.secondaryWord} style={{...actionStyle('reset')}} disabled={cloud.busy} onClick={()=>game?.ply?setReset(true):void restart()}><RhombusSurface face={actionFace('reset')}><span>{actionLabel('reset','Board Reset')}</span>{identifier('reset')}</RhombusSurface></Button>}
 {data?.mode!=='online'&&<Button variant="ghost" className={styles.word+' '+styles.secondaryWord} style={{...actionStyle('undo')}} disabled={!canUndo} onClick={()=>void cloud.undo()}><RhombusSurface face={actionFace('undo')}><span>{actionLabel('undo','Undo')}</span>{identifier('undo')}</RhombusSurface></Button>}
 <Button asChild variant="ghost" className={styles.word} style={{...actionStyle('online'),color:'var(--word-mint)'}}><Link to={checkers?'/?cloud=checkers-online&space=chess&return='+variant:'/?cloud=online&space=chess'}><RhombusSurface face={actionFace('online')}><span>{actionLabel('online','Online')}</span>{identifier('online')}</RhombusSurface></Link></Button>
 <Button asChild variant="ghost" className={styles.word} style={{...actionStyle('library'),color:'var(--word-lavender)'}}><Link to="/?cloud=chess-history&space=chess"><RhombusSurface face={actionFace('library')}><span>{actionLabel('library','Library')}</span>{identifier('library')}</RhombusSurface></Link></Button>
 </>}
 {online&&<><Button variant="ghost" className={styles.word} style={{...actionStyle('forfeit'),color:'var(--word-coral)'}} disabled={!game||ended||cloud.busy} onClick={()=>setForfeit(true)}><RhombusSurface face={actionFace('forfeit')}><span>{actionLabel(onlineGameAction(variant,'forfeit'),'Forfeit')}</span>{identifier(onlineGameAction(variant,'forfeit'))}</RhombusSurface></Button><Button variant="ghost" className={styles.word} style={{...actionStyle('draw'),color:'var(--word-cyan)'}} disabled={!game||ended||cloud.busy||drawVoted} aria-label={drawCount?'Draw · '+drawCount+' agreed':'Draw'} onClick={()=>void cloud.onlineAction('draw')}><RhombusSurface face={actionFace('draw')}><span>{actionLabel(onlineGameAction(variant,'draw'),'Draw')}</span>{drawCount>0&&<span className={styles.drawCount}>{drawCount} / {game?.activePlayers?.length??game?.board.players.length}</span>}{identifier(onlineGameAction(variant,'draw'))}</RhombusSurface></Button></>}
 </nav>
 <div role="log" aria-label="Match messages" aria-live="polite" aria-relevant="additions">{online&&chat.messages.map(message=>{const item=chatLayout.items.find(item=>item.id===message.id)!;return <p key={message.id} data-chat-id={message.id} className={styles.chatWord} style={{left:item.x+(baseWidth-chatLayout.width)/2,top:chatY+item.y,width:item.width,height:item.height,fontSize:item.fontSize,color:message.seat===0?'var(--word-cyan)':message.seat===1?'var(--word-lavender)':'var(--word-amber)'}}><RhombusSurface face={item.rhombus}><span className={styles.chatLine}>{item.lines?.join('\n')}</span>{message.identifier&&<span className={styles.identifier} data-identifier={message.identifier}>{message.identifier}</span>}</RhombusSurface></p>;})}</div>
 <div data-no-pan className={styles.board} data-pending-move={!!cloud.pendingMove} style={{width:boardWidth,left:(baseWidth-boardWidth)/2,top:boardY}} onKeyDown={e=>{if(e.key.toLowerCase()==='f'&&!e.repeat&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();flipBoard();}}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{swipe.current=null;}} onClickCapture={e=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false;}}}>
 {display?<CloudBoard key={data?.gameId} game={display} selected={review?null:displaySelected} onCell={choose} flipped={facing.flipped} rotation={variant==='wellisch'?facing.rotation:undefined} coordinates={false} theme="neutral" lastMove={cloud.playback?.move??pathMove??cloud.pendingMove??data?.moves[(review?.ply??game?.ply??0)-1]} disabled={!canPlay}/>:<div className={styles.loading}>{!cloud.error&&<LoadingScreen label="Opening board"/>}</div>}
 </div>
 </SpatialViewport></main>
 {(review||reviewBusy)&&<div className={styles.history} role="group" aria-label="Move history"><Button variant="ghost" size="icon" aria-label="Previous move" disabled={(desired.current??review?.ply??0)<=0} onClick={()=>void history((desired.current??review?.ply??0)-1)}><ChevronLeft size={18}/></Button><Button variant="ghost" disabled={reviewBusy} onClick={()=>void history(game?.ply??0)}>{reviewBusy?'Opening…':'Present'}</Button><Button variant="ghost" size="icon" aria-label="Next move" onClick={()=>void history((desired.current??review?.ply??0)+1)}><ChevronRight size={18}/></Button></div>}
 {(cloud.error||reviewError)&&<div role="alert" className={styles.error}>{cloud.error||reviewError}<Button variant="link" onClick={()=>cloud.missing?void restart():cloud.error?void cloud.refresh():void history(desired.current??review?.ply??game?.ply??0)}>{cloud.missing?'New game':'Retry'}</Button>{!online&&<Button asChild variant="link"><Link to="/?cloud=time-prices&space=home">Time</Link></Button>}</div>}
 {online&&!ended&&<div className={styles.chatComposer}><form noValidate aria-label="Match chat" onSubmit={event=>{event.preventDefault();if(!chatComposing.current)void chat.send();}}><label className={styles.srOnly} htmlFor="match-chat">Message</label><Input id="match-chat" ref={chatInput} placeholder="Message…" maxLength={240} value={chat.draft} onChange={e=>chat.setDraft(e.target.value)} readOnly={chat.busy} aria-invalid={!!chat.error} aria-describedby={chat.error?'match-chat-error':undefined} autoComplete="off" enterKeyHint="send" onCompositionStart={()=>{chatComposing.current=true;}} onCompositionEnd={()=>{chatComposing.current=false;}} onKeyDown={event=>{if(event.key==='Enter'&&(event.nativeEvent.isComposing||chatComposing.current))event.preventDefault();}}/><Button type="submit" size="icon" aria-label="Send message" disabled={chat.busy||!chat.draft.trim()} aria-busy={chat.busy}>{chat.busy?<Spinner size="sm"/>:<ArrowUp size={22}/>}</Button></form>{chat.error&&<p id="match-chat-error" role="alert">{chat.error}</p>}</div>}
 <footer className={styles.footer}/><FloatingBack to={variantURL} label="Back to variants"/><span className={styles.srOnly} data-ply={game?.ply??0} data-review-ply={review?.ply??'present'}>{game?.ply??0} moves</span>

 <Dialog open={forfeit} onOpenChange={open=>{if(!cloud.busy)setForfeit(open);}}><DialogContent className={styles.sheet} closeDisabled={cloud.busy} onOpenAutoFocus={event=>{event.preventDefault();keep.current?.focus();}}><DialogTitle>Forfeit?</DialogTitle><DialogDescription>{variant==='wellisch'?'You leave the match. The other active players share the win.':'Your opponent wins this match.'}</DialogDescription><div className={styles.actions}><Button ref={keep} variant="ghost" disabled={cloud.busy} onClick={()=>setForfeit(false)}>Keep playing</Button><Button disabled={cloud.busy} onClick={()=>void cloud.onlineAction('forfeit').then(ok=>{if(ok)setForfeit(false);})}>Forfeit</Button></div>{cloud.error&&<p role="alert">{cloud.error}</p>}</DialogContent></Dialog>
 <Dialog open={reset} onOpenChange={open=>{if(!cloud.busy)setReset(open);}}><DialogContent closeDisabled={cloud.busy} className={styles.sheet} onOpenAutoFocus={e=>{e.preventDefault();keep.current?.focus();}}><DialogTitle>Reset the board?</DialogTitle><DialogDescription>Your current game will be replaced.</DialogDescription><div className={styles.actions}><Button ref={keep} variant="ghost" disabled={cloud.busy} onClick={()=>setReset(false)}>Keep playing</Button><Button disabled={cloud.busy} onClick={()=>void restart()}>{cloud.busy?'Opening…':'Reset board'}</Button></div>{cloud.error&&<p role="alert">{cloud.error}</p>}</DialogContent></Dialog>
 <Dialog open={!!promotions.length} onOpenChange={open=>{if(!open&&!cloud.busy)setPromotions([]);}}><DialogContent closeDisabled={cloud.busy} className={styles.sheet}><DialogTitle>Promote</DialogTitle><DialogDescription>Choose your piece.</DialogDescription><div className={styles.promotions}>{promotions.slice(promotionPage*3,promotionPage*3+3).map(m=><Button key={key(m.from)+'-'+m.promotion} variant="ghost" aria-label={'Promote '+(m.fromNotation?m.fromNotation+' ':'')+'to '+m.promotion} disabled={cloud.busy} onClick={()=>void cloud.play(moveInput(m)).then(ok=>{if(ok)setPromotions([]);})}><ChessPiece type={m.promotion!} player={game?.activePlayer??0}/>{promotions.some(other=>key(other.from)!==key(m.from))&&<span>{m.fromNotation}</span>}</Button>)}</div><PageControls page={promotionPage} total={Math.ceil(promotions.length/3)} onChange={setPromotionPage} label="Promotion choices"/>{cloud.error&&<p role="alert">{cloud.error}</p>}</DialogContent></Dialog>
 <Dialog open={resultOpen} onOpenChange={setResultOpen}><DialogContent className={styles.resultSheet}><DialogTitle className={styles.resultTitle}>{outcome.title}</DialogTitle><DialogDescription className={styles.resultScore}>{outcome.score}{outcome.detail&&<span>{outcome.detail}</span>}</DialogDescription><div className={styles.actions}><Button variant="ghost" onClick={()=>setResultOpen(false)}>View board</Button><Button disabled={cloud.busy} onClick={()=>void restart()}>Play again</Button></div></DialogContent></Dialog>
 </div>;
}
