import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import {
  BookOpen,
  Check,
  ChevronRight,
  Cloud,
  Cpu,
  Download,
  FlipVertical2,
  FolderOpen,
  Grid2X2,
  Hexagon,
  Link2,
  Plus,
  RefreshCw,
  Smartphone,
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
import { CloudBoard } from "../components/CloudBoard";
import { useCloudGame } from "../helpers/useCloudGame";
import { publishedOrigin } from "../helpers/publishedOrigin";
import { useInstallApp } from "../helpers/useInstallApp";
import type { ChessMove, Hex } from "../endpoints/game_POST.schema";
import styles from "./_index.module.css";

const key = (hex: Hex) => `${hex.q},${hex.r}`;
const variants = ["Gliński’s", "McCooey’s", "Shafran’s", "Brusky’s", "De Vasa’s", "Wellisch’s"];
const engines = [
  ["Engine 1", "Tactical", "Forcing moves, captures, and combinations."],
  ["Engine 2", "Positional", "Structure and long-term control."],
  ["Engine 3", "Defensive", "King safety and threat prevention."],
  ["Engine 4", "Materialist", "Exchanges and material advantages."],
  ["Engine 5", "Unconventional", "Less familiar, plausible ideas."],
  ["Engine 6", "Universal", "Adapting to the position."],
];

export default function HexChess() {
  const cloud = useCloudGame();
  const app = useInstallApp();
  const data = cloud.data;
  const game = data?.game;
  const [selected, setSelected] = useState<Hex | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [coordinates, setCoordinates] = useState(false);
  const [theme, setTheme] = useState("walnut");
  const [newDialog, setNewDialog] = useState(false);
  const [rulesDialog, setRulesDialog] = useState(false);
  const [enginesDialog, setEnginesDialog] = useState(false);
  const [newMode, setNewMode] = useState<"engine" | "two_players">("engine");
  const [newSide, setNewSide] = useState<0 | 1>(0);
  const [promotions, setPromotions] = useState<ChessMove[]>([]);
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState("");
  const [installDialog, setInstallDialog] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [savedLink, setSavedLink] = useState("");
  const moveList = useRef<HTMLDivElement>(null);
  const lastMove = data?.moves.at(-1);
  const ended = game?.result.status !== undefined && game.result.status !== "ongoing";
  const engineTurn =
    !!data && data.mode === "engine" && game?.activePlayer !== data.humanPlayer && !ended;
  const canControl = !!game && !ended && !cloud.busy && !cloud.error && !engineTurn;
  const selectedCell = game?.board.cells.find((cell) => selected && key(cell) === key(selected));
  const selectedMoves =
    game?.legalMoves.filter((move) => selected && key(move.from) === key(selected)) || [];
  const turn = game?.activePlayer === 0 ? "White" : "Black";
  const canUndo =
    !!data?.moves.length &&
    !cloud.busy &&
    (data.mode !== "engine" || data.moves.some((move) => move.player === data.humanPlayer));

  useEffect(() => {
    setSelected(null);
    setPromotions([]);
  }, [game?.stateId]);
  useEffect(() => {
    if (data) setFlipped(data.mode === "engine" && data.humanPlayer === 1);
  }, [data?.gameId]);
  useEffect(() => {
    if (moveList.current) moveList.current.scrollTop = moveList.current.scrollHeight;
  }, [data?.moves.length]);

  function openNewGame() {
    setNewMode(data?.mode === "two_players" ? "two_players" : "engine");
    setNewSide(data?.humanPlayer === 1 ? 1 : 0);
    setNewDialog(true);
  }
  async function startGame() {
    if (await cloud.newGame(newMode, newSide)) {
      setNewDialog(false);
      setSelected(null);
    }
  }
  function chooseCell(hex: Hex) {
    if (!game || !canControl) return;
    if (selected) {
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
    }
    const cell = game.board.cells.find((cell) => key(cell) === key(hex));
    setSelected(cell?.piece?.player === game.activePlayer ? hex : null);
  }
  async function copyGameLink() {
    if (!data) return;
    const url = new URL(publishedOrigin);
    url.hash = new URLSearchParams({ game: data.gameId, key: data.accessToken }).toString();
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setCopyFallback("");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyFallback(url.toString());
    }
  }
  async function installApp() {
    if (app.canPrompt && (await app.install())) return;
    setInstallDialog(true);
  }
  function playerName(player: number) {
    if (data?.mode === "engine") return player === data.humanPlayer ? "You" : "Engine 1";
    return player === 0 ? "White" : "Black";
  }
  function playerStrip(player: number, bottom = false) {
    const active = game?.activePlayer === player && !ended;
    const bot = data?.mode === "engine" && player !== data.humanPlayer;
    return (
      <div
        className={`${styles.playerStrip} ${bottom ? styles.bottomPlayer : ""} ${active ? styles.activePlayer : ""}`}
      >
        <span
          className={`${styles.playerIcon} ${player === 0 ? styles.whitePlayer : styles.blackPlayer}`}
        >
          {player === 0 ? "♔" : "♚"}
        </span>
        <div>
          <strong>{playerName(player)}</strong>
          <span>
            {player === 0 ? "White" : "Black"}
            {bot ? " · Tactical engine" : " · Human"}
          </span>
        </div>
        <div className={styles.playerStatus}>
          {active && (
            <>
              <span className={styles.liveDot} />
              {game?.check ? "In check" : bot && cloud.busy ? "Thinking…" : "To move"}
            </>
          )}
        </div>
      </div>
    );
  }
  let gameStatus = !game
    ? "Loading your game…"
    : ended
      ? game.result.status === "draw"
        ? `Draw · ${game.result.reason}`
        : game.result.status === "stalemate"
          ? "Stalemate · ¾–¼ scoring"
          : `${game.result.winner === 0 ? "White" : "Black"} wins by checkmate`
      : engineTurn
        ? cloud.busy
          ? "Engine 1 is thinking…"
          : "Engine 1 to move"
        : data?.mode === "engine"
          ? "Your turn"
          : `${turn} to move`;
  if (game?.check && !ended && !engineTurn) gameStatus += " · Check";

  return (
    <div className={styles.shell}>
      <Helmet>
        <title>HexChess — Play Gliński’s Chess</title>
        <meta
          name="description"
          content="Play hexagonal chess on any device. A native C++ engine and authoritative Gliński rules run on the cloud."
        />
        <meta name="theme-color" content="#151d1a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="HexChess" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="apple-touch-icon"
          href="/_cdn/static/97d3aa85-40f0-40fc-8c10-0293615d6eec-hexchess-icon-180.png"
        />
        <link
          rel="icon"
          href="/_cdn/static/6f089aab-9d56-4cdd-8ca3-c5a76c4c6f0f-hexchess-icon-192.png"
        />
      </Helmet>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Hexagon size={30} />
          <span>
            HEX<span>CHESS</span>
          </span>
        </div>
        <p className={styles.sidebarKicker}>BEYOND THE SQUARE</p>
        <nav aria-label="Main navigation">
          <button
            className={`${styles.navButton} ${styles.activeNav}`}
            aria-label="Play chess"
            aria-current="page"
            onClick={() =>
              document.getElementById("chess-board")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Hexagon size={19} />
            <span>Play</span>
          </button>
          <button
            className={styles.navButton}
            aria-label="Read Gliński rules"
            onClick={() => setRulesDialog(true)}
          >
            <BookOpen size={19} />
            <span>How to play</span>
          </button>
          <button
            className={styles.navButton}
            aria-label="View six engines"
            onClick={() => setEnginesDialog(true)}
          >
            <Cpu size={19} />
            <span>Engines</span>
            <small>6</small>
          </button>
        </nav>
        <div className={styles.sidebarQuote}>
          <small>A DIFFERENT KIND OF CHESS</small>
          <p>
            New geometry.
            <br />
            Different possibilities.
          </p>
          <div aria-hidden="true">⬡ ⬡ ⬡</div>
        </div>
        <div className={styles.sidebarBottom}>
          <Cloud size={15} />
          <span>Cloud edition · v0.2</span>
          <p>
            Open a link.
            <br />
            Make your move.
          </p>
        </div>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <span>
            Play <i>/</i> <strong>Gliński’s Chess</strong>
          </span>
          <div className={styles.cloudBadge}>
            <span className={styles.liveDot} />
            <Cloud size={14} />
            Cloud hosted
          </div>
        </header>
        <main className={styles.main}>
          <div className={styles.pageHeading}>
            <div>
              <small>SIX VARIANTS. SIX INDEPENDENT ENGINES.</small>
              <h1>
                Chess takes a new shape<span>.</span>
              </h1>
              <p>Your board, anywhere. Your engine, on the cloud.</p>
            </div>
            <div className={styles.headingActions}>
              {!app.installed && (
                <Button
                  variant="outline"
                  className={styles.shareButton}
                  onClick={() => void installApp()}
                >
                  <Download size={15} />
                  Install app
                </Button>
              )}
              <Button
                variant="outline"
                className={styles.shareButton}
                onClick={copyGameLink}
                disabled={!data}
              >
                <Link2 size={15} />
                {copied ? "Game link copied" : "Copy game link"}
              </Button>
            </div>
          </div>
          {copyFallback && (
            <label className={styles.copyFallback}>
              Select and copy your saved game link
              <input
                value={copyFallback}
                readOnly
                onFocus={(event) => event.target.select()}
                aria-label="Saved game link"
              />
            </label>
          )}
          {cloud.error && (
            <div className={styles.errorBanner} role="alert">
              <span>{cloud.error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void cloud.refresh()}
                disabled={cloud.busy}
              >
                <RefreshCw size={14} />
                Retry / refresh
              </Button>
            </div>
          )}

          <div className={styles.workspace}>
            <section className={styles.boardPanel} aria-labelledby="board-heading" id="chess-board">
              <div className={styles.boardHeading}>
                <div>
                  <small>VARIANT 01</small>
                  <h2 id="board-heading">Gliński’s Chess</h2>
                </div>
                <span className={styles.modeBadge}>
                  {data?.mode === "two_players" ? "Two players" : "You vs Engine 1"}
                </span>
              </div>
              <div className={styles.boardMeta}>
                91 cells <span>·</span> 2 players <span>·</span> 3 cell colours
              </div>
              {playerStrip(flipped ? 0 : 1)}
              <div className={styles.boardStage}>
                {game ? (
                  <CloudBoard
                    game={game}
                    selected={selected}
                    onCell={chooseCell}
                    flipped={flipped}
                    coordinates={coordinates}
                    theme={theme}
                    lastMove={lastMove}
                    disabled={!canControl}
                  />
                ) : (
                  <div className={styles.loadingBoard}>
                    <Hexagon size={65} />
                    <span>
                      {cloud.error
                        ? "Ready when the cloud connection returns"
                        : "Opening your cloud game…"}
                    </span>
                    <small>The rules and engine run on the server.</small>
                  </div>
                )}
              </div>
              {playerStrip(flipped ? 1 : 0, true)}
              <div className={styles.boardToolbar}>
                <button
                  aria-label="Flip board"
                  aria-pressed={flipped}
                  onClick={() => setFlipped(!flipped)}
                >
                  <FlipVertical2 size={17} />
                  <span>Flip board</span>
                </button>
                <button
                  aria-label="Show coordinates"
                  aria-pressed={coordinates}
                  onClick={() => setCoordinates(!coordinates)}
                >
                  <Grid2X2 size={17} />
                  <span>Coordinates</span>
                </button>
                <label>
                  <span>Theme</span>
                  <select
                    aria-label="Board theme"
                    value={theme}
                    onChange={(event) => setTheme(event.target.value)}
                  >
                    <option value="walnut">Walnut</option>
                    <option value="forest">Forest</option>
                    <option value="slate">Slate</option>
                  </select>
                </label>
              </div>
              <div className={styles.boardHint} aria-live="polite">
                {ended
                  ? "Start a new game, or undo to explore another continuation."
                  : engineTurn
                    ? "Engine 1 calculates its move on the cloud server."
                    : selectedCell?.piece
                      ? `${selectedCell.piece.type[0].toUpperCase() + selectedCell.piece.type.slice(1)} on ${selectedCell.notation} · ${new Set(selectedMoves.map((move) => key(move.to))).size} legal destinations`
                      : "Select a piece to see its legal moves. Tap a marked cell to move."}
              </div>
            </section>

            <aside className={styles.rightColumn} aria-label="Game controls and move history">
              <section className={styles.card}>
                <div className={styles.cardHeading}>
                  <h2>Your game</h2>
                  <Hexagon size={18} />
                </div>
                <div className={`${styles.turnStatus} ${ended ? styles.ended : ""}`} role="status">
                  <span className={styles.liveDot} />
                  {gameStatus}
                </div>
                {ended && game?.result.status !== "draw" && (
                  <div className={styles.scores}>
                    <span>
                      White <strong>{game?.result.scores[0]}</strong>
                    </span>
                    <span>
                      Black <strong>{game?.result.scores[1]}</strong>
                    </span>
                  </div>
                )}
                <div className={styles.infoRows}>
                  <div>
                    <span>Mode</span>
                    <strong>
                      {data?.mode === "two_players"
                        ? "Two players · shared game"
                        : "Human vs engine"}
                    </strong>
                  </div>
                  <div>
                    <span>{data?.mode === "two_players" ? "Turn" : "Your side"}</span>
                    <strong>
                      {data?.mode === "two_players"
                        ? turn
                        : data?.humanPlayer === 1
                          ? "Black"
                          : "White"}
                    </strong>
                  </div>
                  <div>
                    <span>Moves played</span>
                    <strong>{data?.moves.length || 0}</strong>
                  </div>
                </div>
                <Button
                  className={styles.newGameButton}
                  onClick={openNewGame}
                  disabled={cloud.busy}
                >
                  <Plus size={16} />
                  New game
                  <ChevronRight size={16} />
                </Button>
                <div className={styles.secondaryActions}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void cloud.undo()}
                    disabled={!canUndo}
                  >
                    <Undo2 size={14} />
                    Undo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void cloud.refresh()}
                    disabled={cloud.busy || !data}
                    aria-label="Refresh saved game"
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </Button>
                </div>
                <p className={styles.savedNote}>
                  <Cloud size={13} />
                  {data
                    ? "Saved in the cloud. Reopen with your game link."
                    : "No local engine installation required."}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className={styles.openGameButton}
                  onClick={() => setOpenDialog(true)}
                  disabled={cloud.busy}
                >
                  <FolderOpen size={13} />
                  Open saved game
                </Button>
              </section>

              <section className={styles.card}>
                <div className={styles.cardHeading}>
                  <h2>Engine 1</h2>
                  <Cpu size={18} />
                </div>
                <label className={styles.fieldLabel} htmlFor="engine-choice">
                  CHESS ENGINE
                </label>
                <select id="engine-choice" className={styles.fullSelect} defaultValue="engine-1">
                  <option value="engine-1">Engine 1 · Tactical</option>
                  {engines.slice(1).map(([name, style]) => (
                    <option disabled key={name}>
                      {name} · {style} (planned)
                    </option>
                  ))}
                </select>
                <div className={styles.engineIdentity}>
                  <span>
                    <Cpu size={24} />
                  </span>
                  <div>
                    <strong>{data?.engine || "Connecting engine…"}</strong>
                    <small>Native C++ · cloud server</small>
                  </div>
                  <Check size={15} className={data ? styles.engineReady : styles.engineWaiting} />
                </div>
                <div className={styles.searchStats}>
                  <div>
                    <span>Search depth</span>
                    <strong>{data?.lastSearch?.depth ?? "—"}</strong>
                  </div>
                  <div>
                    <span>Positions searched</span>
                    <strong>
                      {data?.lastSearch ? data.lastSearch.nodes.toLocaleString() : "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Calculation time</span>
                    <strong>{data?.lastSearch ? `${data.lastSearch.timeMs} ms` : "—"}</strong>
                  </div>
                </div>
                <p className={styles.engineNote}>
                  One independent executable. Shared rules; its own search and evaluation.
                </p>
              </section>

              <section className={`${styles.card} ${styles.movesCard}`}>
                <div className={styles.cardHeading}>
                  <h2>Move history</h2>
                  <small>WHITE / BLACK</small>
                </div>
                <div className={styles.moveList} ref={moveList} aria-label="Played moves">
                  {data?.moves.length ? (
                    Array.from({ length: Math.ceil(data.moves.length / 2) }, (_, index) => (
                      <div key={index} className={styles.moveRow}>
                        <span>{index + 1}.</span>
                        <strong>{data.moves[index * 2]?.notation || "—"}</strong>
                        <strong>{data.moves[index * 2 + 1]?.notation || "—"}</strong>
                      </div>
                    ))
                  ) : (
                    <p>
                      Every game starts with a possibility.
                      <br />
                      Make the first move.
                    </p>
                  )}
                </div>
              </section>
              <section className={styles.variantNote}>
                <span>GLIŃSKI FIRST</span>
                <p>The other five historical variants are planned.</p>
                <select aria-label="Chess variant" defaultValue="glinski">
                  <option value="glinski">Gliński’s Chess · playable</option>
                  {variants.slice(1).map((name) => (
                    <option key={name} disabled>
                      {name} (planned)
                    </option>
                  ))}
                </select>
              </section>
            </aside>
          </div>
          <footer className={styles.footer}>
            <span>
              <Cloud size={12} />
              Cloud engine. Home-screen access.
            </span>
            <button onClick={() => setInstallDialog(true)}>
              <Smartphone size={12} />
              {app.installed ? "App installed" : "Add to home screen"}
            </button>
            <button onClick={() => setRulesDialog(true)}>
              Learn the rules
              <BookOpen size={12} />
            </button>
            <span>HexChess / 0.2</span>
          </footer>
        </main>
      </div>

      <Dialog open={newDialog} onOpenChange={setNewDialog}>
        <DialogContent className={styles.dialog}>
          <DialogHeader>
            <DialogTitle>Start a new game</DialogTitle>
            <DialogDescription>
              Play Gliński’s Chess against Engine 1, or share a board with another player.
            </DialogDescription>
          </DialogHeader>
          <label className={styles.dialogField}>
            Game mode
            <select
              aria-label="New game mode"
              value={newMode}
              onChange={(event) => setNewMode(event.target.value as "engine" | "two_players")}
            >
              <option value="engine">You vs Engine 1</option>
              <option value="two_players">Two players · shared game</option>
            </select>
          </label>
          {newMode === "engine" && (
            <label className={styles.dialogField}>
              Your side
              <select
                aria-label="Your side"
                value={newSide}
                onChange={(event) => setNewSide(Number(event.target.value) as 0 | 1)}
              >
                <option value={0}>White · you move first</option>
                <option value={1}>Black · engine moves first</option>
              </select>
            </label>
          )}
          <Button
            onClick={() => void startGame()}
            disabled={cloud.busy}
            className={styles.dialogStart}
          >
            {cloud.busy ? "Opening game…" : "Start game"}
            <ChevronRight size={16} />
          </Button>
          {cloud.error && <p className={styles.dialogError}>{cloud.error}</p>}
        </DialogContent>
      </Dialog>

      <Dialog open={installDialog} onOpenChange={setInstallDialog}>
        <DialogContent className={styles.dialog}>
          <DialogHeader>
            <DialogTitle>HexChess on your home screen</DialogTitle>
            <DialogDescription>
              Launch from an app icon, in its own window. The C++ engine stays on the cloud.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.installSteps}>
            {app.platform === "ios" ? (
              <>
                <strong>iPhone or iPad</strong>
                <p>
                  Open HexChess in Safari. Tap <b>Share</b>, choose <b>Add to Home Screen</b>, then
                  tap <b>Add</b>.
                </p>
              </>
            ) : app.platform === "android" ? (
              <>
                <strong>Android</strong>
                <p>
                  In Chrome, open the <b>⋮ menu</b> and choose <b>Install app</b> or{" "}
                  <b>Add to Home screen</b>.
                </p>
              </>
            ) : (
              <>
                <strong>Phone</strong>
                <p>
                  iPhone: Safari → Share → Add to Home Screen.
                  <br />
                  Android: Chrome → ⋮ → Install app.
                </p>
                <strong>Computer</strong>
                <p>Use the install icon in the address bar, or your browser’s install-app menu.</p>
              </>
            )}
            <p className={styles.installNote}>
              Cloud play uses an internet connection. To continue an existing game after
              installation, use <b>Open saved game</b> with its copied game link.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className={styles.dialog}>
          <DialogHeader>
            <DialogTitle>Open a saved game</DialogTitle>
            <DialogDescription>
              Paste the game link from another device or from before installing the app.
            </DialogDescription>
          </DialogHeader>
          <label className={styles.dialogField}>
            Saved game link
            <input
              aria-label="Saved game link to open"
              type="url"
              value={savedLink}
              onChange={(event) => setSavedLink(event.target.value)}
              placeholder="https://…#game=…"
            />
          </label>
          <Button
            className={styles.dialogStart}
            disabled={cloud.busy || !savedLink.trim()}
            onClick={async () => {
              if (await cloud.openGame(savedLink)) {
                setOpenDialog(false);
                setSavedLink("");
              }
            }}
          >
            {cloud.busy ? "Opening game…" : "Open game"}
            <FolderOpen size={15} />
          </Button>
          {cloud.error && <p className={styles.dialogError}>{cloud.error}</p>}
        </DialogContent>
      </Dialog>

      <Dialog
        open={promotions.length > 0}
        onOpenChange={(open) => {
          if (!open) setPromotions([]);
        }}
      >
        <DialogContent className={styles.dialog}>
          <DialogHeader>
            <DialogTitle>Promote your pawn</DialogTitle>
            <DialogDescription>Choose the piece for your pawn’s final cell.</DialogDescription>
          </DialogHeader>
          <div className={styles.promotionOptions}>
            {promotions.map((move) => (
              <Button
                variant="outline"
                key={move.promotion}
                onClick={() => {
                  setPromotions([]);
                  setSelected(null);
                  void cloud.play({ from: move.from, to: move.to, promotion: move.promotion });
                }}
              >
                <span>{{ queen: "♕", rook: "♖", bishop: "♗", knight: "♘" }[move.promotion!]}</span>
                {move.promotion}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rulesDialog} onOpenChange={setRulesDialog}>
        <DialogContent className={`${styles.dialog} ${styles.rulesDialog}`}>
          <DialogHeader>
            <DialogTitle>A familiar game. A new geometry.</DialogTitle>
            <DialogDescription>
              Gliński’s Chess uses 91 cells, three colours, and three bishops per side.
            </DialogDescription>
          </DialogHeader>
          <ol className={styles.rulesList}>
            <li>
              <strong>Select, then move.</strong> Select a piece and choose a highlighted legal
              cell. The server checks every move.
            </li>
            <li>
              <strong>Rooks follow edges; bishops follow vertices.</strong> The queen combines them.
              The king takes one step in either pattern, and the knight has twelve possible jumps.
            </li>
            <li>
              <strong>Pawns advance straight ahead.</strong> They capture through a forward side
              edge. Any friendly pawn starting cell permits a clear two-cell advance—even after a
              capture onto it.
            </li>
            <li>
              <strong>En passant and promotion apply.</strong> En passant is available immediately
              after the qualifying double advance. Promotion offers queen, rook, bishop, or knight.
            </li>
            <li>
              <strong>No castling.</strong> Protect the king using the hexagonal board’s twelve
              directions.
            </li>
            <li>
              <strong>Stalemate scores ¾–¼.</strong> The player delivering it receives ¾. Repetition
              and the fifty-move rule are handled automatically here.
            </li>
          </ol>
          <p className={styles.rulesSources}>
            Historical references:{" "}
            <a
              href="https://en.wikipedia.org/wiki/Hexagonal_chess#Gli%C5%84ski's_hexagonal_chess"
              target="_blank"
              rel="noreferrer"
            >
              Gliński overview
            </a>{" "}
            ·{" "}
            <a
              href="https://www.chessvariants.org/hexagonal.dir/hexagonal.html"
              target="_blank"
              rel="noreferrer"
            >
              Chess Variants
            </a>
          </p>
        </DialogContent>
      </Dialog>

      <Dialog open={enginesDialog} onOpenChange={setEnginesDialog}>
        <DialogContent className={`${styles.dialog} ${styles.engineDialog}`}>
          <DialogHeader>
            <DialogTitle>Six ways to think</DialogTitle>
            <DialogDescription>
              Each will be its own executable with an independent strategy. Engine 1 is playable
              now; the other identities are provisional.
            </DialogDescription>
          </DialogHeader>
          <div className={styles.engineProfiles}>
            {engines.map(([name, style, detail], index) => (
              <div key={name}>
                <span>0{index + 1}</span>
                <div>
                  <strong>
                    {name} · {style}
                  </strong>
                  <p>{detail}</p>
                </div>
                <small>{index === 0 ? "Playable" : "Planned"}</small>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
