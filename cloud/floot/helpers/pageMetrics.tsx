import {characterLength} from './cloudText';
// Only count already rendered, authorized content. This never fetches another
// account, hidden variant, or unvisited page to estimate a view's size.
export function pageCharacters(root:ParentNode):number|undefined{
 if(root.querySelector('[data-canvas-ready="false"]'))return undefined;
 const explicit=root.querySelector<HTMLElement>('[data-page-characters]');if(explicit){const n=Number(explicit.dataset.pageCharacters);if(Number.isSafeInteger(n)&&n>=0)return n;}
 const title=characterLength(root.querySelector('header h1')?.textContent||''),clouds=[...root.querySelectorAll<HTMLElement>('main [data-node-id]')];
 if(clouds.length)return title+clouds.reduce((n,c)=>n+characterLength(c.dataset.cloudName||c.getAttribute('aria-label')||'')+Math.max(0,Number(c.dataset.characters)||0),0);
 return title+characterLength(root.querySelector('main')?.textContent?.trim()||'');
}
