import type { EngineId } from './chessEngines';
import { useCallback, useEffect, useRef, useState } from "react";
import {
  postGame,
  type InputType,
  type OutputType,
  type ChessMove,
  type VariantId,
} from "../endpoints/game_POST.schema";

import { RealtimeClient } from './RealtimeClient';
import { channels } from './realtimeChannels';
import { gameSessions } from "./gameSessions";
type Credentials = { gameId: string; accessToken: string };

export function useCloudGame(variant: VariantId, defaultMode: "engine" | "two_players" = "engine", difficulty=3,engineId:EngineId='tactical',userId:number|null=null) {
  const [data, setData] = useState<OutputType | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingMove, setPendingMove] = useState<ChessMove | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing,setMissing]=useState(false);
  const credentials = useRef<Credentials | null>(null);
  const current = useRef<OutputType | null>(null);
  const requestSequence = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const engineKey = useRef("");
  const [sideTarget,setSideTarget]=useState<0|1|null>(null);
  const sideGoal=useRef<0|1|null>(null);

  const accept = useCallback((result: OutputType) => {
    setPendingMove(null);
    current.current = result;
    credentials.current = { gameId: result.gameId, accessToken: result.accessToken };
    setData(result);
    gameSessions.save(result);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.has("game")) {
      const url = new URL(window.location.href);
      url.hash = new URLSearchParams({ game: result.gameId, key: result.accessToken }).toString();
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);

  const perform = useCallback(
    async (body: InputType, initialVariant?: VariantId): Promise<boolean> => {
      const sequence = ++requestSequence.current;
      controller.current?.abort();
      const abort = new AbortController();
      controller.current = abort;
      if (body.action !== "move") setPendingMove(null);
      setBusy(true);
      setError(null);setMissing(false);
      try {
        let result = await postGame(body, { signal: abort.signal });
        if (sequence !== requestSequence.current) return false;
        if (initialVariant && (result.game.variant !== initialVariant||(defaultMode==="engine"&&(result.difficulty!==difficulty||(result.engineId??'tactical')!==engineId)))) {
          // Keep the old variant's game before opening the requested variant.
          gameSessions.save(result);
          result = await postGame({ action: "new", mode: defaultMode, difficulty,engineId,humanPlayer: 0, variant: initialVariant }, { signal: abort.signal });
          if (sequence !== requestSequence.current) return false;
        }
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
        const notFound=!!failure&&typeof failure==='object'&&'status' in failure&&failure.status===404;
        if(notFound&&initialVariant&&!gameSessions.fromHash()){
          try{const fresh=await postGame({action:'new',variant:initialVariant,mode:defaultMode,difficulty,engineId,humanPlayer:0},{signal:abort.signal});if(sequence!==requestSequence.current)return false;accept(fresh);return true;}catch{/* Keep the recoverable new-game action below. */}
        }
        setMissing(notFound);
        setError(
          failure && typeof failure === "object" && "status" in failure && failure.status === 404
            ? "This saved game is no longer available. Start a new game."
            : "We couldn’t finish that request. Check your connection and try again.",
        );
        return false;
      } finally {
        if (sequence === requestSequence.current) { setBusy(false); setPendingMove(null); }
      }
    },
    [accept, defaultMode,difficulty,engineId],
  );

  useEffect(() => {
    sideGoal.current=null;setSideTarget(null);
    const timer = setTimeout(() => {
      const linked = gameSessions.fromHash();
      const saved = linked || gameSessions.stored(variant, defaultMode, engineId, difficulty);
      engineKey.current = "";
      credentials.current = saved;
      void perform(
        saved ? { action: "get", ...saved } : { action: "new", mode: defaultMode, difficulty,engineId,humanPlayer: 0, variant },
        linked ? undefined : variant,
      );
    }, 0);
    return () => {
      clearTimeout(timer);
      controller.current?.abort();
      ++requestSequence.current;
    };
  }, [perform, variant, defaultMode]);

  useEffect(() => {
    const openLinkedGame = () => {
      const linked = gameSessions.fromHash();
      if (!linked || linked.gameId === credentials.current?.gameId && linked.accessToken === credentials.current.accessToken) return;
      engineKey.current = "";
      credentials.current = linked;
      sideGoal.current=null;setSideTarget(null);
      void perform({ action: "get", ...linked });
    };
    window.addEventListener("hashchange", openLinkedGame);
    window.addEventListener("popstate", openLinkedGame);
    return () => {
      window.removeEventListener("hashchange", openLinkedGame);
      window.removeEventListener("popstate", openLinkedGame);
    };
  }, [perform]);

  useEffect(()=>{
    if(!data||busy||error||sideTarget===null)return;
    if(data.mode!=='engine'||data.humanPlayer===sideTarget){sideGoal.current=null;setSideTarget(null);return;}
    engineKey.current='';
    void perform({action:'switch_side',gameId:data.gameId,accessToken:data.accessToken,version:data.version,humanPlayer:sideTarget});
  },[data,busy,error,sideTarget,perform]);

  useEffect(() => {
    if (
      !data ||
      data.game.variant !== variant ||
      busy ||
      error ||
      sideGoal.current!==null ||
      data.mode !== "engine" ||
      (!gameSessions.fromHash()&&(defaultMode!=="engine" || data.difficulty!==difficulty||(data.engineId??'tactical')!==engineId)) ||
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
  }, [data, busy, error, perform, variant,defaultMode,difficulty,engineId]);

  useEffect(()=>{if(!data)return;let alive=true,timer:ReturnType<typeof setTimeout>|undefined;const update=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(!alive||document.visibilityState!=='visible')return;if(controller.current&&!controller.current.signal.aborted&&current.current&&busy){update();return;}const saved=current.current;if(!saved)return;void postGame({action:'get',gameId:saved.gameId,accessToken:saved.accessToken}).then(result=>{if(alive&&current.current?.gameId===result.gameId&&result.version>current.current.version)accept(result);}).catch(()=>{});},120);};
    const client=userId?new RealtimeClient():null,off=client?.subscribe(channels.player(userId!),event=>{if(!event.chat&&(!event.gameId||event.gameId===current.current?.gameId))update();}),again=client?.onReconnect(update),status=client?.onStatus(s=>{if(s==='connected')update();});if(client)void client.connect();window.addEventListener('focus',update);window.addEventListener('online',update);document.addEventListener('visibilitychange',update);return()=>{alive=false;clearTimeout(timer);off?.();again?.();status?.();client?.close();window.removeEventListener('focus',update);window.removeEventListener('online',update);document.removeEventListener('visibilitychange',update);};
  },[data?.gameId,userId,busy,accept]);

  const withSession = (action: "move" | "undo", move?: ChessMove) => {
    const session = current.current;
    if (!session) return Promise.resolve(false);
    const common = {
      gameId: session.gameId,
      accessToken: session.accessToken,
      version: session.version,
    };
    if (action === "move" && move) {
      const legal = session.game.legalMoves.find(candidate => candidate.from.q === move.from.q && candidate.from.r === move.from.r && candidate.to.q === move.to.q && candidate.to.r === move.to.r && candidate.promotion === move.promotion&&(!move.path||JSON.stringify(candidate.path)===JSON.stringify(move.path)));
      setPendingMove(legal?.changes?.length ? legal : null);
    }
    return action === "move" && move
      ? perform({ action: "move", ...common, move })
      : perform({ action: "undo", ...common });
  };
  return {
    data,
    pendingMove,
    busy,
    error,
    missing,
    switchingSide:sideTarget!==null,
    switchSide:()=>{const session=current.current;if(!session||session.mode!=='engine')return;const target=(sideGoal.current??session.humanPlayer)===0?1:0;sideGoal.current=target;setSideTarget(target);},
    newGame: (mode: "engine" | "two_players", humanPlayer: 0 | 1, variant: VariantId) => {
      sideGoal.current=null;setSideTarget(null);
      engineKey.current = "";
      return perform({ action: "new", mode, humanPlayer, variant,difficulty:current.current?.difficulty??difficulty,engineId:current.current?.engineId??engineId });
    },
    openGame: (link: string) => {
      try {
        const saved = gameSessions.fromHash(new URL(link.trim()).hash);
        if (!saved) throw new Error("Paste a saved Hexagonal Chess game link.");
        engineKey.current = "";
        credentials.current = saved;
        return perform({ action: "get", ...saved });
      } catch {
        setError("Paste a complete saved Hexagonal Chess game link.");
        return Promise.resolve(false);
      }
    },
    play: (move: ChessMove) => withSession("move", move),
    undo: () => withSession("undo"),
    onlineAction:(action:'forfeit'|'draw')=>{const session=current.current;return session&&(session.mode==='online'||session.game.variant==='hexdame'||session.game.variant==='kruzno')?perform({action,gameId:session.gameId,accessToken:session.accessToken,version:session.version}):Promise.resolve(false);},
    refresh: () => {
      engineKey.current = "";
      return perform(
        credentials.current
          ? { action: "get", ...credentials.current }
          : { action: "new", mode: defaultMode, difficulty,engineId,humanPlayer: 0, variant },
      );
    },
  };
}
