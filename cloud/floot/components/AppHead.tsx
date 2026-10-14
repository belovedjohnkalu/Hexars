import { Helmet } from "react-helmet";
export function AppHead({ title = "HEXARS" }: { title?: string }) {
  return <Helmet>
    <title>{title}</title>
    <meta name="description" content="Choose a board. Play hexagonal chess." />
    <meta name="theme-color" content="#050810" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="HEXARS" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/_cdn/static/bbff6547-57ce-49ce-8f0a-92ee7a03d999-hexars-dark-180.png" />
    <link rel="icon" href="/_cdn/static/f72178ec-847d-48d7-ada5-e64a1ed04bd4-hexars-dark-192.png" />
  </Helmet>;
}
