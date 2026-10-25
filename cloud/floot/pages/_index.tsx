import {ILNavigator} from '../components/ILNavigator';
import { useEffect, useState } from "react";
import { useLocation,useNavigate } from "react-router-dom";
import { CloudExplorer } from "../components/CloudExplorer";
import { AppHead } from "../components/AppHead";
import { HexLoading } from "../components/HexLoading";
import { postGame } from "../endpoints/game_POST.schema";
import { gameSessions } from "../helpers/gameSessions";
export default function Home(){const location=useLocation(),il=new URLSearchParams(location.search).get('il');return il!==null?<ILNavigator il={il}/>:<HomeContent/>;}
function HomeContent() {
  const navigate=useNavigate();
  const [opening,setOpening]=useState(()=>!!gameSessions.fromHash()),[error,setError]=useState(false);
  useEffect(()=>{
    const controller=new AbortController(),linked=gameSessions.fromHash();
    if(linked)void postGame({action:"get",...linked},{signal:controller.signal}).then(result=>{
      if(!controller.signal.aborted){gameSessions.save(result);navigate("/"+result.game.variant+"#"+gameSessions.hash(result),{replace:true});}
    }).catch(()=>{if(!controller.signal.aborted){setOpening(false);setError(true);}});
    return()=>controller.abort();
  },[navigate]);
  if(opening)return <main style={{minHeight:"100dvh",display:"grid",placeContent:"center"}} role="status"><AppHead/><HexLoading/><p>Opening…</p></main>;
  return <>{error&&<p role="alert" style={{color:"var(--error)",textAlign:"center"}}>Game link unavailable.</p>}<CloudExplorer/></>;
}
