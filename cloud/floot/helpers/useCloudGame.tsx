import { useCallback, useEffect, useRef, useState } from "react";
import {
  postGame,
  type InputType,
  type OutputType,
  type ChessMove,
  type VariantId,
} from "../endpoints/game_POST.schema";

type Credentials = { gameId: string; accessToken: string };
const storageKey = "hexchess.cloud.game.v1";
function validCredentials(value: unknown): value is Credentials {
  if (!value || typeof value !== "object") return false;
  const credentials = value as Credentials;
  return (
    typeof credentials.gameId === "string" &&
    /^[a-f0-9-]{36}$/.test(credentials.gameId) &&
    typeof credentials.accessToken === "string" &&
    /^[a-f0-9]{64}$/.test(credentials.accessToken)
  );
}
function savedCredentials(): Credentials | null {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const link = { gameId: hash.get("game"), accessToken: hash.get("key") };
  if (validCredentials(link)) return link;
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || "null");
    return validCredentials(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function useCloudGame() {
  const [data, setData] = useState<OutputType | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const credentials = useRef<Credentials | null>(null);
  const current = useRef<OutputType | null>(null);
  const requestSequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const engineKey = useRef("");

  const accept = useCallback((result: OutputType) => {
    current.current = result;
    credentials.current = { gameId: result.gameId, accessToken: result.accessToken };
    setData(result);
    try {
      localStorage.setItem(storageKey, JSON.stringify(credentials.current));
    } catch {
      /* Game remains available through its cloud link. */
    }
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.has("game")) {
      const url = new URL(window.location.href);
      url.hash = new URLSearchParams({ game: result.gameId, key: result.accessToken }).toString();
      window.history.replaceState(null, "", url);
    }
  }, []);

  const perform = useCallback(
    async (body: InputType): Promise<boolean> => {
      const sequence = ++requestSequence.current;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      setBusy(true);
      setError(null);
      try {
        const result = await postGame(body, { signal: abort.signal });
        if (sequence !== requestSequence.current) return false;
        accept(result);
        return true;
      } catch (failure) {
        if (abort.signal.aborted || sequence !== requestSequence.current) return false;
        if (
          failure &&
          typeof failure === "object" &&
          "status" in failure &&
          failure.status === 409 &&
          "gameId" in body
        ) {
          try {
            const latest = await postGame(
              { action: "get", gameId: body.gameId, accessToken: body.accessToken },
              { signal: abort.signal },
            );
            if (sequence === requestSequence.current) {
              accept(latest);
              engineKey.current = "";
            }
            return false;
          } catch {
            /* Show the original conflict with a refresh control. */
          }
        }
        setError(
          failure && typeof failure === "object" && "status" in failure && failure.status === 404
            ? "We couldn’t find that game. Check the link, or start a new game."
            : "We couldn’t finish that request. Check your connection and try again.",
        );
        return false;
      } finally {
        if (sequence === requestSequence.current) setBusy(false);
      }
    },
    [accept],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = savedCredentials();
      credentials.current = saved;
      void perform(
        saved ? { action: "get", ...saved } : { action: "new", mode: "engine", humanPlayer: 0, variant: "glinski" },
      );
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.current?.abort();
      ++requestSequence.current;
    };
  }, [perform]);

  useEffect(() => {
    if (
      !data ||
      busy ||
      error ||
      data.mode !== "engine" ||
      data.game.result.status !== "ongoing" ||
      data.game.activePlayer === data.humanPlayer
    )
      return;
    const key = `${data.gameId}-${data.version}`;
    if (engineKey.current === key) return;
    engineKey.current = key;
    void perform({
      action: "engine",
      gameId: data.gameId,
      accessToken: data.accessToken,
      version: data.version,
    });
  }, [data, busy, error, perform]);

  useEffect(() => {
    if (!data || busy || error) return;
    const timer = setInterval(() => {
      const session = current.current;
      if (!session || document.visibilityState !== "visible") return;
      const sequence = requestSequence.current;
      void postGame({ action: "get", gameId: session.gameId, accessToken: session.accessToken })
        .then((result) => {
          if (
            sequence === requestSequence.current &&
            current.current?.gameId === result.gameId &&
            result.version > current.current.version
          )
            accept(result);
        })
        .catch(() => {
          /* Explicit actions surface connection errors with retry controls. */
        });
    }, 15000);
    return () => clearInterval(timer);
  }, [data, busy, error, accept]);

  const withSession = (action: "move" | "undo", move?: ChessMove) => {
    const session = current.current;
    if (!session) return Promise.resolve(false);
    const common = {
      gameId: session.gameId,
      accessToken: session.accessToken,
      version: session.version,
    };
    return action === "move" && move
      ? perform({ action: "move", ...common, move })
      : perform({ action: "undo", ...common });
  };
  return {
    data,
    busy,
    error,
    newGame: (mode: "engine" | "two_players", humanPlayer: 0 | 1, variant: VariantId) => {
      engineKey.current = "";
      return perform({ action: "new", mode, humanPlayer, variant });
    },
    openGame: (link: string) => {
      try {
        const hash = new URLSearchParams(new URL(link.trim()).hash.slice(1));
        const saved = { gameId: hash.get("game"), accessToken: hash.get("key") };
        if (!validCredentials(saved)) throw new Error("Paste a saved HEXARS game link.");
        engineKey.current = "";
        credentials.current = saved;
        return perform({ action: "get", ...saved });
      } catch {
        setError("Paste a complete saved HEXARS game link.");
        return Promise.resolve(false);
      }
    },
    play: (move: ChessMove) => withSession("move", move),
    undo: () => withSession("undo"),
    refresh: () => {
      engineKey.current = "";
      return perform(
        credentials.current
          ? { action: "get", ...credentials.current }
          : { action: "new", mode: "engine", humanPlayer: 0, variant: "glinski" },
      );
    },
  };
}
