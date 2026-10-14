import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppHead } from "../components/AppHead";
import { getVariants, type OutputType } from "../endpoints/variants_GET.schema";
import { postGame, type GameView } from "../endpoints/game_POST.schema";
import { gameSessions } from "../helpers/gameSessions";
import { CloudBoard } from "../components/CloudBoard";
import { InstallControl } from "../components/InstallControl";
import { HexLoading } from "../components/HexLoading";
import styles from "./_index.module.css";
const names = { glinski: "Gliński", mccooey: "McCooey" };
export default function Home() {
  const navigate = useNavigate();
  const [previews, setPreviews] = useState<OutputType["variants"]>([]);
  const [error, setError] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const linked = gameSessions.fromHash();
    if (linked) {
      setLoadingLink(true);
      void postGame({ action: "get", ...linked }, { signal: controller.signal }).then(result => {
        if (!controller.signal.aborted) {
          gameSessions.save(result);
          navigate(`/${result.game.variant}#${gameSessions.hash(result)}`, { replace: true });
        }
      }).catch(() => { if (!controller.signal.aborted) { setLoadingLink(false); setError(true); } });
    } else {
      void getVariants({ signal: controller.signal }).then(result => setPreviews(result.variants))
        .catch(() => { if (!controller.signal.aborted) setError(true); });
    }
    return () => controller.abort();
  }, [navigate]);
  return <div className={styles.app}>
    <AppHead />
    <header className={styles.header}><h1>HEXARS</h1><InstallControl /></header>
    {loadingLink ? <main className={styles.opening} role="status"><HexLoading /><div>Opening…</div></main> : <main className={styles.choices}>
      {error && <p className={styles.notice} role="alert">{gameSessions.fromHash() ? "Link unavailable" : "Boards unavailable"}</p>}
      {(["glinski", "mccooey"] as const).map(id => {
        const preview = previews.find(value => value.id === id);
        const game: GameView | null = preview ? {
          variant: id, stateId: `preview-${id}`, board: preview.board,
          activePlayer: 0, ply: 0, check: false, legalMoves: [],
          result: { status: "ongoing", reason: "", winner: -1, scores: [.5, .5] },
        } : null;
        return <Link key={id} to={`/${id}`} className={styles.choice} aria-label={`Play ${names[id]}`}>
          <div className={styles.preview} aria-hidden="true">
            {game ? <CloudBoard game={game} selected={null} onCell={() => {}} flipped={false} coordinates={false} theme="grove" disabled preview /> : <div className={styles.placeholder}><HexLoading /></div>}
          </div>
          <h2>{names[id]}</h2>
        </Link>;
      })}
    </main>}
  </div>;
}
