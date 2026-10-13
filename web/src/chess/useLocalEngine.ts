import { useCallback, useEffect, useRef, useState } from "react";
import { parseBoard, type BoardGeometry } from "./geometry";

type Connection = "connecting" | "connected" | "responding" | "offline" | "error";
interface Activity {
  id: number;
  time: string;
  message: string;
}
interface Pending {
  started: number;
  timer: ReturnType<typeof setTimeout>;
}

export function useLocalEngine() {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Connection>("connecting");
  const [engine, setEngine] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardGeometry | null>(null);
  const [source, setSource] = useState<"packaged" | "live">("packaged");
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [testing, setTesting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const pending = useRef(new Map<string, Pending>());
  const sequence = useRef(0);
  const eventSequence = useRef(0);

  const log = useCallback((message: string) => {
    const item = {
      id: ++eventSequence.current,
      time: new Date().toLocaleTimeString([], { hour12: false }),
      message,
    };
    setActivity((previous) => [item, ...previous].slice(0, 8));
  }, []);

  const send = useCallback(
    (type: string) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      const requestId = `req-${++sequence.current}`;
      const timer = setTimeout(() => {
        pending.current.delete(requestId);
        setTesting(false);
        setStatus("error");
        setError("The local engine did not respond. Restart the manager and reconnect.");
        log("Engine request timed out");
      }, 5000);
      pending.current.set(requestId, { started: performance.now(), timer });
      socket.send(JSON.stringify({ protocolVersion: 1, type, requestId }));
    },
    [log],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch("/foundation-board.json", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Board snapshot missing. Run npm run build:engine.");
        return response.json();
      })
      .then((value: unknown) => {
        const geometry = parseBoard(value);
        setBoard((previous) => previous ?? geometry);
      })
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure.message);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let alive = true;
    setStatus("connecting");
    setEngine(null);
    setSource("packaged");
    setLatency(null);
    setError(null);
    setTesting(false);
    const scheme = window.location.protocol === "https:" ? "wss:" : "ws:";
    // Vite proxies /engine to the loopback manager. No remote engine hosting.
    let socket: WebSocket | null = null;
    // Defer the connection so React StrictMode can clean up its first effect
    // without opening and immediately aborting a WebSocket handshake.
    const connectTimer = setTimeout(() => {
      if (!alive) return;
      socket = new WebSocket(`${scheme}//${window.location.host}/engine`);
      socketRef.current = socket;
      socket.onopen = () => {
        if (!alive) return;
        setStatus("connected");
        log("Local manager connected");
        send("engine.id");
        send("engine.board");
        send("engine.ping");
      };
      socket.onmessage = (event: MessageEvent<string>) => {
        if (!alive) return;
        try {
          const message = JSON.parse(event.data) as Record<string, unknown>;
          if (!message || message.protocolVersion !== 1 || typeof message.type !== "string")
            throw new Error("Invalid manager response");
          if (message.type === "manager.connected") return;
          if (message.type === "engine.offline") {
            setStatus("error");
            setError(typeof message.message === "string" ? message.message : "Engine unavailable");
            setEngine(null);
            setSource("packaged");
            log("Engine process stopped");
            for (const request of pending.current.values()) clearTimeout(request.timer);
            pending.current.clear();
            setTesting(false);
            return;
          }
          if (typeof message.requestId !== "string") throw new Error("Missing request ID");
          const request = pending.current.get(message.requestId);
          if (!request) return; // Ignore responses from expired requests.
          clearTimeout(request.timer);
          pending.current.delete(message.requestId);
          if (message.type === "engine.id" && typeof message.value === "string") {
            setEngine(message.value);
            log(`${message.value} identified`);
          } else if (message.type === "engine.board") {
            setBoard(parseBoard(message.board));
            setSource("live");
            log("91 cells received from C++ geometry");
          } else if (message.type === "engine.pong") {
            const elapsed = Math.round(performance.now() - request.started);
            setLatency(elapsed);
            setStatus("responding");
            setTesting(false);
            setError(null);
            log(`Engine replied pong · ${elapsed} ms round trip`);
          } else if (message.type === "error") {
            setStatus("error");
            setTesting(false);
            setError(
              typeof message.message === "string" ? message.message : "Engine request failed",
            );
            log("Manager rejected a request");
          } else throw new Error("Unknown manager response");
        } catch (failure) {
          setStatus("error");
          setError(failure instanceof Error ? failure.message : "Invalid manager response");
        }
      };
      socket.onerror = () => {
        if (alive) setError("Start your local manager, then reconnect.");
      };
      socket.onclose = () => {
        if (!alive) return;
        setStatus("offline");
        setEngine(null);
        setSource("packaged");
        setLatency(null);
        setTesting(false);
        for (const request of pending.current.values()) clearTimeout(request.timer);
        pending.current.clear();
        log("Local manager disconnected");
      };
    }, 0);
    return () => {
      alive = false;
      clearTimeout(connectTimer);
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
      }
      for (const request of pending.current.values()) clearTimeout(request.timer);
      pending.current.clear();
      socketRef.current = null;
    };
  }, [attempt, log, send]);

  return {
    status,
    engine,
    board,
    source,
    latency,
    error,
    activity,
    testing,
    reconnect: () => setAttempt((value) => value + 1),
    ping: () => {
      setTesting(true);
      send("engine.ping");
    },
  };
}
