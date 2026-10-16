import { preload } from "react-dom";
export function AppHead({ title = "ION" }: { title?: string }) {
  preload("/fonts/InterVariable.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return <>
    <title>{title}</title>
    <meta name="description" content="Choose a board. Play hexagonal chess." />
    <meta name="theme-color" content="#050810" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="ION" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="icon" href="/icons/icon-192.png" />
  </>;
}
