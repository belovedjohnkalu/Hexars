import { useAppearance,appearanceChrome,appearanceBootstrap,readDarkAppearance } from '../helpers/useAppearance';
import { Helmet } from "react-helmet";
import { preload } from "react-dom";
export function AppHead({ title = "ION",iconUrl }: { title?: string;iconUrl?:string }) {
  const {dark}=useAppearance(),chrome=appearanceChrome(typeof window==='undefined'?dark:readDarkAppearance());

  preload("/_cdn/static/6e6c9250-599e-4bf4-a9ae-66ff948afb59-InterVariable.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return <Helmet htmlAttributes={{lang:"en"}}>
    <title>{title}</title>
    <meta name="description" content="Your clouds and droplets. Open one and explore." />
    <meta name="theme-color" content={chrome.themeColor} />
    <meta name="color-scheme" content={chrome.colorScheme} />
    <script id="ion-appearance-bootstrap" type="text/javascript">{appearanceBootstrap}</script>
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="ION" />
    <meta name="apple-mobile-web-app-status-bar-style" content={chrome.statusBarStyle} />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/_cdn/static/05f18ada-46bb-4d90-9cb3-5594bbd781cc-ion-geometric-mark-512.png" />
    <link rel="icon" type={iconUrl?"image/png":"image/svg+xml"} href={iconUrl||"/_api/icon?v=5"} />
  </Helmet>;
}
