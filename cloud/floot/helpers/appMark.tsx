// One geometry source for the app icon and its animated loading mark.
export const markPaths=['M375 170H855L1110 620H625Z','M625 620L855 1040L1110 620','M625 620L370 1035L145 620'];
export const appMarkSVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 1280"><rect width="1280" height="1280" fill="#000"/><g fill="none" stroke="#fff" stroke-width="14" stroke-linejoin="miter">'+markPaths.map(d=>'<path d="'+d+'"/>').join('')+'</g></svg>';
