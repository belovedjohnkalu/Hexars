import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { EventEmitter } from "node:events";
import path from "node:path";
import { createInterface } from "node:readline";

export class EngineProcess extends EventEmitter {
  constructor(config, { timeoutMs = 3000 } = {}) {
    super();
    if (!existsSync(config.path)) {
      throw new Error("Engine 1 is not compiled. Run npm run build:engine from the project root.");
    }
    this.timeoutMs = timeoutMs;
    this.queue = [];
    this.current = null;
    this.unavailable = false;
    this.closing = false;
    this.child = spawn(config.path, [], {
      cwd: path.dirname(config.path),
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      shell: false,
    });
    this.lines = createInterface({ input: this.child.stdout });
    this.lines.on("line", (line) => this.receive(line));
    this.child.stderr.on("data", (data) => process.stderr.write(`[Engine 1] ${data}`));
    this.child.stdin.on("error", (error) => this.fail(`Engine input failed: ${error.message}`));
    this.child.on("error", (error) => this.fail(`Engine could not start: ${error.message}`));
    this.child.on("exit", (code, signal) => {
      this.fail(`Engine stopped (${signal || code}). Restart the manager to reconnect.`);
    });
  }

  request(command) {
    if (!["ping", "id", "board"].includes(command))
      return Promise.reject(new Error("Unsupported engine command"));
    if (this.unavailable || this.closing)
      return Promise.reject(new Error("Engine unavailable. Restart the manager."));
    if (this.queue.length >= 64) return Promise.reject(new Error("Engine request queue is full"));
    return new Promise((resolve, reject) => {
      this.queue.push({ command, resolve, reject });
      this.advance();
    });
  }

  advance() {
    if (this.current || this.unavailable || !this.queue.length) return;
    this.current = this.queue.shift();
    this.timer = setTimeout(
      () => this.fail("Engine response timed out. Restart the manager."),
      this.timeoutMs,
    );
    this.child.stdin.write(`${this.current.command}\n`);
  }

  receive(line) {
    if (!this.current || this.unavailable) return;
    const pending = this.current;
    let result;
    try {
      if (pending.command === "ping" && line === "pong") result = { type: "engine.pong" };
      else if (pending.command === "id" && line.startsWith("id ")) {
        result = { type: "engine.id", value: line.slice(3), stage: "communication" };
      } else if (pending.command === "board") {
        const board = JSON.parse(line);
        if (
          board.variant !== "glinski" ||
          board.stage !== "geometry" ||
          !Array.isArray(board.cells) ||
          board.cells.length !== 91 ||
          board.cells.some(
            (cell) =>
              !Number.isInteger(cell.q) ||
              !Number.isInteger(cell.r) ||
              ![0, 1, 2].includes(cell.colour) ||
              Math.max(Math.abs(cell.q), Math.abs(cell.r), Math.abs(cell.q + cell.r)) > 5,
          ) ||
          new Set(board.cells.map((cell) => `${cell.q},${cell.r}`)).size !== 91
        ) {
          throw new Error("Invalid engine board response");
        }
        result = { type: "engine.board", board };
      } else throw new Error("Unexpected engine response");
    } catch {
      this.fail("Engine returned an invalid protocol response. Restart the manager.");
      return;
    }
    clearTimeout(this.timer);
    this.current = null;
    pending.resolve(result);
    this.advance();
  }

  fail(message) {
    if (this.unavailable) return;
    this.unavailable = true;
    clearTimeout(this.timer);
    if (this.current) this.current.reject(new Error(message));
    this.current = null;
    for (const pending of this.queue.splice(0)) pending.reject(new Error(message));
    if (!this.closing) {
      this.emit("unavailable", message);
      this.child.kill("SIGKILL");
    }
  }

  async close() {
    if (this.closing) return;
    this.closing = true;
    this.fail("Manager is shutting down");
    this.lines.close();
    if (this.child.exitCode !== null || this.child.signalCode !== null) return;
    await new Promise((resolve) => {
      const timer = setTimeout(() => this.child.kill("SIGKILL"), 750);
      this.child.once("close", () => {
        clearTimeout(timer);
        resolve();
      });
      if (this.child.stdin.writable) this.child.stdin.end("quit\n");
      else this.child.kill();
    });
  }
}
