import { Helmet } from "react-helmet";
import { preload } from "react-dom";
export function AppHead({ title = "ION" }: { title?: string }) {
  preload("/_cdn/static/6e6c9250-599e-4bf4-a9ae-66ff948afb59-InterVariable.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return <Helmet>
    <title>{title}</title>
    <meta name="description" content="A space for your thoughts. Open a cloud and explore." />
    <meta name="theme-color" content="#050810" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="ION" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/_cdn/static/bbff6547-57ce-49ce-8f0a-92ee7a03d999-hexars-dark-180.png" />
    <link rel="icon" href="/_cdn/static/f72178ec-847d-48d7-ada5-e64a1ed04bd4-hexars-dark-192.png" />
  </Helmet>;
}
