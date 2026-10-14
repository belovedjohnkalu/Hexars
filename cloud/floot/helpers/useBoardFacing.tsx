import { useEffect, useRef, useState } from "react";

// Let the move finish before rotating for the next pass-and-play player.
// Durations match CloudBoard's translation and facing transitions.
export function useBoardFacing(gameId: string | undefined, ply: number | undefined, flipped: boolean) {
  const [view, setView] = useState({ gameId, flipped });
  const [turning, setTurning] = useState(false);
  const previous = useRef({ gameId, ply, flipped });
  useEffect(() => {
    const before = previous.current;
    previous.current = { gameId, ply, flipped };
    if (!gameId || before.gameId !== gameId || before.flipped === flipped ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setView({ gameId, flipped });
      setTurning(false);
      return;
    }
    setTurning(true);
    const delay = before.ply !== ply ? 480 : 0;
    const move = setTimeout(() => setView({ gameId, flipped }), delay);
    const finish = setTimeout(() => setTurning(false), delay + 560);
    return () => { clearTimeout(move); clearTimeout(finish); };
  }, [gameId, ply, flipped]);
  return { flipped: view.gameId === gameId ? view.flipped : flipped, turning };
}
