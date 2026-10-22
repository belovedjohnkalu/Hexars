import { AppearanceSync } from '../helpers/useAppearance';
import { PageWorkspace } from './PageWorkspace';
import { TimeProvider } from '../helpers/useTime';
import { HistoryKeys } from './HistoryKeys';
import { useVisualViewport } from "../helpers/useVisualViewport";
import { AuthProvider } from "../helpers/useAuth";
import { ReactNode, useEffect } from "react";
import { cloudDrafts } from "../helpers/cloudDrafts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeModeProvider } from "../helpers/themeMode";
import { TooltipProvider } from "./Tooltip";
import { SonnerToaster } from "./SonnerToaster";
import { ScrollToHashElement } from "./ScrollToHashElement";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute “fresh” window
    },
  },
});

export const GlobalContextProviders = ({
  children,
}: {
  children: ReactNode;
}) => {
  useVisualViewport();
  useEffect(()=>{const guard=(event:BeforeUnloadEvent)=>{if(cloudDrafts.hasPictures()){event.preventDefault();event.returnValue="";}};window.addEventListener("beforeunload",guard);return()=>window.removeEventListener("beforeunload",guard);},[]);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider><TimeProvider><ThemeModeProvider>
        <AppearanceSync />
        <ScrollToHashElement />
        <HistoryKeys />
        <TooltipProvider>
          <PageWorkspace>{children}</PageWorkspace>
          <SonnerToaster />
        </TooltipProvider>
      </ThemeModeProvider></TimeProvider></AuthProvider>
    </QueryClientProvider>
  );
};
