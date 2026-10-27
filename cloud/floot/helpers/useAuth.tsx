import {deviceData} from './deviceData';
import {transientFailure} from './cacheRead';
import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "../endpoints/auth/session_GET.schema";
import { postLogout } from "../endpoints/auth/logout_POST.schema";
import { User } from "./User";

// React Query key for auth session. Make sure to optimistically update user infos using this.
export const AUTH_QUERY_KEY = ["auth", "session"] as const;

// Do not use this state in login/register UI because it's irrelevant. Only use it in UI that requires authentication.
// For pages that requires authentication only in parts of the UI (e.g. typical home page with a user avatar), the loading
// state should not apply to the full page, only to the parts that require authentication.
// Also, global context providers should not be blocked on auth states as it will block the whole page.
type AuthState =
  | {
      // Make sure to display a nice loading state UI when loading authentication state
      type: "loading";
    }
  | {
      type: "authenticated";
      user: User;
    }
  | {
      // Make sure to redirect to login or show auth error UI
      type: "unauthenticated";
      errorMessage?: string;
    };

type AuthContextType = {
  // Use this to display the correct UI based on auth state
  authState: AuthState;
  // Notify the auth provider that we have logged in
  onLogin: (user: User) => void;
  // Clear the auth state and perform the logout request
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add this to components/_globalContextProviders but not any pageLayout files.
// Make sure it's within the QueryClientProvider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();

  const { data, error, status, refetch } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async ({signal}) => {
      try{const result=await getSession({}, {signal});if(signal.aborted)throw new DOMException('Cancelled','AbortError');if('error'in result)throw Object.assign(new Error(result.error),{status:401});
       const previous=deviceData.identity();if(previous&&previous!=='guest'&&previous!==String(result.user.id))void deviceData.clear(previous);deviceData.setIdentity(result.user.id);if(result.expiresAt)void deviceData.session({user:result.user,expiresAt:result.expiresAt});void deviceData.prune();return result.user;
      }catch(error){if(signal.aborted)throw error;if(transientFailure(error)){const cached=await deviceData.session();if(cached){deviceData.setIdentity(cached.user.id);return cached.user;}}deviceData.setIdentity(null);if(error&&typeof error==='object'&&'status'in error&&[401,403].includes(Number(error.status))){const cached=await deviceData.session();if(cached)void deviceData.clear(String(cached.user.id));void deviceData.session(null);}throw error;}
    },
    retry: (count, failure) => transientFailure(failure) && count < 1,
    enabled: true,
    staleTime: Infinity,
  });

  useEffect(()=>{const expired=()=>{void queryClient.invalidateQueries({queryKey:AUTH_QUERY_KEY});};const unsubscribe=deviceData.subscribe(key=>{if(key==='auth:identity')expired();});window.addEventListener("ion.session-expired",expired);window.addEventListener("online",expired);return()=>{unsubscribe();window.removeEventListener("ion.session-expired",expired);window.removeEventListener("online",expired);};},[queryClient]);

  const authState: AuthState =
    status === "pending"
      ? { type: "loading" }
      : status === "error"
        ? {
            type: "unauthenticated",
            errorMessage:
              error instanceof Error ? error.message : "Session check failed",
          }
        : data
          ? { type: "authenticated", user: data }
          : { type: "unauthenticated" };

  const logout = useCallback(async () => {
    await postLogout();
    const old=deviceData.identity();if(old&&old!=='guest')await deviceData.clear(old);await deviceData.session(null);deviceData.setIdentity(null);
    try{localStorage.removeItem("ion.private-space.v1");}catch{}
    try{sessionStorage.removeItem("ion.word-drafts.v1");}catch{}
    window.location.assign("/");
    // Invalidate all queries after login so previous user's state don't corrupt new user state.
    queryClient.resetQueries();
  }, [queryClient]);

  // This should only be used for login. For user profile changes, create separate endpoints and react query hooks
  // and update the data linked to AUTH_QUERY_KEY.
  const onLogin = useCallback(
    (user: User) => {
      const old=deviceData.identity();if(old&&old!=='guest'&&old!==String(user.id))void deviceData.clear(old);deviceData.setIdentity(user.id);void deviceData.session(null);void queryClient.cancelQueries({queryKey:AUTH_QUERY_KEY});queryClient.setQueryData(AUTH_QUERY_KEY,user);void queryClient.invalidateQueries({queryKey:AUTH_QUERY_KEY});
    },
    [queryClient]
  );

  return (
    <AuthContext.Provider value={{ authState, logout, onLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

// Prefer using protectedRoutes instead of this hook unless the route doesn't need to be protected (e.g. login/register)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};
