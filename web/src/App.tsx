import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Home from "../../cloud/floot/pages/_index";
import Glinski from "../../cloud/floot/pages/glinski";
import McCooey from "../../cloud/floot/pages/mccooey";
const Foundation = lazy(() => import("./Foundation"));
export default function App() {
  return new URLSearchParams(window.location.search).has("foundation")
    ? <Suspense fallback={<p>Opening diagnostics…</p>}><Foundation /></Suspense>
    : <BrowserRouter><Routes><Route path="/" element={<Home />} /><Route path="/glinski" element={<Glinski />} /><Route path="/mccooey" element={<McCooey />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>;
}
