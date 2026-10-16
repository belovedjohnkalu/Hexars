import { useState } from "react";
import { useLocalEngine } from "./chess/useLocalEngine";
import type { Hex } from "./chess/geometry";
import { HexBoard } from "./components/HexBoard";
import { Icon } from "./components/Icon";
import "./App.css";

const variants = [
  {
    name: "Gliński’s",
    cells: 91,
    players: 2,
    detail: "The original hexagonal game. Three cell colours and three bishops per side.",
  },
  {
    name: "McCooey’s",
    cells: 91,
    players: 2,
    detail: "A different starting arrangement and a new approach to pawn movement.",
  },
  {
    name: "Shafran’s",
    cells: 70,
    players: 2,
    detail: "An irregular board with its own castling rules.",
  },
  {
    name: "Brusky’s",
    cells: 84,
    players: 2,
    detail: "A distinctive board shape and special pawn behaviour.",
  },
  {
    name: "De Vasa’s",
    cells: 81,
    players: 2,
    detail: "A rhombus board with different pawn directions.",
  },
  {
    name: "Wellisch’s",
    cells: 91,
    players: 3,
    detail: "Three players, different pieces, and a separate multiplayer search strategy.",
  },
];
const engineDesigns = [
  ["Engine 1", "Tactical", "Forcing lines, combinations, and immediate threats."],
  ["Engine 2", "Positional", "Structure, mobility, and long-term control."],
  ["Engine 3", "Defensive", "King safety and careful threat prevention."],
  ["Engine 4", "Materialist", "Favourable exchanges and material advantages."],
  ["Engine 5", "Unconventional", "Less common, strategically plausible ideas."],
  ["Engine 6", "Universal", "An approach that adapts to the position."],
];
const phases = [
  ["Foundation", "Website, manager, and first native engine communicate.", "Current"],
  ["Gliński’s rules", "Starting position, legal moves, king safety, and endings.", "Next"],
  [
    "First intelligent engine",
    "Search, evaluation, time management, and complete-game tests.",
    "Planned",
  ],
  [
    "Six independent engines",
    "Separate executables with distinct strategic approaches.",
    "Planned",
  ],
  [
    "Five more variants",
    "Independently verified rules, including three-player support.",
    "Planned",
  ],
  [
    "Arena and release",
    "Engine matches, regression testing, and local application release.",
    "Planned",
  ],
];
type Page = "board" | "engines" | "roadmap";

export default function App() {
  const local = useLocalEngine();
  const [page, setPage] = useState<Page>("board");
  const [selected, setSelected] = useState<Hex | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [coordinates, setCoordinates] = useState(false);
  const [theme, setTheme] = useState("walnut");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const healthy = local.status === "responding";
  const connected = ["responding", "connected"].includes(local.status);
  const statusText = healthy
    ? "Engine responding"
    : local.status === "connecting"
      ? "Connecting…"
      : local.status === "connected"
        ? "Manager connected"
        : local.status === "error"
          ? "Engine needs attention"
          : "Manager offline";
  async function copyCommand() {
    try {
      await navigator.clipboard.writeText("npm run manager");
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#board"
          onClick={(event) => {
            event.preventDefault();
            setPage("board");
          }}
          aria-label="ION board"
        >
          <span className="brand-mark">
            <Icon name="board" size={28} />
          </span>
          <span>
            HEX<span className="brand-light">CHESS</span>
          </span>
        </a>
        <p className="sidebar-kicker">THE LOCAL CHESS LABORATORY</p>
        <nav aria-label="Main navigation">
          {(
            [
              ["board", "Board explorer"],
              ["engines", "Engines"],
              ["roadmap", "Development"],
            ] as const
          ).map(([id, name]) => (
            <button
              key={id}
              className={`nav-item ${page === id ? "active" : ""}`}
              aria-label={name}
              aria-current={page === id ? "page" : undefined}
              onClick={() => setPage(id)}
            >
              <Icon name={id} />
              <span>{name}</span>
              {id === "engines" && <small>6</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-quote">
          <span className="tiny-label">BEYOND THE SQUARE</span>
          <p>
            New geometry.
            <br />
            Different possibilities.
          </p>
          <div className="mini-hexes" aria-hidden="true">
            ⬡ ⬡ ⬡
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="version-label">
            <span className="dot amber" />
            Foundation · v0.1
          </div>
          <p>
            Native engines.
            <br />
            Your computer.
          </p>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <span className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {page === "board"
                ? "Board explorer"
                : page === "engines"
                  ? "Engine library"
                  : "Development"}
            </strong>
          </span>
          <div className={`connection-pill ${healthy ? "healthy" : ""}`} role="status">
            <span className={`dot ${healthy ? "green" : "amber"}`} />
            {statusText}
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">SIX VARIANTS. SIX INDEPENDENT ENGINES.</div>
              <h1>
                {page === "board" ? (
                  <>
                    Chess takes a new shape<span>.</span>
                  </>
                ) : page === "engines" ? (
                  <>
                    Six ways to think<span>.</span>
                  </>
                ) : (
                  <>
                    From geometry to strategy<span>.</span>
                  </>
                )}
              </h1>
              <p>
                {page === "board"
                  ? "Explore the board. Connect your engine. Build from a solid foundation."
                  : page === "engines"
                    ? "One shared rules library. Six separately compiled chess engines."
                    : "A deliberate path to a complete, locally running chess platform."}
              </p>
            </div>
            <span className="phase-badge">
              <Icon name="board" size={16} /> FOUNDATION PHASE
            </span>
          </div>

          {page === "board" && (
            <div className="workspace-grid">
              <section className="board-panel" aria-labelledby="board-title">
                <div className="panel-heading">
                  <div>
                    <span className="tiny-label">VARIANT 01</span>
                    <h2 id="board-title">Gliński’s Chess</h2>
                  </div>
                  <span className="subtle-badge">Geometry preview</span>
                </div>
                <div className="board-meta">
                  <span>91 cells</span>
                  <i /> <span>2 players</span>
                  <i />
                  <span>3 cell colours</span>
                </div>
                <div className="board-stage">
                  <div className="board-decoration top">HEXAGONAL BOARD · RADIUS 5</div>
                  <HexBoard
                    board={local.board}
                    selected={selected}
                    onSelect={setSelected}
                    flipped={flipped}
                    coordinates={coordinates}
                    theme={theme}
                  />
                  <div className="board-decoration bottom">
                    {local.source === "live"
                      ? "LIVE GEOMETRY FROM ENGINE 1"
                      : "GEOMETRY EXPORTED FROM THE C++ LIBRARY"}
                  </div>
                </div>
                <div className="board-toolbar">
                  <div className="toolbar-buttons">
                    <button
                      className={`tool-button ${flipped ? "on" : ""}`}
                      aria-pressed={flipped}
                      onClick={() => setFlipped(!flipped)}
                    >
                      <Icon name="flip" />
                      <span>Flip board</span>
                    </button>
                    <button
                      className={`tool-button ${coordinates ? "on" : ""}`}
                      aria-pressed={coordinates}
                      onClick={() => setCoordinates(!coordinates)}
                    >
                      <Icon name="grid" />
                      <span>Coordinates</span>
                    </button>
                    <button
                      className="icon-button"
                      title="Reset board view"
                      aria-label="Reset board view"
                      onClick={() => {
                        setSelected(null);
                        setFlipped(false);
                        setCoordinates(false);
                      }}
                    >
                      <Icon name="reset" />
                    </button>
                  </div>
                  <label className="theme-control">
                    <span>Theme</span>
                    <select
                      aria-label="Theme"
                      value={theme}
                      onChange={(event) => setTheme(event.target.value)}
                    >
                      <option value="walnut">Walnut</option>
                      <option value="forest">Forest</option>
                      <option value="slate">Slate</option>
                    </select>
                  </label>
                </div>
                <div className="cell-inspector" aria-live="polite">
                  <Icon name="info" size={16} />
                  {selected ? (
                    <span>
                      Selected cell{" "}
                      <strong>
                        q = {selected.q}, r = {selected.r}
                      </strong>{" "}
                      · Axial coordinates
                    </span>
                  ) : (
                    <span>Select any cell to inspect its coordinates.</span>
                  )}
                </div>
              </section>

              <aside className="right-column" aria-label="Engine connection and board settings">
                <section className="card engine-card">
                  <div className="card-heading">
                    <h2>Local engine</h2>
                    <Icon name="engine" />
                  </div>
                  <label className="field-label" htmlFor="engine-select">
                    ENGINE
                  </label>
                  <select id="engine-select" className="full-select" defaultValue="engine-1">
                    <option value="engine-1">Engine 1 · Foundation</option>
                    {engineDesigns.slice(1).map(([name, style]) => (
                      <option key={name} disabled>
                        {name} · {style} (planned)
                      </option>
                    ))}
                  </select>
                  <div className="engine-identity">
                    <span className={`engine-icon ${healthy ? "online" : ""}`}>
                      <Icon name="engine" size={24} />
                    </span>
                    <div>
                      <strong>{local.engine || "Engine 1"}</strong>
                      <span>
                        {local.engine
                          ? "Native C++ executable detected"
                          : "Awaiting local executable"}
                      </span>
                    </div>
                  </div>
                  <div className="status-rows">
                    <div>
                      <span>Manager</span>
                      <strong className={healthy ? "success-text" : ""}>{statusText}</strong>
                    </div>
                    <div>
                      <span>Round trip</span>
                      <strong>{local.latency === null ? "—" : `${local.latency} ms`}</strong>
                    </div>
                    <div>
                      <span>Capability</span>
                      <strong>Communication + geometry</strong>
                    </div>
                  </div>
                  <button
                    className="primary-button"
                    onClick={connected ? local.ping : local.reconnect}
                    disabled={local.testing || local.status === "connecting"}
                  >
                    <Icon name={connected ? "link" : "flip"} />
                    {local.testing
                      ? "Waiting for pong…"
                      : connected
                        ? "Test engine connection"
                        : local.status === "connecting"
                          ? "Connecting…"
                          : "Reconnect manager"}
                    <Icon name="arrow" size={16} />
                  </button>
                  {local.error && (
                    <p className="connection-error" role="alert">
                      {local.error}
                    </p>
                  )}
                  <div className="start-command">
                    <div>
                      <Icon name="terminal" size={15} />
                      <span>Start from the project root</span>
                    </div>
                    <button onClick={copyCommand} aria-label="Copy manager start command">
                      <code>npm run manager</code>
                      <Icon name={copied ? "check" : "copy"} size={15} />
                    </button>
                    {copyError && (
                      <span className="copy-error">Select and copy the command above.</span>
                    )}
                  </div>
                </section>
                <section className="card">
                  <div className="card-heading">
                    <h2>Board setup</h2>
                    <Icon name="board" />
                  </div>
                  <label className="field-label" htmlFor="variant-select">
                    VARIANT
                  </label>
                  <select id="variant-select" className="full-select" defaultValue="glinski">
                    <option value="glinski">Gliński’s Chess</option>
                    {variants.slice(1).map((variant) => (
                      <option key={variant.name} disabled>
                        {variant.name} (planned)
                      </option>
                    ))}
                  </select>
                  <div className="foundation-note">
                    <span className="dot amber" />
                    <div>
                      <strong>Connection first. Chess next.</strong>
                      <p>
                        This board previews geometry. Pieces, legal moves, and search are the next
                        milestones.
                      </p>
                    </div>
                  </div>
                  <button className="disabled-button" disabled>
                    Game play coming in the rules phase
                  </button>
                </section>
                <section className="card activity-card">
                  <div className="card-heading">
                    <h2>Session activity</h2>
                    <span className="tiny-label">LIVE</span>
                  </div>
                  <ol>
                    {local.activity.length ? (
                      local.activity.map((item) => (
                        <li key={item.id}>
                          <time>{item.time}</time>
                          <span>{item.message}</span>
                        </li>
                      ))
                    ) : (
                      <li>
                        <span>Waiting for the local manager…</span>
                      </li>
                    )}
                  </ol>
                </section>
              </aside>
            </div>
          )}

          {page === "engines" && (
            <>
              <div className="section-intro">
                <span className="subtle-badge">Provisional strategic identities</span>
                <p>
                  Engine 1 currently verifies communication. Search and evaluation will be built
                  after the Gliński rules pass their tests.
                </p>
              </div>
              <div className="engine-grid">
                {engineDesigns.map(([name, style, detail], index) => (
                  <section className="card engine-profile" key={name}>
                    <div className="profile-number">0{index + 1}</div>
                    <div className="profile-chip">
                      <Icon name="engine" />
                      <span>
                        {index === 0 ? "Communication implemented" : "Planned executable"}
                      </span>
                    </div>
                    <h2>{name}</h2>
                    <h3>{style}</h3>
                    <p>{detail}</p>
                    <code>engine-{["one", "two", "three", "four", "five", "six"][index]}.exe</code>
                    <div className="profile-footer">
                      {index === 0 ? "Chess search pending" : "Independent strategy pending"}
                    </div>
                  </section>
                ))}
              </div>
              <div className="architecture-note">
                <Icon name="info" />
                <p>
                  Each engine will use the same authoritative C++ rules library. Six engines means
                  six independent executables, with their own search and evaluation design.
                </p>
              </div>
            </>
          )}

          {page === "roadmap" && (
            <>
              <section className="card roadmap-card">
                <div className="card-heading">
                  <h2>The development path</h2>
                  <span className="subtle-badge">Milestone 1 of 6</span>
                </div>
                <ol className="phase-list">
                  {phases.map(([name, detail, status], index) => (
                    <li key={name}>
                      <span className={`phase-number ${index === 0 ? "current" : ""}`}>
                        0{index + 1}
                      </span>
                      <div>
                        <h3>{name}</h3>
                        <p>{detail}</p>
                      </div>
                      <span className={`phase-state ${index === 0 ? "current" : ""}`}>
                        {status}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
              <h2 className="section-title">Six historical variants</h2>
              <div className="variant-grid">
                {variants.map((variant, index) => (
                  <section className="card variant-card" key={variant.name}>
                    <div className="tiny-label">
                      VARIANT 0{index + 1} · {index === 0 ? "GEOMETRY READY" : "PLANNED"}
                    </div>
                    <h3>{variant.name}</h3>
                    <div className="variant-stats">
                      {variant.cells} cells <span>·</span> {variant.players} players
                    </div>
                    <p>{variant.detail}</p>
                  </section>
                ))}
              </div>
            </>
          )}

          <footer className="workspace-footer">
            <div>
              <span className="dot green" />
              Designed for local execution
            </div>
            <span>
              React + TypeScript <span className="footer-arrow">↔</span> Node.js manager{" "}
              <span className="footer-arrow">↔</span> C++ engine
            </span>
            <span className="footer-version">ION / 0.1.0</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
