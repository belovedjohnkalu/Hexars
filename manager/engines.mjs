import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Only this trusted local configuration selects executables. The WebSocket
// protocol never accepts a path, process argument, or shell command.
export const engines = Object.freeze({
  "engine-1": {
    id: "engine-1",
    name: "Tactical",
    path: path.join(
      root,
      "engines/engine-1",
      process.platform === "win32" ? "engine-one.exe" : "engine-one",
    ),
    implemented: true,
    stage: "communication",
  },
});

export const allowedOrigins = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);
