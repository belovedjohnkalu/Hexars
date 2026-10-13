import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Download,
  FlipVertical2,
  FolderOpen,
  Hexagon,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Share2,
  Undo2,
} from "lucide-react";
import { Button } from "../components/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/Dialog";
import { ChessPiece } from "../components/ChessPiece";
import { CloudBoard } from "../components/CloudBoard";
import { useCloudGame } from "../helpers/useCloudGame";
import { publishedOrigin } from "../helpers/publishedOrigin";
import { useInstallApp } from "../helpers/useInstallApp";
import type { ChessMove, Hex, VariantId } from "../endpoints/game_POST.schema";
import styles from "./_index.module.css";

const key = (hex: Hex) => `${hex.q},${hex.r}`;
const playStyles = [
  ["Tactical", "Looks for clever attacks.", "Ready to play"],
  ["Positional", "Builds a strong position, move by move.", "Coming later"],
  ["Defensive", "Keeps the king safe and meets your threats.", "Coming later"],
  ["Materialist", "Protects pieces and makes good trades.", "Coming later"],
  ["Unconventional", "Finds surprising ways to play.", "Coming later"],
  ["Universal", "Changes approach as the game changes.", "Coming later"],
];

type Sheet = "new" | "settings" | "rules" | "styles" | "install" | "open" | "about" | null;
export default function HEXARS() {
  const cloud = useCloudGame();
  const app = useInstallApp();
  const data = cloud.data;
  const game = data?.game;
  const [selected, setSelected] = useState<Hex | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [labels, setLabels] = useState(false);
  const [theme, setTheme] = useState("xenon");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [newMode, setNewMode] = useState<"engine" | "two_players">("engine");
  const [newVariant, setNewVariant] = useState<VariantId>("glinski");
  const [newSide, setNewSide] = useState<0 | 1>(0);
  const [promotions, setPromotions] = useState<ChessMove[]>([]);
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [savedLink, setSavedLink] = useState("");
  const lastSheet = useRef<Sheet>(null);
  if (sheet) lastSheet.current = sheet;
  const activeSheet = sheet || lastSheet.current;
  const lastPromotions = useRef<ChessMove[]>([]);
  if (promotions.length) lastPromotions.current = promotions;
  const visiblePromotions = promotions.length ? promotions : lastPromotions.current;
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ended = !!game && game.result.status !== "ongoing";
  const engineTurn =
    !!data && data.mode === "engine" && game?.activePlayer !== data.humanPlayer && !ended;
  const canPlay = !!game && !ended && !cloud.busy && !cloud.error && !engineTurn;
  const canUndo =
    !!data?.moves.length &&
    !cloud.busy &&
    (data.mode !== "engine" || data.moves.some((move) => move.player === data.humanPlayer));
  const selectedMoves =
    game?.legalMoves.filter((move) => selected && key(move.from) === key(selected)) || [];
  const lastMove = data?.moves.at(-1);
  const turn = game?.activePlayer === 0 ? "White" : "Black";

  useEffect(() => {
    document.title = "HEXARS — Chess, a little different";
  }, []);
  useEffect(() => {
    setSelected(null);
    setPromotions([]);
  }, [game?.stateId]);
  useEffect(() => {
    if (data?.mode === "engine") setFlipped(data.humanPlayer === 1);
  }, [data?.gameId]);
  useEffect(() => {
    if (data?.mode === "two_players" && !ended) setFlipped(game?.activePlayer === 1);
  }, [data?.gameId, data?.mode, game?.activePlayer, ended]);
  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  function openNew() {
    setNewMode(data?.mode === "two_players" ? "two_players" : "engine");
    setNewSide(data?.humanPlayer === 1 ? 1 : 0);
    setNewVariant(game?.variant ?? "glinski");
    setSheet("new");
  }
  async function startGame() {
    if (await cloud.newGame(newMode, newSide, newVariant)) setSheet(null);
  }
  function chooseCell(hex: Hex) {
    if (!game || !canPlay) return;
    const options = selectedMoves.filter((move) => key(move.to) === key(hex));
    if (options.length > 1) {
      setPromotions(options);
      return;
    }
    if (options.length === 1) {
      const move = options[0];
      setSelected(null);
      void cloud.play({
        from: move.from,
        to: move.to,
        ...(move.promotion ? { promotion: move.promotion } : {}),
      });
      return;
    }
    const cell = game.board.cells.find((cell) => key(cell) === key(hex));
    setSelected(cell?.piece?.player === game.activePlayer ? hex : null);
  }
  async function shareGame() {
    if (!data) return;
    const url = new URL(publishedOrigin);
    url.hash = new URLSearchParams({ game: data.gameId, key: data.accessToken }).toString();
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setShareLink("");
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareLink(url.toString());
    }
  }
  async function install() {
    if (app.canPrompt) { await app.install(); return; }
    if (app.canInstall) setSheet("install");
  }
  function player(player: number) {
    const computer = data?.mode === "engine" && player !== data.humanPlayer;
    const active = game?.activePlayer === player && !ended;
    return (
      <div className={styles.player}>
        <span
          className={`${styles.playerPiece} ${player === 0 ? styles.whitePiece : styles.blackPiece}`}
          aria-hidden="true"
        >
          <ChessPiece type="king" player={player} theme={theme} />
        </span>
        <span>
          <strong>
            {computer
              ? "Tactical"
              : data?.mode === "engine"
                ? "You"
                : player === 0
                  ? "White"
                  : "Black"}
          </strong>
          <small>{player === 0 ? "White" : "Black"}</small>
        </span>
        {active && (
          <span className={styles.playerTurn}>
            <i className={styles.turnDot} />
            {computer && cloud.busy ? "Thinking" : game?.check ? "King in danger" : "To move"}
          </span>
        )}
      </div>
    );
  }
  let status = !game
    ? "Opening your game"
    : ended
      ? (game.result.status === "draw" || (game.result.status === "stalemate" && game.result.winner < 0))
        ? "A draw."
        : game.result.status === "stalemate"
          ? "No moves left."
          : data?.mode === "engine"
            ? game.result.winner === data.humanPlayer
              ? "You win."
              : "Tactical wins."
            : `${game.result.winner === 0 ? "White" : "Black"} wins.`
      : engineTurn
        ? "Tactical is thinking"
        : data?.mode === "engine"
          ? "Your move."
          : `${turn} to move.`;
  let hint = !game
    ? "Just a moment."
    : ended
      ? game.result.status === "checkmate"
        ? "Checkmate. The king has no safe escape."
        : game.result.status === "stalemate"
          ? game.variant === "mccooey" ? "Stalemate. The next player has no move, and their king is safe. ½ point each." : "The player with no moves earns ¼; the other earns ¾."
          : game.result.reason === "Low-material house rule"
            ? "Automatic draw. Each side has at most one piece besides its king. ½ point each."
            : game.result.reason === "Insufficient material"
              ? "Only the kings remain. ½ point each."
              : game.result.reason === "Threefold repetition"
                ? "The same position appeared three times."
                : game.result.reason === "Fifty-move rule"
                  ? "No pawn move or capture for fifty turns."
                  : "Neither side can win from here."
      : game.check && !engineTurn
        ? "Your king is in danger. Move to safety."
        : engineTurn
          ? "Finding the next move."
          : selected
            ? `Choose a marked cell. ${new Set(selectedMoves.map((move) => key(move.to))).size} possible moves.`
            : "Tap a piece. Then tap a marked cell.";
  const titles: Record<Exclude<Sheet, null>, string> = {
    new: "A new game",
    settings: "Make it yours",
    rules: "How to play",
    styles: "Choose your opponent",
    install: "HEXARS, one tap away",
    open: "Continue a game",
    about: "A different kind of chess",
  };
  const descriptions: Record<Exclude<Sheet, null>, string> = {
    new: "Choose who to play with.",
    settings: "A few small things, just how you like them.",
    rules: "Familiar pieces. A board with more possibilities.",
    styles: "Six different ways to think about a move.",
    install: "Add HEXARS to your home screen.",
    open: "Paste a game link to pick up where you left off.",
    about: "A warm place to play. A little spark of possibility.",
  };

  return (
    <div className={styles.app}>
      <Helmet>
        <title>HEXARS — Chess, a little different</title>
        <meta
          name="description"
          content="A quiet place to play hexagonal chess. Play on your phone, share a game, and make yourself at home."
        />
        <meta name="theme-color" content="#111318" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="HEXARS" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="apple-touch-icon"
          href="/_cdn/static/bbff6547-57ce-49ce-8f0a-92ee7a03d999-hexars-dark-180.png"
        />
        <link
          rel="icon"
          href="/_cdn/static/f72178ec-847d-48d7-ada5-e64a1ed04bd4-hexars-dark-192.png"
        />
      </Helmet>
      <header className={styles.header}>
        <button
          className={styles.brand}
          onClick={() => setSheet("about")}
          aria-label="About HEXARS"
        >
          <span className={styles.mark}>
            <Hexagon size={24} strokeWidth={1.5} />
            <i />
          </span>
          HEXARS
        </button>
        <div className={styles.headerActions}>
          <button onClick={() => setSheet("rules")} aria-label="How to play">
            <BookOpen size={18} />
            <span>How to play</span>
          </button>
          <button
            className={styles.more}
            onClick={() => setSheet("settings")}
            aria-label="Settings"
          >
            <MoreHorizontal size={22} />
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <div className={styles.heading}>
          <button className={styles.variantButton} onClick={openNew} aria-label="Choose chess variant">
            {game?.variant === "mccooey" ? "McCooey’s chess" : "Gliński’s chess"}<ChevronRight size={12} />
          </button>
          <h1 role="status">
            <span className={styles.statusWord} key={status}>
              {status}
            </span>
            {(!game || engineTurn) && (
              <span className={styles.thinking} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            )}
          </h1>
        </div>
        {cloud.error && (
          <div className={styles.error} role="alert">
            <span>{cloud.error}</span>
            <button disabled={cloud.busy} onClick={() => void cloud.refresh()}>
              Try again
              <RefreshCw size={14} />
            </button>
          </div>
        )}
        <div className={styles.playArea}>
          <section className={styles.boardArea} aria-label="Chess game">
            {player(flipped ? 0 : 1)}
            <div className={styles.boardStage}>
              {game ? (
                <CloudBoard
                  game={game}
                  selected={selected}
                  onCell={chooseCell}
                  flipped={flipped}
                  coordinates={labels}
                  theme={theme}
                  lastMove={lastMove}
                  disabled={!canPlay}
                />
              ) : (
                <div className={styles.loading}>
                  <Hexagon size={54} strokeWidth={1} />
                  <span>Getting your board ready</span>
                </div>
              )}
            </div>
            {player(flipped ? 1 : 0)}
            <p className={styles.hint} aria-live="polite">
              {hint}
            </p>
            <div
              className={styles.moveKey}
              aria-label="Board outline colours"
              aria-hidden={!selected && !game?.check}
              style={{ opacity: selected || game?.check ? 1 : 0 }}
            >
              {[
                ["Move", "#76baff"],
                ["Capture", "#ffac79"],
                ["Check", "#ff718c"],
              ].map(([label, colour]) => (
                <span key={label}>
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <polygon
                      points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5"
                      fill="none"
                      stroke={colour}
                      strokeWidth="1.7"
                    />
                  </svg>
                  {label}
                </span>
              ))}
            </div>
            {ended && game?.result.status === "stalemate" && (
              <p className={styles.scores}>
                White {game.result.scores[0]} · Black {game.result.scores[1]}
              </p>
            )}
          </section>
          <aside className={styles.controls} aria-label="Game controls">
            <div className={styles.opponent}>
              <span className={styles.eyebrow}>
                {data?.mode === "two_players" ? "PLAYING TOGETHER" : "YOUR OPPONENT"}
              </span>
              <button
                onClick={() => (data?.mode === "two_players" ? openNew() : setSheet("styles"))}
              >
                <span>{data?.mode === "two_players" ? "A friend" : "Tactical"}</span>
                <ChevronRight size={17} />
              </button>
              <p>
                {data?.mode === "two_players"
                  ? "Share your game link to play together."
                  : "Looks for clever attacks."}
              </p>
            </div>
            <Button className={styles.newButton} disabled={cloud.busy} onClick={openNew}>
              <Plus size={17} />
              New game
            </Button>
            <div className={styles.quickActions}>
              <button disabled={!canUndo} onClick={() => void cloud.undo()}>
                <Undo2 size={18} />
                <span>Undo</span>
              </button>
              <button disabled={!data || cloud.busy} onClick={() => void shareGame()}>
                <span className={styles.shareIcon}>
                  {copied ? <Check size={18} /> : <Share2 size={18} />}
                </span>
                <span>{copied ? "Copied" : "Share game"}</span>
              </button>
              <button
                aria-label="Flip board"
                aria-pressed={flipped}
                onClick={() => setFlipped(!flipped)}
              >
                <FlipVertical2 size={18} />
                <span>Flip</span>
              </button>
            </div>
            {shareLink && (
              <label className={styles.field}>
                Copy this game link
                <input
                  readOnly
                  value={shareLink}
                  aria-label="Game link to copy"
                  onFocus={(event) => event.target.select()}
                />
              </label>
            )}
            <details className={styles.moves}>
              <summary>
                Moves{" "}
                <span>
                  {data?.moves.length || 0}
                  <ChevronRight size={14} />
                </span>
              </summary>
              <div aria-label="Played moves">
                {data?.moves.length ? (
                  Array.from({ length: Math.ceil(data.moves.length / 2) }, (_, index) => (
                    <div className={styles.moveRow} key={index}>
                      <span>{index + 1}.</span>
                      <span>{data.moves[index * 2]?.notation || "—"}</span>
                      <span>{data.moves[index * 2 + 1]?.notation || "—"}</span>
                    </div>
                  ))
                ) : (
                  <p>Your moves will appear here.</p>
                )}
              </div>
            </details>
            <p className={styles.saved}>
              {data ? (
                <>
                  <span className={styles.savedDot} />
                  Saved. Come back anytime.
                </>
              ) : (
                "Your game saves as you play."
              )}
            </p>
          </aside>
        </div>
      </main>
      <footer className={styles.footer}>
        <span>Make yourself at home.</span>
        <button onClick={() => (app.canInstall ? void install() : setSheet("about"))}>
          {app.canInstall ? "Add to home screen" : "About HEXARS"}
          <ArrowUpRight size={13} />
        </button>
      </footer>

      <Dialog
        open={sheet !== null}
        onOpenChange={(open) => {
          if (!open) setSheet(null);
        }}
      >
        <DialogContent key={activeSheet || "none"} className={styles.sheet}>
          <DialogHeader>
            <DialogTitle>{activeSheet ? titles[activeSheet] : "HEXARS"}</DialogTitle>
            <DialogDescription>{activeSheet ? descriptions[activeSheet] : ""}</DialogDescription>
          </DialogHeader>
          {activeSheet === "new" && (
            <div className={styles.sheetBody}>
              <label className={styles.field}>
                Chess variant
                <select aria-label="Chess variant" value={newVariant} onChange={(event) => setNewVariant(event.target.value as VariantId)}>
                  <option value="glinski">Gliński’s chess</option>
                  <option value="mccooey">McCooey’s chess</option>
                </select>
                <small>{newVariant === "mccooey" ? "Seven pawns. Diagonal captures. A fresh way to play." : "The original 91-cell game. Nine pawns per side."}</small>
              </label>
              <div className={styles.segmented} role="group" aria-label="Who to play">
                <button aria-pressed={newMode === "engine"} onClick={() => setNewMode("engine")}>
                  Play Tactical
                </button>
                <button
                  aria-pressed={newMode === "two_players"}
                  onClick={() => setNewMode("two_players")}
                >
                  Play a friend
                </button>
              </div>
              {newMode === "engine" ? (
                <fieldset className={styles.sideChoice}>
                  <legend>Your pieces</legend>
                  <label>
                    <input
                      type="radio"
                      name="side"
                      value="white"
                      checked={newSide === 0}
                      onChange={() => setNewSide(0)}
                    />
                    <span>
                      <ChessPiece type="king" player={0} theme={theme} />
                    </span>
                    <strong>White</strong>
                    <small>You go first</small>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="side"
                      value="black"
                      checked={newSide === 1}
                      onChange={() => setNewSide(1)}
                    />
                    <span>
                      <ChessPiece type="king" player={1} theme={theme} />
                    </span>
                    <strong>Black</strong>
                    <small>Tactical goes first</small>
                  </label>
                </fieldset>
              ) : (
                <p className={styles.sheetNote}>
                  Take turns on this device, or share the game link with a friend. Anyone with the
                  link can move either colour. The board turns to face the next player.
                </p>
              )}
              <Button
                className={styles.fullButton}
                disabled={cloud.busy}
                onClick={() => void startGame()}
              >
                {cloud.busy ? "Getting ready…" : "Start playing"}
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
          {activeSheet === "settings" && (
            <div className={styles.sheetBody}>
              <div className={styles.settingRow}>
                <label htmlFor="board-colour">Board colour</label>
                <select
                  id="board-colour"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value)}
                >
                  <option value="xenon">Xenon · cool blue</option>
                  <option value="adobe">Adobe · warm clay</option>
                  <option value="hearth">Hearth · soft stone</option>
                </select>
              </div>
              <div className={styles.settingRow}>
                <label htmlFor="board-labels">
                  Show board labels<small>Letters and numbers for each cell</small>
                </label>
                <input
                  id="board-labels"
                  className={styles.toggle}
                  type="checkbox"
                  role="switch"
                  checked={labels}
                  onChange={(event) => setLabels(event.target.checked)}
                />
              </div>
              <div className={styles.settingLinks}>
                <button onClick={() => setSheet("styles")}>
                  <Hexagon size={18} />
                  <span>Playing styles</span>
                  <ChevronRight size={16} />
                </button>
                <button disabled={cloud.busy} onClick={() => setSheet("open")}>
                  <FolderOpen size={18} />
                  <span>Continue another game</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  disabled={cloud.busy || !data}
                  onClick={() => {
                    void cloud.refresh();
                    setSheet(null);
                  }}
                >
                  <RefreshCw size={18} />
                  <span>Refresh game</span>
                  <ChevronRight size={16} />
                </button>
                {app.canInstall && (
                  <button onClick={() => void install()}>
                    <Download size={18} />
                    <span>Add to home screen</span>
                    <ChevronRight size={16} />
                  </button>
                )}
                <button onClick={() => setSheet("about")}>
                  <span className={styles.miniMark}>◇</span>
                  <span>About HEXARS</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
          {activeSheet === "styles" && (
            <div className={styles.stylesList}>
              {playStyles.map(([name, description, availability], index) => (
                <button
                  key={name}
                  disabled={index !== 0}
                  onClick={() => setSheet(null)}
                  className={index === 0 ? styles.selectedStyle : ""}
                >
                  <span>
                    <strong>{name}</strong>
                    <small>{description}</small>
                  </span>
                  <span>{index === 0 ? <Check size={19} /> : <small>{availability}</small>}</span>
                </button>
              ))}
              <p className={styles.sheetNote}>
                Tactical is ready now. Five more personalities are on the way.
              </p>
            </div>
          )}
          {activeSheet === "install" && app.canInstall && (
            <div className={styles.sheetBody}>
              <div className={styles.appPreview}>
                <span className={styles.appIcon}>
                  <Hexagon size={38} strokeWidth={1.3} />
                  <i />
                </span>
                <strong>HEXARS</strong>
              </div>
              {app.platform === "ios" ? (
                <ol className={styles.instructions}>
                  <li>
                    Open this page in <strong>Safari</strong>.
                  </li>
                  <li>
                    Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>.
                  </li>
                  <li>
                    Tap <strong>Add</strong>. Your new icon is ready.
                  </li>
                </ol>
              ) : app.platform === "android" ? (
                <ol className={styles.instructions}>
                  <li>
                    Open this page in <strong>Chrome</strong>.
                  </li>
                  <li>
                    Tap the <strong>⋮ menu</strong> → <strong>Install app</strong>.
                  </li>
                  <li>
                    If you see <strong>Add to Home screen</strong>, choose that.
                  </li>
                </ol>
              ) : (
                <p className={styles.sheetNote}>
                  <strong>iPhone:</strong> Safari → Share → Add to Home Screen.
                  <br />
                  <br />
                  <strong>Android:</strong> Chrome → ⋮ → Install app.
                  <br />
                  <br />
                  <strong>Computer:</strong> use your browser’s install button.
                </p>
              )}
              <p className={styles.sheetNote}>
                You’ll need an internet connection to play. To bring a game into the app, copy its
                link, then choose Settings → Continue another game.
              </p>
            </div>
          )}
          {activeSheet === "open" && (
            <div className={styles.sheetBody}>
              <label className={styles.field}>
                Game link
                <input
                  type="url"
                  aria-label="Saved game link"
                  placeholder="Paste your game link"
                  value={savedLink}
                  onChange={(event) => setSavedLink(event.target.value)}
                />
              </label>
              <Button
                className={styles.fullButton}
                disabled={cloud.busy || !savedLink.trim()}
                onClick={async () => {
                  if (await cloud.openGame(savedLink)) {
                    setSheet(null);
                    setSavedLink("");
                  }
                }}
              >
                {cloud.busy ? "Opening…" : "Continue playing"}
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
          {activeSheet === "rules" && (
            <div className={styles.rules}>
              <p>
                {game?.variant === "mccooey" ? "McCooey’s chess. Seven pawns per side." : "Gliński’s chess. Nine pawns per side."}
                {" "}Tap one of your pieces. The marked cells show where it can go. Tap a mark to move.
              </p>
              <div>
                <strong>Rook</strong>
                <p>Moves in straight lines through the sides of the hexagons.</p>
              </div>
              <div>
                <strong>Bishop</strong>
                <p>Moves through the corners. It stays on the same colour.</p>
              </div>
              <div>
                <strong>Queen & king</strong>
                <p>The queen combines both paths. The king takes one step along either.</p>
              </div>
              <div>
                <strong>Knight</strong>
                <p>Jumps over pieces. Select it to see its twelve possible directions.</p>
              </div>
              <div>
                <strong>Pawn</strong>
                <p>
                  {game?.variant === "mccooey"
                    ? "Moves one cell forward and captures along the forward bishop diagonals. On its first move, a pawn can advance two cells if the path is clear. The center pawn can only advance one. At the far edge, choose a new piece."
                    : "Moves forward and captures to either forward side. From any of your original pawn cells, it can move two steps if the path is clear. At the far edge, choose a new piece."}
                </p>
              </div>
              <div>
                <strong>Protect your king</strong>
                <p>
                  Check means the king is threatened. Checkmate means there’s no safe escape.
                  There’s no castling—the usual king-and-rook move—in this game.
                </p>
              </div>
              <details>
                <summary>A few special rules</summary>
                <p>
                  HEXARS automatic draw: if each side has only its king and, at most, one bishop,
                  knight, or rook, the game ends with ½ point each. Bare kings also draw. Pawns,
                  queens, or a second piece keep the game going. A checkmate already delivered wins.
                </p>
                <p>
                  En passant: after a pawn moves two steps, an enemy pawn may capture it as if it
                  moved one. This is only available on the very next turn.
                </p>
                <p>
                  {game?.variant === "mccooey"
                    ? "Stalemate: if a player has no legal moves but their king is safe, both players earn ½ point."
                    : "Stalemate: if a player has no legal moves but the king is safe, they earn ¼ point and the other player earns ¾."}
                  {" "}Repeated positions and fifty turns without a pawn move or capture are draws.
                </p>
              </details>
            </div>
          )}
          {activeSheet === "about" && (
            <div className={styles.sheetBody}>
              <div className={styles.aboutWords}>
                {["Hearth", "Embers", "Xenon", "Adobe", "Rhombus", "Sleek"].map((word, index) => (
                  <span key={word}>
                    <b>{word[0]}</b>
                    {word.slice(1)}
                    <small>
                      {
                        [
                          "A place to feel at home.",
                          "A spark of curiosity.",
                          "A cool, clear perspective.",
                          "Warmth in the details.",
                          "A different angle.",
                          "Less, beautifully.",
                        ][index]
                      }
                    </small>
                  </span>
                ))}
              </div>
              <p className={styles.sheetNote}>
                HEXARS offers Gliński’s and McCooey’s hexagonal chess. Four more chess variants and five more
                playing styles are on the way.
              </p>
            </div>
          )}
          {(activeSheet === "new" || activeSheet === "open") && cloud.error && (
            <p className={styles.sheetError} role="alert">
              {cloud.error}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={promotions.length > 0}
        onOpenChange={(open) => {
          if (!open) setPromotions([]);
        }}
      >
        <DialogContent className={styles.sheet}>
          <DialogHeader>
            <DialogTitle>Choose a new piece</DialogTitle>
            <DialogDescription>
              Your pawn has reached the far edge. What would you like it to become?
            </DialogDescription>
          </DialogHeader>
          <div className={styles.promotion}>
            {visiblePromotions.map((move) => (
              <button
                key={move.promotion}
                onClick={() => {
                  setPromotions([]);
                  setSelected(null);
                  void cloud.play({ from: move.from, to: move.to, promotion: move.promotion });
                }}
              >
                <span>
                  <ChessPiece
                    type={move.promotion!}
                    player={game?.activePlayer ?? 0}
                    theme={theme}
                  />
                </span>
                <strong>{move.promotion![0].toUpperCase() + move.promotion!.slice(1)}</strong>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
