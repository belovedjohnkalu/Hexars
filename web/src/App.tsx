import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/home";
import Glinski from "./pages/glinski";
import McCooey from "./pages/mccooey";
import Shafran from "./pages/shafran";
import Brusky from "./pages/brusky";
import DeVasa from "./pages/devasa";
const Foundation = import.meta.env.DEV ? lazy(() => import("./Foundation")) : null;
export default function App() {
  return Foundation && new URLSearchParams(window.location.search).has("foundation")
    ? <Suspense fallback={<p>Opening diagnostics…</p>}><Foundation /></Suspense>
    : <BrowserRouter><Routes><Route path="/" element={<Home />} /><Route path="/glinski" element={<Glinski />} /><Route path="/mccooey" element={<McCooey />} /><Route path="/shafran" element={<Shafran />} /><Route path="/brusky" element={<Brusky/>}/><Route path="/devasa" element={<DeVasa/>}/><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>;
}
