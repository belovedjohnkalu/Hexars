import { describe, expect, it } from "vitest";
import { supportsManualHomeScreen } from "../helpers/installSupport";
const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1";
const ipad = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15";
const environment = { secureContext: true, topLevel: true, maxTouchPoints: 5 };
describe("Home-screen installation compatibility", () => {
  it("offers manual installation in iPhone Safari and touch iPadOS Safari", () => {
    expect(supportsManualHomeScreen({ ...environment, userAgent: iphone })).toBe(true);
    expect(supportsManualHomeScreen({ ...environment, userAgent: ipad })).toBe(true);
  });
  it("does not assume that a desktop or an Android device can install", () => {
    expect(supportsManualHomeScreen({ ...environment, maxTouchPoints: 0, userAgent: ipad })).toBe(false);
    expect(supportsManualHomeScreen({ ...environment, userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/120.0 Mobile Safari/537.36" })).toBe(false);
    expect(supportsManualHomeScreen({ ...environment, userAgent: "Mozilla/5.0 Firefox/120.0" })).toBe(false);
  });
  it("hides the manual action in embedded browsers, unsupported browsers, frames and insecure contexts", () => {
    for (const marker of ["FBAN", "FBAV", "Instagram", "GSA", "CriOS", "FxiOS", "EdgiOS", "MicroMessenger"])
      expect(supportsManualHomeScreen({ ...environment, userAgent: iphone + " " + marker })).toBe(false);
    expect(supportsManualHomeScreen({ ...environment, userAgent: iphone.replace("Version/17.0 ", "") })).toBe(false);
    expect(supportsManualHomeScreen({ ...environment, userAgent: iphone, topLevel: false })).toBe(false);
    expect(supportsManualHomeScreen({ ...environment, userAgent: iphone, secureContext: false })).toBe(false);
  });
});
