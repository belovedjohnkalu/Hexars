// One common normalization preserves every positive character-count ratio.
// Empty clouds use the smallest positive weight; an all-empty set is equal.
export function proportionalCloudScale(values:Array<number|undefined>){
 const weights=values.map(n=>typeof n==='number'&&Number.isFinite(n)&&n>0?n:0),positive=weights.filter(n=>n>0),smallest=positive.length?Math.min(...positive):1,largest=positive.length?Math.max(...positive):1;
 const scales=weights.map(n=>(n||smallest)/largest);
 return{scales,maxZoom:Math.max(3,3/Math.min(...scales,1))};
}
