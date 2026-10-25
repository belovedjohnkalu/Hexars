// One free Computer replaces the retired engine catalog. Legacy executable IDs
// remain valid only for resuming saved games; they are no longer paid features.
export function isFreeVariant(variant:string){return variant==='glinski'||variant==='hexdame';}
export function isPaidFeatureId(id:string){return !id.startsWith('engine:')&&!['variant:glinski','variant:hexdame'].includes(id);}
export const computerLevelIds=Array.from({length:6},(_,level)=>'computer-level-'+level);

export function isRetiredPriceCloud(id:string){const match=/^time-(?:price-(?:value-)?|purchase-|cost-)(.+)$/.exec(id);return !!match&&!isPaidFeatureId(match[1]);}
