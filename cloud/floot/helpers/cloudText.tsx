// A line contains at most eight complete words. Stored names stay untouched.
export function cloudTextLines(name:string,wrap?:{width?:number;measure?:(text:string)=>number;wordsPerLine?:number}):string[]{
 const words=name.trim().split(/\s+/).filter(Boolean),lines:string[]=[];let line:string[]=[];
 for(const word of words){const next=[...line,word];if(line.length&&(line.length===Math.max(1,Math.floor(wrap?.wordsPerLine??8))||wrap?.measure&&wrap.width!==undefined&&wrap.measure(next.join(' '))>wrap.width)){lines.push(line.join(' '));line=[word];}else line=next;}if(line.length)lines.push(line.join(' '));return lines.length?lines:[''];
}
export const cloudText=(name:string)=>cloudTextLines(name).join('\n');
export const characterLength=(text:string)=>Array.from(text).length;

export const tileTextLines=(name:string,_columns=1)=>cloudTextLines(name,{wordsPerLine:8});
