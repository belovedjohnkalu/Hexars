import { useEffect, useState } from 'react';
import { gameSessions } from './gameSessions';

export function useChessResume(userId:number|null) {
  const [state,setState]=useState(()=>({userId,value:gameSessions.last(userId)}));
  useEffect(()=>{const update=()=>setState({userId,value:gameSessions.last(userId)});update();window.addEventListener('ion.game-saved',update);window.addEventListener('storage',update);return()=>{window.removeEventListener('ion.game-saved',update);window.removeEventListener('storage',update);};},[userId]);
  return state.userId===userId?state.value:null;
}
