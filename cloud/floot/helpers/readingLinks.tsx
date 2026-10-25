export type ReadingPart={text:string;href?:string;external?:boolean};
// Work from the whole source so a long URL stays clickable across fitted pages.
export function readingLinks(source:string,start:number,length:number,link?:{label:string;to:string}):ReadingPart[]{
 const end=start+length,ranges:Array<{start:number;end:number;href:string;external:boolean}>=[];
 for(const match of source.matchAll(/https?:\/\/[^\s<>]+/g)){const url=match[0].replace(/[.,;]+$/,'');try{new URL(url);ranges.push({start:match.index!,end:match.index!+url.length,href:url,external:true});}catch{}}
 if(link){const i=source.indexOf(link.label);if(i>=0&&!ranges.some(r=>i<r.end&&i+link.label.length>r.start))ranges.push({start:i,end:i+link.label.length,href:link.to,external:false});}
 const out:ReadingPart[]=[];let at=start;
 for(const range of ranges.sort((a,b)=>a.start-b.start)){if(range.end<=at||range.start>=end)continue;const a=Math.max(at,range.start),b=Math.min(end,range.end);if(a>at)out.push({text:source.slice(at,a)});out.push({text:source.slice(a,b),href:range.href,external:range.external});at=b;}
 if(at<end)out.push({text:source.slice(at,end)});return out;
}
