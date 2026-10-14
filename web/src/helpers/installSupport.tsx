// A native prompt proves support. Safari on iOS/iPadOS offers a manual route;
// embedded browsers and frames do not expose that operating-system action.
export function supportsManualHomeScreen(input: {
  userAgent: string;
  maxTouchPoints: number;
  secureContext: boolean;
  topLevel: boolean;
}) {
  if (!input.secureContext || !input.topLevel) return false;
  const ua = input.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && input.maxTouchPoints > 1);
  const safari = /Version\/\d/.test(ua) && /Safari\//.test(ua);
  const embedded = /CriOS|FxiOS|EdgiOS|OPiOS|GSA|DuckDuckGo|FBAN|FBAV|Instagram|Line\/|MicroMessenger/.test(ua);
  return ios && safari && !embedded;
}
