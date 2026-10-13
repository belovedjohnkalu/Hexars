import { lazy, Suspense } from "react";
import CloudGame from "../../cloud/floot/pages/_index";
const Foundation = lazy(() => import("./Foundation"));
export default function App() {
  return new URLSearchParams(window.location.search).has("foundation")
    ? <Suspense fallback={<p>Opening diagnostics…</p>}><Foundation /></Suspense>
    : <CloudGame />;
}
