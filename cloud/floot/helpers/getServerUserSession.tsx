import { sql } from 'kysely';
import { db } from "./db";
import { User } from "./User";

import {
  getServerSessionOrThrow,
  NotAuthenticatedError,
} from "./getSetServerSession";

export async function getServerUserSession(request: Request) {
  const session = await getServerSessionOrThrow(request);

  // Query the sessions and users tables in a single join query
  const results = await db
    .selectFrom("sessions")
    .innerJoin("users", "sessions.userId", "users.id")
    .select([
      "sessions.id as sessionId",
      "sessions.createdAt as sessionCreatedAt",
      "sessions.lastAccessed as sessionLastAccessed",
      "sessions.credentialExpiresAt as storedCredentialExpiresAt",
      "users.id",
      "users.email",
      "users.displayName",
      "users.role",
      "users.avatarUrl",
    ])
    .where("sessions.id", "=", session.id)
    .where("sessions.expiresAt", ">", new Date())
    .limit(1)
    .execute();

  if (results.length === 0) {
    throw new NotAuthenticatedError();
  }

  const result = results[0];
  const user = {
    id: result.id,
    email: result.email,
    displayName: result.displayName,
    avatarUrl: result.avatarUrl,
    role: result.role,
  };

  // Read-heavy play and realtime reconnects must not write on every request.
  // The SQL predicate also coalesces simultaneous requests for this session.
  const now = new Date();
  const newerCredential = session.credentialExpiresAt && session.credentialExpiresAt > new Date(result.storedCredentialExpiresAt || 0).getTime();
  if (now.getTime() - new Date(result.sessionLastAccessed||0).getTime() >= 60000 || newerCredential) {
    await db.updateTable('sessions').set({
      lastAccessed: now,
      ...(newerCredential ? {credentialExpiresAt:sql`greatest(credential_expires_at,${new Date(session.credentialExpiresAt!)})`} : {}),
    }).where('id','=',session.id).where(eb => eb.or([
      eb('lastAccessed','<',new Date(now.getTime()-60000)),
      ...(newerCredential ? [eb('credentialExpiresAt','is',null),eb('credentialExpiresAt','<',new Date(session.credentialExpiresAt!))] : []),
    ])).execute();
  }

  return {
    user: user satisfies User,
    // make sure to update the session in cookie
    session: {
      ...session,
      lastAccessed: now,
    },
  };
}
