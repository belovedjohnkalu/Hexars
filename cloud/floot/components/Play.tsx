import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { AppHead } from "./AppHead";
import { Button } from "./Button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./Dialog";
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
import styles from "./Play.module.css";
const moveInput=(m:ChessMove)=>({from:m.from,to:m.to,...(m.promotion?{promotion:m.promotion}:{}),...(m.pass?{pass:true as const}:{})});
const key=(h:Hex)=>h.q+','+h.r;
export function Play({variant}:{variant:VariantId}){
 useInstallApp();const location=useLocation(),navigate=useNavigate();
 const mode=new URLSearchParams(location.search).get('mode')==='friend'?'two_players':'engine';
 const rawLevel=new URLSearchParams(location.search).get('level');const value=Number(rawLevel??3),difficulty=Number.isInteger(value)&&value>=0&&value<=5?value:3;
 const cloud=useCloudGame(variant,mode,difficulty),data=cloud.data,game=data?.game;
 const [selected,setSelected]=useState<Hex|null>(null),[promotions,setPromotions]=useState<ChessMove[]>([]),[reset,setReset]=useState(false),[resultOpen,setResultOpen]=useState(false);
 const [promotionPage,setPromotionPage]=useState(0);
 useEffect(()=>setPromotionPage(0),[promotions]);
 const [review,setReview]=useState<{ply:number;game:GameView}|null>(null),[reviewBusy,setReviewBusy]=useState(false),[reviewError,setReviewError]=useState('');
 const [size,setSize]=useState({width:390,height:650}),[measured,setMeasured]=useState(false),area=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null),keep=useRef<HTMLButtonElement>(null),endKey=useRef('');
 const desired=useRef<number|null>(null),sequence=useRef(0),reviewAbort=useRef<AbortController|null>(null),swipe=useRef<{x:number;y:number;dragged:boolean}|null>(null),suppressClick=useRef(false);
 const shown=review?.game||(game?previewMove(game,cloud.pendingMove):undefined),ended=!!game&&game.result.status!=='ongoing',thinking=!!data&&data.mode==='engine'&&game?.activePlayer!==data.humanPlayer&&!ended;
 const facingPlayer=data?.mode==='two_players'?game?.activePlayer??0:data?.humanPlayer??0;
 const facing=useBoardFacing(data?.gameId,game?.ply,variant==='wellisch'?-120*facingPlayer:facingPlayer===1);
 const selectedGame=!!gameSessions.fromHash()||!!data&&data.mode===mode&&(mode==='two_players'||data.difficulty===difficulty);
 const canPlay=selectedGame&&!!game&&!ended&&!cloud.busy&&!cloud.error&&!thinking&&!facing.turning&&!review&&!reviewBusy;
 const candidates=game?.legalMoves.filter(m=>selected&&key(m.from)===key(selected))||[];
 const canUndo=selectedGame&&!!data?.moves.length&&!cloud.busy&&!facing.turning&&!review&&(data.mode==='two_players'||data.moves.some(m=>m.player===data.humanPlayer));
 const name=chessVariants.name(variant)+'’s Variant';
 useEffect(()=>{const el=area.current;if(!el)return;const observer=new ResizeObserver(()=>{setSize({width:el.clientWidth,height:Math.max(1,el.clientHeight)});setMeasured(true);});observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[variant]);
 useEffect(()=>{setSelected(null);setPromotions([]);},[game?.stateId]);
 useEffect(()=>{setSelected(null);setPromotions([]);setReset(false);setResultOpen(false);endKey.current='';setReview(null);desired.current=null;reviewAbort.current?.abort();setReviewBusy(false);setReviewError('');},[data?.gameId]);
 useEffect(()=>{if(game?.variant==='wellisch'&&canPlay&&game.legalMoves.length&&game.legalMoves.every(m=>m.promotion&&key(m.from)===key(m.to)))setPromotions(game.legalMoves);},[game?.stateId,canPlay,data?.gameId]);
 useEffect(()=>{if(!ended||!data||!game)return;const id=data.gameId+':'+game.stateId;if(endKey.current!==id){endKey.current=id;setResultOpen(true);}},[ended,data?.gameId,game?.stateId]);
 useEffect(()=>()=>reviewAbort.current?.abort(),[]);
 function choose(hex:Hex){if(!canPlay||!game)return;const moves=candidates.filter(m=>key(m.to)===key(hex));if(moves.length>1){setPromotions(moves);return;}if(moves.length===1){setSelected(null);void cloud.play(moveInput(moves[0]));}else setSelected(selected&&key(selected)===key(hex)?null:game.board.cells.find(c=>key(c)===key(hex))?.piece?.player===game.activePlayer?hex:null);}
 async function history(ply:number){
  if(!data||!game)return;ply=Math.max(0,Math.min(game.ply,ply));desired.current=ply;setSelected(null);reviewAbort.current?.abort();const seq=++sequence.current;
  if(ply===game.ply){setReview(null);desired.current=null;setReviewBusy(false);setReviewError('');return;}
  const controller=new AbortController();reviewAbort.current=controller;setReviewBusy(true);setReviewError('');
  try{const result=await postGame({action:'review',gameId:data.gameId,accessToken:data.accessToken,ply},{signal:controller.signal});if(seq===sequence.current)setReview({ply,game:result.game});}
  catch(e){if(!controller.signal.aborted){setReviewError('Couldn’t load that move. Try again.');desired.current=review?.ply??null;}}
  finally{if(seq===sequence.current)setReviewBusy(false);}
 }
 function down(e:PointerEvent<HTMLDivElement>){if(e.button!==0)return;suppressClick.current=false;swipe.current={x:e.clientX,y:e.clientY,dragged:false};}
 function move(e:PointerEvent<HTMLDivElement>){const start=swipe.current;if(start&&Math.abs(e.clientX-start.x)>40&&Math.abs(e.clientY-start.y)<Math.abs(e.clientX-start.x)*.6){start.dragged=true;suppressClick.current=true;e.currentTarget.setPointerCapture(e.pointerId);}}
 function up(e:PointerEvent<HTMLDivElement>){const start=swipe.current;swipe.current=null;if(start?.dragged){void history((desired.current??game?.ply??0)+(e.clientX>start.x?-1:1));}if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}
 async function restart(){if(await cloud.newGame(data?.mode==='two_players'?'two_players':'engine',(data?.humanPlayer===1?1:0),variant)){setReset(false);setResultOpen(false);setReview(null);}}
 const layout=boardLayout(shown?.board.cells??[],shown?.board.orientation);
 const {boardWidth,worldWidth,worldHeight,boardY,actions}=gameCloudLayout(size.width,size.height,layout.width/layout.height);
 const side=game?.activePlayer===0?'White':game?.activePlayer===2?'Gold':'Black';
 const status=review?`Move ${review.ply} of ${game?.ply}`:!game?cloud.missing?'Game expired':'Opening…':ended?'Game over':cloud.pendingMove?'Moving…':thinking?(variant==='wellisch'?`Tactical · ${side}`:'Thinking…'):game.check?(variant==='wellisch'?`${side} · Check`:'Check'):data?.mode==='two_players'?side+'’s turn':'Your turn';
 const outcome=game?gameOutcome(game.result,data?.mode||'two_players',data?.humanPlayer??0):{title:'Draw',score:'½ – ½',detail:''};
 return <div className={styles.app}><AppHead title={name+' · Hexagonal Chess'}/>
 <header className={styles.header}><h1 ref={heading} tabIndex={-1}>{name}</h1><div className={styles.status} data-three-players={variant==='wellisch'} role="status" aria-live="polite">{status}{thinking&&<Spinner size="sm" aria-label="Tactical is thinking"/>}{canPlay&&game?.legalMoves[0]?.pass&&<Button variant="ghost" onClick={()=>void cloud.play(moveInput(game.legalMoves[0]))}>Pass</Button>}</div></header>
 <main ref={area} className={styles.space} aria-label={name+' game'}><SpatialViewport width={worldWidth} height={worldHeight} viewKey={'game-'+variant} label="Board space" ready={measured&&!!shown} refitKey={size.width+":"+size.height}>
 <nav className={styles.words} aria-label="Game actions" style={{width:worldWidth,height:worldHeight}}>
 <Button asChild variant="ghost" className={styles.word} style={{...actions.variants,color:'var(--word-cyan)'}}><Link to="/?cloud=boards">Variants</Link></Button>
 <Button asChild variant="ghost" className={styles.word} style={{...actions.rules,color:'var(--word-amber)'}}><Link to={'/?cloud=rules&return='+variant+'&mode='+(data?.mode==='two_players'?'friend':'engine')+'&level='+(data?.difficulty??difficulty)}>Rules</Link></Button>
 <Button asChild variant="ghost" className={styles.word} style={{...actions.engines,color:'var(--word-coral)'}}><Link to={'/?cloud=engines&return='+variant+'&mode='+(data?.mode==='two_players'?'friend':'engine')+'&level='+(data?.difficulty??difficulty)}>Engines</Link></Button>
 <Button asChild variant="ghost" className={styles.word} style={{...actions.friend,color:'var(--word-mint)'}}><Link to={'/'+variant+'?mode=friend'} aria-current={data?.mode==='two_players'?'page':undefined} onClick={()=>{try{localStorage.removeItem('ion.engine');}catch{}}}>Pass and Play</Link></Button>
 <Button variant="ghost" className={styles.word+' '+styles.secondaryWord} style={{...actions.reset}} disabled={cloud.busy} onClick={()=>game?.ply?setReset(true):void restart()}>Board Reset</Button>
 <Button variant="ghost" className={styles.word+' '+styles.secondaryWord} style={{...actions.undo}} disabled={!canUndo} onClick={()=>void cloud.undo()}>Undo</Button>
 </nav>
 <div data-no-pan className={styles.board} data-pending-move={!!cloud.pendingMove} style={{width:boardWidth,left:(worldWidth-boardWidth)/2,top:boardY}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{swipe.current=null;}} onClickCapture={e=>{if(suppressClick.current){e.preventDefault();e.stopPropagation();suppressClick.current=false;}}}>
 {shown?<CloudBoard key={data?.gameId} game={shown} selected={review?null:selected} onCell={choose} flipped={facing.flipped} rotation={variant==='wellisch'?facing.rotation:undefined} coordinates={false} theme="neutral" lastMove={cloud.pendingMove??data?.moves[(review?.ply??game?.ply??0)-1]} disabled={!canPlay}/>:<div className={styles.loading}>{!cloud.error&&<Spinner aria-label="Opening board"/>}</div>}
 </div>
 </SpatialViewport></main>
 {(review||reviewBusy)&&<div className={styles.history} role="group" aria-label="Move history"><Button variant="ghost" size="icon" aria-label="Previous move" disabled={(desired.current??review?.ply??0)<=0} onClick={()=>void history((desired.current??review?.ply??0)-1)}><ChevronLeft size={18}/></Button><Button variant="ghost" disabled={reviewBusy} onClick={()=>void history(game?.ply??0)}>{reviewBusy?'Opening…':'Present'}</Button><Button variant="ghost" size="icon" aria-label="Next move" onClick={()=>void history((desired.current??review?.ply??0)+1)}><ChevronRight size={18}/></Button></div>}
 {(cloud.error||reviewError)&&<div role="alert" className={styles.error}>{cloud.error||reviewError}<Button variant="link" onClick={()=>cloud.missing?void restart():cloud.error?void cloud.refresh():void history(desired.current??review?.ply??game?.ply??0)}>{cloud.missing?'New game':'Retry'}</Button></div>}
 <footer className={styles.footer}><Button asChild variant="ghost" size="icon"><Link to="/?cloud=boards" aria-label="Back to variants"><ArrowLeft size={22}/></Link></Button></footer><span className={styles.srOnly} data-ply={game?.ply??0} data-review-ply={review?.ply??'present'}>{game?.ply??0} moves</span>
 <Dialog open={reset} onOpenChange={open=>{if(!cloud.busy)setReset(open);}}><DialogContent closeDisabled={cloud.busy} className={styles.sheet} onOpenAutoFocus={e=>{e.preventDefault();keep.current?.focus();}}><DialogTitle>Reset the board?</DialogTitle><DialogDescription>Your current game will be replaced.</DialogDescription><div className={styles.actions}><Button ref={keep} variant="ghost" disabled={cloud.busy} onClick={()=>setReset(false)}>Keep playing</Button><Button disabled={cloud.busy} onClick={()=>void restart()}>{cloud.busy?'Opening…':'Reset board'}</Button></div>{cloud.error&&<p role="alert">{cloud.error}</p>}</DialogContent></Dialog>
 <Dialog open={!!promotions.length} onOpenChange={open=>{if(!open&&!cloud.busy)setPromotions([]);}}><DialogContent closeDisabled={cloud.busy} className={styles.sheet}><DialogTitle>Promote</DialogTitle><DialogDescription>Choose your piece.</DialogDescription><div className={styles.promotions}>{promotions.slice(promotionPage*3,promotionPage*3+3).map(m=><Button key={key(m.from)+'-'+m.promotion} variant="ghost" aria-label={'Promote '+(m.fromNotation?m.fromNotation+' ':'')+'to '+m.promotion} disabled={cloud.busy} onClick={()=>void cloud.play(moveInput(m)).then(ok=>{if(ok)setPromotions([]);})}><ChessPiece type={m.promotion!} player={game?.activePlayer??0}/>{promotions.some(other=>key(other.from)!==key(m.from))&&<span>{m.fromNotation}</span>}</Button>)}</div><PageControls page={promotionPage} total={Math.ceil(promotions.length/3)} onChange={setPromotionPage} label="Promotion choices"/>{cloud.error&&<p role="alert">{cloud.error}</p>}</DialogContent></Dialog>
 <Dialog open={resultOpen} onOpenChange={setResultOpen}><DialogContent className={styles.resultSheet}><DialogTitle className={styles.resultTitle}>{outcome.title}</DialogTitle><DialogDescription className={styles.resultScore}>{outcome.score}{outcome.detail&&<span>{outcome.detail}</span>}</DialogDescription><div className={styles.actions}><Button variant="ghost" onClick={()=>setResultOpen(false)}>View board</Button><Button disabled={cloud.busy} onClick={()=>void restart()}>Play again</Button></div></DialogContent></Dialog>
 </div>;
}
