import {
  setServerSession,
  NotAuthenticatedError,
} from "../../helpers/getSetServerSession";
import { User } from "../../helpers/User";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import superjson from "superjson";

export async function handle(request: Request) {
  try {
    const { user, session } = await getServerUserSession(request);

    // Create response with user data
    const response = new Response(
      superjson.stringify({
        expiresAt:session.credentialExpiresAt&&session.credentialExpiresAt-Date.now()>=43200000?session.credentialExpiresAt:Math.floor(Date.now()/1000)*1000+86400000,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        } satisfies User,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-store",
        },
      }
    );

    // Update the session cookie with the new lastAccessed time
    if(!session.credentialExpiresAt||session.credentialExpiresAt-Date.now()<43200000)await setServerSession(response, {
      id: session.id,
      createdAt: session.createdAt,
      lastAccessed: session.lastAccessed.getTime(),
    });

    return response;
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(
        superjson.stringify({ error: "Not authenticated" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          "Cache-Control": "private, no-store",
          },
        }
      );
    }
    console.error("Session validation error:", error);
    return new Response(
      superjson.stringify({ error: "Session validation failed" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-store",
        },
      }
    );
  }
}
