import {useTime} from './useTime';
export function useDisplayName(id:string,fallback:string){return useTime().snapshot?.labels?.[id]||fallback;}
