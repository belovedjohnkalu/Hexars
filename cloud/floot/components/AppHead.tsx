import { Helmet } from "react-helmet";
import { preload } from "react-dom";
export function AppHead({ title = "ION" }: { title?: string }) {
  const chess=title.includes("Hexagonal Chess")||new URLSearchParams(window.location.search).get("scope")==="chess"||!!new URLSearchParams(window.location.search).get("cloud")?.match(/^(boards|rules|engines|online|tactical|positional|chess-history|history-|.*-rules|.*-rule-)/);
  preload("/_cdn/static/6e6c9250-599e-4bf4-a9ae-66ff948afb59-InterVariable.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return <Helmet htmlAttributes={{lang:"en"}}>
    <title>{title}</title>
    <meta name="description" content="A space for your thoughts. Open a cloud and explore." />
    <meta name="theme-color" content="#000000" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="ION" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/_cdn/static/2a58e00d-89d7-4340-b909-a15fcf06f362.png" />
    <link rel="icon" type={chess?"image/png":"image/svg+xml"} href={chess?"/_cdn/static/5212c476-8b1a-456c-8c0f-0186a23e999a.png":"/_api/icon?v=2"} />
  </Helmet>;
}
