import type {PuzzleBank} from './dailyPuzzleTypes';
import type {VariantId} from '../endpoints/game_POST.schema';
// Explicit server-only imports keep answers out of the browser bundle.
const banks:Record<VariantId,()=>Promise<{dailyPuzzleData:PuzzleBank}>>={
 glinski:()=>import('./dailyGlinskiPuzzles'),mccooey:()=>import('./dailyMccooeyPuzzles'),
 shafran:()=>import('./dailyShafranPuzzles'),brusky:()=>import('./dailyBruskyPuzzles'),
 devasa:()=>import('./dailyDevasaPuzzles'),wellisch:()=>import('./dailyWellischPuzzles'),
 hexdame:()=>import('./dailyHexdamePuzzles'),kruzno:()=>import('./dailyKruznoPuzzles'),
};
export async function dailyPuzzleBank(variant:VariantId){return(await banks[variant]()).dailyPuzzleData;}
