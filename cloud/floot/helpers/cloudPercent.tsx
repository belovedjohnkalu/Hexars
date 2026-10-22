// Exact decimal percentage for integer descendant-character counts.
// Layout uses the numeric projection; the browser ultimately renders pixels.
export function cloudPercent(value:number,min:number,max:number){
 if(max===min)return {value:50,exact:'50.0000000000000000'};
 const precision=10n**16n,scaled=BigInt(value-min)*100n*precision/BigInt(max-min);
 const exact=(scaled/precision).toString()+'.'+(scaled%precision).toString().padStart(16,'0');
 return {value:Number(exact),exact};
}
