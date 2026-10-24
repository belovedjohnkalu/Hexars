import {isCheckers} from '../helpers/checkersRules';
import { onlineMatchState,withOnlineResult,decideOnlineMatch } from '../helpers/onlineMatch';
import { timeAccess } from '../helpers/timeAccess';
import { engineId as resolveEngineId } from '../helpers/chessEngines';
import { createHash, randomBytes, randomUUID } from "node:crypto";
import superjson from "superjson";
import { optionalGameUser } from '../helpers/gameAccess';
import { publish } from '@floot/realtime';
import { channels } from '../helpers/realtimeChannels';
import { db } from "../helpers/db";
import { runNativeEngine } from "../helpers/runNativeEngine";
import type { Json } from "../helpers/schema";
import {
  schema,
  type OutputType,
  type MoveRecord,
  type SearchDiagnostics,
} from "./game_POST.schema";

class GameError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
function activePlayer(state: Json) {
  if (
    !state ||
    typeof state !== "object" ||
    Array.isArray(state) ||
    (state.activePlayer !== 0 && state.activePlayer !== 1 && !(state.variant === 'wellisch' && state.activePlayer === 2))
  )
    throw new Error("Saved game state is invalid");
  return state.activePlayer;
}
const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };

export async function handle(request: Request) {
  try {
    const text = await request.text();
    if (text.length > 4096) throw new GameError("Request too large", 413);
    const input = schema.parse(superjson.parse(text));
    const user=await optionalGameUser(request);
    if (input.action === "new") {
      if(isCheckers(input.variant)&&input.mode==='engine'&&input.engineId&&input.engineId!=='universal')throw new GameError('Choose Computer for checkers.',400);
      await timeAccess.assert(user?.id??null,input.variant,input.mode==='engine'?(input.engineId??'universal'):undefined);
      const native = await runNativeEngine({
        action: "new",
        variant: input.variant,
        engineId:input.engineId??'universal',
        origin: request.url,
        signal: request.signal,
      });
      const gameId = randomUUID();
      const accessToken = randomBytes(32).toString("hex");
      await db
        .insertInto("hexchessGames")
        .values({
          id: gameId,
          accessTokenHash: tokenHash(accessToken),
          mode: input.mode,
          difficulty:input.difficulty??3,
          engineId:input.engineId??'universal',
          humanPlayer: input.humanPlayer,
          state: native.state,
          timeline: [],
          moves: [],
          version: 0,
          lastSearch: null,
        })
        .execute();
      if(user)await db.insertInto('ionGameMembers').values({gameId,userId:user.id,seat:null}).onConflict(oc=>oc.columns(['gameId','userId']).doNothing()).execute();
      return new Response(
        superjson.stringify({
          gameId,
          accessToken,
          version: 0,
          mode: input.mode,
          difficulty:input.difficulty??3,
          humanPlayer: input.humanPlayer,
          engine: native.engine,
          engineId:input.engineId??'universal',
          execution: "cloud",
          game: native.game,
          moves: [],
          lastSearch: null,
        } satisfies OutputType),
        { headers },
      );
    }

    const row=await db.selectFrom('hexchessGames').selectAll().where('id','=',input.gameId).executeTakeFirst();
    const member=user?await db.selectFrom('ionGameMembers').selectAll().where('gameId','=',input.gameId).where('userId','=',user.id).executeTakeFirst():null;
    const capability=!!row&&row.accessTokenHash===tokenHash(input.accessToken);
    if(!row||(!member&&!capability)||(row.mode==='online'&&!member))throw new GameError('This saved game is not available to this account.',404);
    if(user&&capability&&row.mode!=='online'&&!member)await db.insertInto('ionGameMembers').values({gameId:row.id,userId:user.id,seat:null}).onConflict(oc=>oc.columns(['gameId','userId']).doNothing()).execute();
    if(input.action!=='forfeit'&&input.action!=='draw'){const state=row.state as {variant?:string};await timeAccess.assert(user?.id??null,state.variant||'glinski',row.mode==='engine'?resolveEngineId(row.engineId):undefined);}
    const checkers=isCheckers((row.state as {variant?:string})?.variant);
    if((input.action==='forfeit'||input.action==='draw')&&row.mode!=='online'&&!checkers)throw new GameError('This action is only for online matches.',400);
    let onlineState=onlineMatchState(row.onlineState);
    if(row.mode==='online'){
      if(onlineState.result&&input.action!=='get'&&input.action!=='review')throw new GameError('This match has ended.',409);
      if(input.action==='engine'||input.action==='undo'||input.action==='switch_side')throw new GameError('This action is not available in an online match.',400);
      if(input.action==='move'&&activePlayer(row.state)!==member?.seat)throw new GameError('Wait for your turn.',403);
    }
    if (input.action !== "get" && input.action !== "review" && input.version !== row.version)
      throw new GameError("This game changed on another device. Refresh to continue.", 409);
    let moves = (Array.isArray(row.moves) ? row.moves : []) as unknown as MoveRecord[];
    let timeline = Array.isArray(row.timeline) ? row.timeline : [];
    let lastSearch = row.lastSearch as unknown as SearchDiagnostics | null;
    let nextState = row.state;
    let version = row.version;
    let humanPlayer=row.humanPlayer;
    if(input.action==='switch_side'){
      if(row.mode!=='engine'||(row.state&&typeof row.state==='object'&&!Array.isArray(row.state)&&Number(row.state.ply)>0)||moves.length>0)throw new GameError('Choose your engine side before the first move.',400);
      humanPlayer=input.humanPlayer;
    }

    if (
      input.action === "move" &&
      row.mode === "engine" &&
      activePlayer(row.state) !== row.humanPlayer
    )
      throw new GameError("Wait for the engine's turn to finish.", 400);
    if (
      input.action === "engine" &&
      (row.mode !== "engine" || activePlayer(row.state) === row.humanPlayer)
    )
      throw new GameError("It is not the engine's turn.", 400);
    if(input.action==="review"){
      if(input.ply>timeline.length)throw new GameError("That move is not in this game.",400);
      if(input.ply<timeline.length)nextState=timeline[input.ply];
    }
    if (input.action === "undo") {
      if (!timeline.length) throw new GameError("There are no moves to undo.", 400);
      let count = 1;
      // Return to before the latest human action, including both opponents'
      // replies and any same-turn delayed promotions. Pass-and-play undoes one.
      if(row.mode==='engine'){
        let lastHuman=-1;for(let i=moves.length-1;i>=0;--i)if(!moves[i].engine&&moves[i].player===row.humanPlayer){lastHuman=i;break;}
        if(lastHuman>=0)count=timeline.length-lastHuman;
      }
      nextState = timeline[timeline.length - count];
      timeline = timeline.slice(0, -count);
      moves = moves.slice(0, -count);
      lastSearch = null;
    }

    if(checkers&&row.mode!=='online'&&(input.action==='forfeit'||input.action==='draw')){
      if(input.action==='draw'&&row.mode!=='two_players')throw new GameError('A draw needs both players’ agreement.',400);
      const prior=await runNativeEngine({action:'inspect',origin:request.url,state:nextState});if(prior.game.result.status!=='ongoing')throw new GameError('Game has ended',400);
      nextState={...(nextState as object),...(input.action==='draw'?{agreed:true}:{resigned:row.mode==='engine'?row.humanPlayer:activePlayer(row.state)})} as Json;
    }
    const native = await runNativeEngine({
      action: input.action === "move" ? "move" : input.action === "engine" ? "search" : "inspect",
      origin: request.url,
      state: nextState,
      difficulty:row.difficulty,
      engineId:resolveEngineId(row.engineId),
      move: input.action === "move" ? input.move : undefined,
      signal: request.signal,
    });

    if(row.mode==='online'&&(input.action==='forfeit'||input.action==='draw'))onlineState=decideOnlineMatch(native.game,onlineState,member!.seat!,input.action);
    if(row.mode==='online'&&input.action==='move')onlineState={};

    if (input.action === "move" || input.action === "engine") {
      const selected = native.appliedMove;
      if (!selected || !native.previousGame)
        throw new Error("The engine did not return an applied move.");
      const before = native.previousGame;
      const capture =
        before.board.cells.filter((cell) => cell.piece).length >
        native.game.board.cells.filter((cell) => cell.piece).length;
      const from =
        selected.fromNotation ||
        before.board.cells.find((cell) => cell.q === selected.from.q && cell.r === selected.from.r)
          ?.notation ||
        "?";
      const to =
        selected.toNotation ||
        before.board.cells.find((cell) => cell.q === selected.to.q && cell.r === selected.to.r)
          ?.notation ||
        "?";
      const record: MoveRecord = {
        ply: native.game.ply,
        player: before.activePlayer,
        from: selected.from,
        to: selected.to,
        ...(selected.path?{path:selected.path}:{}),
        notation: selected.path?selected.path.map(h=>before.board.cells.find(c=>c.q===h.q&&c.r===h.r)?.notation||'?').join(capture?'×':'–')+(native.game.board.cells.find(c=>c.q===selected.to.q&&c.r===selected.to.r)?.piece?.type==='draughts-king'&&before.board.cells.find(c=>c.q===selected.from.q&&c.r===selected.from.r)?.piece?.type==='man'?'=K':''):selected.pass ? "Pass" :
          from +
          (capture ? "×" : "–") +
          to +
          (selected.promotion
            ? "=" + (selected.promotion === "knight" ? "N" : selected.promotion[0].toUpperCase())
            : "") +
          (native.game.result.status === "checkmate" ? "#" : native.game.check ? "+" : ""),
        engine: input.action === "engine",
        ...(selected.promotion ? { promotion: selected.promotion } : {}),
      };
      timeline = [...timeline, row.state];
      moves = [...moves, record];
      nextState = native.state;
      if (native.diagnostics) lastSearch = native.diagnostics;
    }

    if (input.action !== "get" && input.action !== "review") {
      const updated = await db
        .updateTable("hexchessGames")
        .set({
          state: nextState,
          onlineState:onlineState as unknown as Json,
          timeline,
          moves: moves as unknown as Json,
          lastSearch: lastSearch as unknown as Json,
          version: row.version + 1,
          updatedAt: input.action==='switch_side'?row.updatedAt:new Date(),
          humanPlayer,
        })
        .where("id", "=", row.id)
        .where("version", "=", row.version)
        .returning("version")
        .executeTakeFirst();
      if (!updated)
        throw new GameError("This game changed on another device. Refresh to continue.", 409);
      version = updated.version;
    }

    const players=row.mode==='online'?await db.selectFrom('ionGameMembers').innerJoin('users','users.id','ionGameMembers.userId').select(['ionGameMembers.seat','users.displayName as name']).where('gameId','=',row.id).orderBy('seat').execute():undefined;
    if(input.action!=='get'&&input.action!=='review'){const members=await db.selectFrom('ionGameMembers').select('userId').where('gameId','=',row.id).execute();await Promise.all(members.map(m=>publish(channels.player(m.userId),{gameId:row.id,version})));}
    const output: OutputType = {
      gameId: row.id,
      accessToken: input.accessToken,
      version,
      mode: row.mode,
      difficulty:row.difficulty,
      humanPlayer:row.mode==='online'?member!.seat!:humanPlayer,
      engineId:resolveEngineId(row.engineId),
      ...(players?{players:players.filter(p=>p.seat!==null).map(p=>({seat:p.seat!,name:p.name}))}:{}),
      engine: native.engine,
      execution: "cloud",
      game: row.mode==='online'&&(input.action!=='review'||input.ply===timeline.length)?withOnlineResult(native.game,onlineState):native.game,
      ...(row.mode==='online'?{drawVotes:onlineState.votes??[]}:{}),
      moves,
      lastSearch,
    };
    return new Response(superjson.stringify(output), { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The game service is unavailable.";
    const status =
      error && typeof error==='object' && 'status' in error
        ? Number(error.status)
        : message.includes("Illegal move") || message.includes("Game has ended")
          ? 400
          : typeof error === "object" && error && "issues" in error
            ? 400
            : 503;
    if (status >= 500) console.error("HexChess game request failed:", message);
    return new Response(superjson.stringify({ error: message }), { status, headers });
  }
}
