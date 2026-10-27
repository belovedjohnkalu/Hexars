// Keep exact proportions above a visible floor. Tiny and empty clouds must
// remain discoverable beside a much larger one; an all-empty set is equal.
export const minimumCloudScale=.5;
export function proportionalCloudScale(values:Array<number|undefined>){
 const weights=values.map(n=>typeof n==='number'&&Number.isFinite(n)&&n>0?n:0),positive=weights.filter(n=>n>0),smallest=positive.length?Math.min(...positive):1,largest=positive.length?Math.max(...positive):1;
 const scales=weights.map(n=>Math.max(minimumCloudScale,(n||smallest)/largest));
 return{scales,maxZoom:Math.max(3,3/Math.min(...scales,1))};
}
