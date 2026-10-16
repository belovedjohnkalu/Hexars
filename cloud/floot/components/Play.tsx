import { useEffect, useId, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, Undo2, Share2, Check } from "lucide-react";
import { AppHead } from "./AppHead";
import { Button } from "./Button";
import { Input } from "./Input";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./Dialog";
import type { ChessMove, Hex, VariantId } from "../endpoints/game_POST.schema";
import { useInstallApp } from "../helpers/useInstallApp";
import { useCloudGame } from "../helpers/useCloudGame";
import { useBoardFacing } from "../helpers/useBoardFacing";
import { gameSessions } from "../helpers/gameSessions";
import { publishedOrigin } from "../helpers/publishedOrigin";
import { CloudBoard } from "./CloudBoard";
import { ChessPiece } from "./ChessPiece";
import { InstallControl } from "./InstallControl";
import { HexLoading } from "./HexLoading";
import styles from "./Play.module.css";
const key=(hex:Hex)=>hex.q+","+hex.r;
export function Play({variant}:{variant:VariantId}){
  useInstallApp();const location=useLocation(),navigate=useNavigate(),group=useId();
  const defaultMode=new URLSearchParams(location.search).get("mode")==="friend"?"two_players":"engine";
  const cloud=useCloudGame(variant,defaultMode),data=cloud.data,game=data?.game,name=variant==="glinski"?"Gliński":"McCooey";
  const [selected,setSelected]=useState<Hex|null>(null),[menu,setMenu]=useState(false),[confirmNew,setConfirmNew]=useState(false),[mode,setMode]=useState<"engine"|"two_players">(defaultMode),[side,setSide]=useState<0|1>(0),[promotions,setPromotions]=useState<ChessMove[]>([]);
  const [copied,setCopied]=useState(false),[shareLink,setShareLink]=useState(""),[shareHelp,setShareHelp]=useState(false);
  const copiedTimer=useRef<ReturnType<typeof setTimeout>|null>(null),keepPlaying=useRef<HTMLButtonElement>(null),gameMenu=useRef<HTMLButtonElement>(null),newGameButton=useRef<HTMLButtonElement>(null),title=useRef<HTMLHeadingElement>(null);
  const ended=!!game&&game.result.status!=="ongoing",thinking=!!data&&data.mode==="engine"&&game?.activePlayer!==data.humanPlayer&&!ended;
  const facing=useBoardFacing(data?.gameId,game?.ply,data?.mode==="two_players"?game?.activePlayer===1:data?.humanPlayer===1);
  const canPlay=!!game&&!ended&&!cloud.busy&&!cloud.error&&!thinking&&!facing.turning;
  const candidates=game?.legalMoves.filter(move=>selected&&key(move.from)===key(selected))||[],lastMove=data?.moves.at(-1);
  const canUndo=!!data?.moves.length&&!cloud.busy&&!facing.turning&&(data.mode==="two_players"||data.moves.some(move=>move.player===data.humanPlayer));
  useEffect(()=>{setSelected(null);setPromotions([]);},[game?.stateId]);
  useEffect(()=>{title.current?.focus({preventScroll:true});},[variant]);
  useEffect(()=>{if(confirmNew)keepPlaying.current?.focus();},[confirmNew]);
  useEffect(()=>()=>{if(copiedTimer.current)clearTimeout(copiedTimer.current);},[]);
  function menuChange(open:boolean){if(cloud.busy&&confirmNew)return;if(open){setMode(data?.mode==="two_players"?"two_players":defaultMode==="two_players"&&!data?"two_players":"engine");setSide(data?.humanPlayer===1?1:0);setConfirmNew(false);}setMenu(open);}
  function chooseCell(hex:Hex){
    if(!canPlay||!game)return;const moves=candidates.filter(move=>key(move.to)===key(hex));
    if(moves.length>1){setPromotions(moves);return;}
    if(moves.length===1){const move=moves[0];setSelected(null);void cloud.play({from:move.from,to:move.to,...(move.promotion?{promotion:move.promotion}:{})});}
    else setSelected(selected&&key(selected)===key(hex)?null:game.board.cells.find(cell=>key(cell)===key(hex))?.piece?.player===game.activePlayer?hex:null);
  }
  async function start(){
    if(cloud.busy)return;
    if(await cloud.newGame(mode,side,variant)){setMenu(false);setConfirmNew(false);navigate("/"+variant+(mode==="two_players"?"?mode=friend":""),{replace:true});}
  }
  async function share(){
    if(!data)return;const url=new URL("/"+data.game.variant,publishedOrigin);url.hash=gameSessions.hash(data);setShareHelp(true);
    try{await navigator.clipboard.writeText(url.toString());setCopied(true);setShareLink("");if(copiedTimer.current)clearTimeout(copiedTimer.current);copiedTimer.current=setTimeout(()=>setCopied(false),2200);}catch{setShareLink(url.toString());}
  }
  let status=!game?"Opening…":ended?game.result.status==="draw"||(game.result.status==="stalemate"&&game.result.winner<0)?"Draw":game.result.status==="stalemate"?"Stalemate":data?.mode==="engine"?game.result.winner===data.humanPlayer?"You win":"Tactical wins":game.result.winner===0?"White wins":"Black wins":thinking?"Thinking…":game.check?"Check":data?.mode==="engine"?"Your turn":game.activePlayer===0?"White’s turn":"Black’s turn";
  if(cloud.error)status=game?"Connection lost":"Game unavailable";
  if(data&&data.game.variant!==variant)return <Navigate to={"/"+data.game.variant+"#"+gameSessions.hash(data)} replace/>;
  return <div className={styles.app}>
    <AppHead title={name+" · Hexagonal Chess"}/>
    <header className={styles.header}>
      <Button asChild variant="ghost" size="icon" className={styles.icon}><Link to="/?cloud=hexagonal-chess" state={{focusNode:"boards"}} onClick={event=>{if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&(location.state as {fromCloud?:string}|null)?.fromCloud==="hexagonal-chess"){event.preventDefault();navigate(-1);}}} aria-label="Back to Hexagonal Chess" title="Back"><ArrowLeft size={25} strokeWidth={1.6}/></Link></Button>
      <h1 ref={title} tabIndex={-1}>{name}</h1>
      <Button ref={gameMenu} variant="ghost" size="icon" className={styles.icon} aria-label="Game menu" title="Game menu" onClick={()=>menuChange(true)}><MoreHorizontal size={28}/></Button>
    </header>
    <main className={styles.main} aria-label={name+" game"}>
      <div className={styles.status} role="status" aria-live="polite"><span key={status}>{status}</span>{thinking&&<span className={styles.pulse} aria-hidden="true"/>}</div>
      <div className={styles.board}>
        {game?<CloudBoard key={data?.gameId} game={game} selected={selected} onCell={chooseCell} flipped={facing.flipped} coordinates={false} theme="grove" lastMove={lastMove} disabled={!canPlay}/>:<div className={styles.loading}><HexLoading/></div>}
      </div>
      {ended&&<p className={styles.result}>{game?.result.status==="checkmate"?"Checkmate":game?.result.status==="stalemate"&&variant==="glinski"?"¾–¼":"½–½"}</p>}
      {cloud.error&&!menu&&!promotions.length&&<div className={styles.recovery}><p role="alert">{cloud.error}</p><Button variant="outline" disabled={cloud.busy} onClick={()=>void cloud.refresh()}>Retry</Button></div>}
      <span className={styles.srOnly} data-ply={game?.ply??0}>{game?.ply??0} moves</span>
    </main>
    <Dialog open={menu} onOpenChange={menuChange}>
      <DialogContent className={styles.sheet} closeDisabled={confirmNew&&cloud.busy} onCloseAutoFocus={e=>{e.preventDefault();gameMenu.current?.focus({preventScroll:true});}} onEscapeKeyDown={e=>{if(confirmNew&&cloud.busy)e.preventDefault();}} onPointerDownOutside={e=>{if(confirmNew&&cloud.busy)e.preventDefault();}}>
        <DialogTitle className={styles.sheetTitle}>{confirmNew?"Start a new game?":"Hexagonal Chess"}</DialogTitle>
        <DialogDescription className={confirmNew?styles.description:styles.srOnly}>{confirmNew?"Your current board will be replaced.":"Game controls"}</DialogDescription>
        {confirmNew?<><div className={styles.confirmActions}><Button ref={keepPlaying} variant="ghost" disabled={cloud.busy} onClick={()=>{setConfirmNew(false);requestAnimationFrame(()=>newGameButton.current?.focus());}}>Keep playing</Button><Button disabled={cloud.busy} aria-busy={cloud.busy} onClick={()=>void start()}>{cloud.busy?"Opening…":"New game"}</Button></div>{cloud.error&&<p className={styles.error} role="alert">{cloud.error}</p>}</>:<>
          <div className={styles.tools}>
            <Button variant="ghost" aria-label="Undo" title={canUndo?"Undo last turn":"No move to undo yet"} disabled={!canUndo} onClick={()=>void cloud.undo().then(ok=>{if(ok)setMenu(false);})}><Undo2 size={24}/><span>Undo</span></Button>
            <Button variant="ghost" aria-label="Share" aria-describedby={shareHelp?"game-share-help":undefined} disabled={!data||cloud.busy} onClick={()=>void share()}>{copied?<Check size={24}/>:<Share2 size={24}/>}<span>{copied?"Copied":"Share"}</span></Button>
            <span className={styles.installSlot}><InstallControl text/></span>
          </div>
          {shareHelp&&<p id="game-share-help" className={styles.help} role="status">{copied?"Link copied. ":""}Anyone with the link can move pieces.</p>}
          {shareLink&&<Input className={styles.link} aria-label="Game link" readOnly value={shareLink} onFocus={event=>event.target.select()}/>}
          <nav className={styles.segmented} aria-label="Board">{(["glinski","mccooey"] as const).map(id=><Link key={id} to={"/"+id+(data?.mode==="two_players"?"?mode=friend":"")} aria-current={id===variant?"page":undefined}>{id==="glinski"?"Gliński":"McCooey"}</Link>)}</nav>
          <RadioGroup className={styles.segmented} aria-label="Opponent" value={mode} onValueChange={value=>setMode(value as "engine"|"two_players")}>
            {([{value:"engine",name:"Tactical"},{value:"two_players",name:"Pass & play"}] as const).map(item=><label key={item.value} className={styles.option} htmlFor={group+item.value}><RadioGroupItem id={group+item.value} className={styles.radioControl} value={item.value} aria-label={item.name}/><span>{item.name}</span></label>)}
          </RadioGroup>
          {mode==="engine"&&<RadioGroup className={styles.sides} aria-label="Your side" value={String(side)} onValueChange={value=>setSide(value==="1"?1:0)}>{([0,1] as const).map(player=><label key={player} className={styles.option} htmlFor={group+"side"+player}><RadioGroupItem id={group+"side"+player} className={styles.radioControl} value={String(player)} aria-label={player===0?"White":"Black"}/><span className={styles.smallPiece}><ChessPiece type="king" player={player}/></span><span>{player===0?"White":"Black"}</span></label>)}</RadioGroup>}
          <Button ref={newGameButton} className={styles.primary} disabled={cloud.busy} aria-busy={cloud.busy} onClick={()=>data?.moves.length?setConfirmNew(true):void start()}>{cloud.busy?"Opening…":"New game"}</Button>
          {cloud.error&&<p className={styles.error} role="alert">{cloud.error}</p>}
          <details className={styles.rules}><summary>Rules</summary><p>Tap a piece, then a marked hexagon.</p><p>{variant==="mccooey"?"Pawns capture through corners. Only unmoved pawns can advance twice; the center pawn cannot.":"Pawns capture to either forward side. A starting pawn cell allows a two-step advance."}</p><p>No castling. Promote at the far edge. En passant lasts one turn.</p><p>{variant==="mccooey"?"Stalemate: ½–½.":"Stalemate: ¾–¼."} This app also draws when each side has only a king, or a king and one bishop, knight or rook.</p></details>
        </>}
      </DialogContent>
    </Dialog>
    <Dialog open={promotions.length>0} onOpenChange={open=>{if(!open&&!cloud.busy)setPromotions([]);}}>
      <DialogContent className={styles.sheet} closeDisabled={cloud.busy} onCloseAutoFocus={e=>{e.preventDefault();document.querySelector<HTMLElement>('[data-cell][aria-pressed="true"]')?.focus({preventScroll:true});}}>
        <DialogTitle className={styles.sheetTitle}>Choose a piece</DialogTitle><DialogDescription className={styles.srOnly}>Promote your pawn.</DialogDescription>
        <div className={styles.promotions}>{promotions.map(move=><Button key={move.promotion} variant="secondary" aria-label={"Promote to "+move.promotion} disabled={cloud.busy} onClick={()=>void cloud.play({from:move.from,to:move.to,promotion:move.promotion}).then(ok=>{if(ok)setPromotions([]);})}><ChessPiece type={move.promotion!} player={game?.activePlayer??0}/></Button>)}</div>
        {cloud.error&&<p className={styles.error} role="alert">{cloud.error}</p>}
      </DialogContent>
    </Dialog>
  </div>;
}
