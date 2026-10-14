import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AppHead } from "./AppHead";
import { ArrowLeft, MoreHorizontal, Undo2, Share2, Check } from "lucide-react";
import type { ChessMove, Hex, VariantId } from "../endpoints/game_POST.schema";
import { useInstallApp } from "../helpers/useInstallApp";
import { useCloudGame } from "../helpers/useCloudGame";
import { gameSessions } from "../helpers/gameSessions";
import { publishedOrigin } from "../helpers/publishedOrigin";
import { CloudBoard } from "./CloudBoard";
import { ChessPiece } from "./ChessPiece";
import { InstallControl } from "./InstallControl";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./Dialog";
import styles from "./Play.module.css";
const key = (hex: Hex) => `${hex.q},${hex.r}`;
export function Play({ variant }: { variant: VariantId }) {
  useInstallApp(); // Capture browser offers even while the menu is closed.
  const cloud = useCloudGame(variant), data = cloud.data, game = data?.game;
  const name = variant === "glinski" ? "Gliński" : "McCooey";
  const [selected, setSelected] = useState<Hex | null>(null);
  const [menu, setMenu] = useState(false);
  const [mode, setMode] = useState<"engine" | "two_players">("engine");
  const [side, setSide] = useState<0 | 1>(0);
  const [promotions, setPromotions] = useState<ChessMove[]>([]);
  const [copied, setCopied] = useState(false), [shareLink, setShareLink] = useState("");
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ended = !!game && game.result.status !== "ongoing";
  const thinking = !!data && data.mode === "engine" && game?.activePlayer !== data.humanPlayer && !ended;
  const canPlay = !!game && !ended && !cloud.busy && !cloud.error && !thinking;
  const flipped = data?.mode === "two_players" ? game?.activePlayer === 1 : data?.humanPlayer === 1;
  const candidates = game?.legalMoves.filter(move => selected && key(move.from) === key(selected)) || [];
  const lastMove = data?.moves.at(-1);
  const canUndo = !!data?.moves.length && !cloud.busy && (data.mode === "two_players" || data.moves.some(move => move.player === data.humanPlayer));
  useEffect(() => { setSelected(null); setPromotions([]); }, [game?.stateId]);
  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);
  function chooseCell(hex: Hex) {
    if (!canPlay || !game) return;
    const moves = candidates.filter(move => key(move.to) === key(hex));
    if (moves.length > 1) { setPromotions(moves); return; }
    if (moves.length === 1) {
      const move = moves[0]; setSelected(null);
      void cloud.play({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) });
    } else {
      setSelected(game.board.cells.find(cell => key(cell) === key(hex))?.piece?.player === game.activePlayer ? hex : null);
    }
  }
  async function share() {
    if (!data) return;
    const url = new URL(`/${data.game.variant}`, publishedOrigin);
    url.hash = gameSessions.hash(data);
    try {
      await navigator.clipboard.writeText(url.toString()); setCopied(true); setShareLink("");
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2200);
    } catch { setShareLink(url.toString()); }
  }
  let status = !game ? "Opening…" : ended
    ? game.result.status === "draw" || (game.result.status === "stalemate" && game.result.winner < 0) ? "Draw"
      : game.result.status === "stalemate" ? "Stalemate"
        : data?.mode === "engine" ? game.result.winner === data.humanPlayer ? "You win" : "Tactical wins"
          : game.result.winner === 0 ? "White wins" : "Black wins"
    : thinking ? "Thinking…" : game.check ? "Check"
      : data?.mode === "engine" ? "Your turn" : game.activePlayer === 0 ? "White" : "Black";
  if (cloud.error) status = game ? "Connection lost" : "Game unavailable";
  if (data && data.game.variant !== variant) return <Navigate to={`/${data.game.variant}#${gameSessions.hash(data)}`} replace />;
  return <div className={styles.app}>
    <AppHead title={`${name} · HEXARS`} />
    <header className={styles.header}>
      <Link to="/" className={styles.icon} aria-label="Home" title="Home"><ArrowLeft size={26} strokeWidth={1.6} /></Link>
      <h1>{name}</h1>
      <button className={styles.icon} aria-label="Game menu" title="Game menu" onClick={() => { setMode(data?.mode === "two_players" ? "two_players" : "engine"); setSide(data?.humanPlayer === 1 ? 1 : 0); setMenu(true); }}><MoreHorizontal size={28} /></button>
    </header>
    <main className={styles.main}>
      <div className={styles.status} role="status" aria-live="polite">{status}{thinking && <span className={styles.pulse} aria-hidden="true" />}</div>
      <div className={styles.board}>
        {game ? <CloudBoard game={game} selected={selected} onCell={chooseCell} flipped={flipped} coordinates={false} theme="grove" lastMove={lastMove} disabled={!canPlay} /> : <div className={styles.loading} />}
      </div>
      {ended && <p className={styles.result}>{game?.result.status === "checkmate" ? "Checkmate" : game?.result.status === "stalemate" && variant === "glinski" ? "¾–¼" : "½–½"}</p>}
      {cloud.error && <button className={styles.retry} onClick={() => void cloud.refresh()} disabled={cloud.busy}>Retry</button>}
      <span className={styles.srOnly} data-ply={game?.ply ?? 0}>{game?.ply ?? 0} moves</span>
    </main>
    <Dialog open={menu} onOpenChange={setMenu}>
      <DialogContent className={styles.sheet}>
        <DialogTitle className={styles.sheetTitle}>Play</DialogTitle>
        <DialogDescription className={styles.srOnly}>Game controls</DialogDescription>
        <div className={styles.tools}>
          <button aria-label="Undo" disabled={!canUndo} onClick={() => { void cloud.undo(); setMenu(false); }}><Undo2 size={25} /><span>Undo</span></button>
          <button aria-label="Share" disabled={!data || cloud.busy} onClick={() => void share()}>{copied ? <Check size={25} /> : <Share2 size={25} />}<span>{copied ? "Copied" : "Share"}</span></button>
          <InstallControl text />
        </div>
        {shareLink && <input className={styles.link} aria-label="Game link" readOnly value={shareLink} onFocus={event => event.target.select()} />}
        <div className={styles.segmented} role="group" aria-label="Opponent">
          <button aria-pressed={mode === "engine"} onClick={() => setMode("engine")}>Tactical</button>
          <button aria-pressed={mode === "two_players"} onClick={() => setMode("two_players")}>Friend</button>
        </div>
        {mode === "engine" && <fieldset className={styles.sides}>
          <legend className={styles.srOnly}>Your side</legend>
          {([0,1] as const).map(player => <label key={player}>
            <input type="radio" name="side" value={player === 0 ? "white" : "black"} checked={side === player} onChange={() => setSide(player)} />
            <span><ChessPiece type="king" player={player} /></span>{player === 0 ? "White" : "Black"}
          </label>)}
        </fieldset>}
        <button className={styles.primary} disabled={cloud.busy} onClick={() => void cloud.newGame(mode, side, variant).then(ok => { if (ok) setMenu(false); })}>New game</button>
        <details className={styles.rules}>
          <summary>Rules</summary>
          <p>Tap a piece, then a marked hexagon.</p>
          <p>{variant === "mccooey" ? "Pawns capture through corners. Only unmoved pawns can advance twice; the center pawn cannot." : "Pawns capture to either forward side. A starting pawn cell allows a two-step advance."}</p>
          <p>No castling. Promote at the far edge. En passant lasts one turn.</p>
          <p>{variant === "mccooey" ? "Stalemate: ½–½." : "Stalemate: ¾–¼."} Bare kings, or a king with at most one bishop, knight or rook per side: ½–½. Pawns, queens or extra pieces keep play going.</p>
        </details>
      </DialogContent>
    </Dialog>
    <Dialog open={promotions.length > 0} onOpenChange={open => { if (!open) setPromotions([]); }}>
      <DialogContent className={styles.sheet}>
        <DialogTitle className={styles.sheetTitle}>Promote</DialogTitle><DialogDescription className={styles.srOnly}>Choose a piece</DialogDescription>
        <div className={styles.promotions}>{promotions.map(move => <button key={move.promotion} aria-label={`Promote to ${move.promotion}`} onClick={() => { setPromotions([]); void cloud.play({ from: move.from, to: move.to, promotion: move.promotion }); }}>
          <ChessPiece type={move.promotion!} player={game?.activePlayer ?? 0} />
        </button>)}</div>
      </DialogContent>
    </Dialog>
  </div>;
}
