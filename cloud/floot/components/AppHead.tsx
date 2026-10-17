import { Helmet } from "react-helmet";
import { preload } from "react-dom";
export function AppHead({ title = "ION" }: { title?: string }) {
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
    <link rel="icon" type="image/svg+xml" href="/_api/icon?v=2" />
  </Helmet>;
}
