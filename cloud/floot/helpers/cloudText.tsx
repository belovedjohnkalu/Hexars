// A line contains at most eight complete words. Stored names stay untouched.
export function cloudTextLines(name:string):string[]{
 const words=name.trim().split(/\s+/).filter(Boolean),lines:string[]=[];
 for(let i=0;i<words.length;i+=8)lines.push(words.slice(i,i+8).join(' '));
 return lines.length?lines:[''];
}
export const cloudText=(name:string)=>cloudTextLines(name).join('\n');
export const characterLength=(text:string)=>Array.from(text).length;
