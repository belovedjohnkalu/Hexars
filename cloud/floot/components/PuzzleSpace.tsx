import {openCloudControls} from '../helpers/cloudControlPopup';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {CloudBoard} from './CloudBoard';
import {CloudCanvas} from './CloudCanvas';
import {Button} from './Button';
import {LoadingScreen} from './LoadingScreen';
import {useDailyPuzzle} from '../helpers/useDailyPuzzle';
import {gameFacing} from '../helpers/gameFacing';
import {checkersStepView,pathPrefix} from '../helpers/checkersInteraction';
import {cloudURL} from '../helpers/cloudRoutes';
import {puzzleRoot} from '../helpers/puzzleClouds';
import {chessVariants} from '../helpers/chessVariants';
import type {CloudNode} from '../endpoints/cloud_POST.schema';
import type {Hex,ChessMove,VariantId} from '../endpoints/game_POST.schema';
import styles from './PuzzleSpace.module.css';
const same=(a:Hex,b:Hex)=>a.q===b.q&&a.r===b.r;
const input=(m:ChessMove):ChessMove=>({from:m.from,to:m.to,...(m.path?{path:m.path}:{}),...(m.promotion?{promotion:m.promotion}:{})});
const goals={mate:'Mate in one',king:'Capture a king',promote:'Promote in one',win:'Win in one'};
export function PuzzleSpace({variant,nodes,userId,dev=false}:{variant:VariantId;nodes:CloudNode[];userId:number|null;dev?:boolean}){
 const live=useDailyPuzzle(variant,userId),puzzle=live.puzzle,navigate=useNavigate(),location=useLocation(),[selected,setSelected]=useState<Hex|null>(null),[path,setPath]=useState<Hex[]>([]),[phase,setPhase]=useState<'play'|'wrong'|'solved'|'hint'>('play'),loaded=useRef('');
 const [practice,setPractice]=useState(false),[last,setLast]=useState<ChessMove|undefined>();
 useEffect(()=>{if(puzzle&&loaded.current!==puzzle.id){loaded.current=puzzle.id;setSelected(null);setPath([]);setPhase(puzzle.after?'solved':'play');setPractice(false);setLast(puzzle.move);}},[puzzle?.id]);
 useEffect(()=>{if(puzzle?.after&&!practice){setPhase('solved');setLast(puzzle.move);setSelected(null);setPath([]);}},[puzzle?.after,practice]);
 const checkers=chessVariants.isCheckers(variant),game=puzzle?phase==='solved'&&!practice&&puzzle.after?puzzle.after:puzzle.game:null,display=game&&checkers&&path.length>1?checkersStepView(game,path):game,facing=gameFacing(variant,puzzle?.game.activePlayer||0);
 const id='puzzle-'+variant,definitions=useMemo(()=>nodes.filter(n=>n.parentId===id),[nodes,id]);
 const actions=definitions.filter(n=>!n.id.endsWith('-goal')&&(!n.id.endsWith('-hint')||phase!=='solved')).map(n=>n.id.endsWith('-all')?{...n,href:cloudURL(puzzleRoot(variant),'chess')}:n.id.endsWith('-rules')?{...n,href:cloudURL(variant+'-rules','chess')}:{...n,destination:'control' as const,control:'copy-text' as const});
 async function play(move:ChessMove){setSelected(null);setPath([]);const result=await live.attempt(input(move));if(!result)return;setLast(result.correct?move:undefined);setPractice(!result.correct&&!!puzzle?.progress.solved);setPhase(result.correct?'solved':'wrong');}
 function choose(hex:Hex){
  if(!game||live.busy||phase==='solved'&&!practice)return;
  if(checkers){const next=game.legalMoves.filter(m=>path.length&&pathPrefix(m,path)&&m.path&&same(m.path[path.length]??m.to,hex));if(next.length){const advanced=[...path,hex],complete=next.find(m=>m.path!.length===advanced.length);if(complete)void play(complete);else setPath(advanced);return;}if(path.length&&same(path[path.length-1],hex)){setSelected(null);setPath([]);return;}const own=game.board.cells.find(c=>same(c,hex))?.piece?.player===game.activePlayer;setSelected(own?hex:null);setPath(own?[hex]:[]);return;}
  const matches=game.legalMoves.filter(m=>selected&&same(m.from,selected)&&same(m.to,hex));if(matches.length){void play(matches[0]);return;}
  setSelected(selected&&same(selected,hex)?null:game.board.cells.find(c=>same(c,hex))?.piece?.player===game.activePlayer?hex:null);
 }
 function reset(){setSelected(null);setPath([]);setPhase('play');setPractice(true);setLast(undefined);}
 async function hint(){if(live.busy)return;const result=await live.hint();if(result?.hint){setSelected(result.hint);setPath(checkers?[result.hint]:[]);setPhase('hint');}}
 if(live.loading&&!puzzle)return <LoadingScreen label="Opening today’s puzzle"/>;
 if(!puzzle)return <div className={styles.empty}><p role="alert">{live.error||'Puzzle unavailable'}</p><Button variant="ghost" onClick={()=>void live.reload()}>Retry</Button></div>;
 const goal=definitions.find(n=>n.id.endsWith('-goal')),goalLabel=goal?.contentEdits?.includes('name')?goal.name:goals[puzzle.goal];
 return <section className={styles.space} data-puzzle-id={puzzle.id} data-puzzle-phase={phase} data-puzzle-version={puzzle.progress.version}>
  <div className={styles.heading}><h2>{goalLabel}</h2><p className={styles.side}>{['White','Black','Red'][puzzle.game.activePlayer]} to move</p><p className={styles.status} data-phase={phase} role="status" aria-live="polite">{live.busy?'Checking…':phase==='solved'?'Solved':phase==='wrong'?'Try another move':phase==='hint'?'Try this piece':'Today'}</p></div>
  <div className={styles.content}><div className={styles.board}><CloudBoard game={display!} selected={selected} onCell={choose} flipped={typeof facing==='boolean'?facing:false} rotation={typeof facing==='number'?facing:undefined} coordinates={false} theme="neutral" lastMove={phase==='solved'?last:path.length>1?{from:path[path.length-2],to:path[path.length-1]}:undefined} disabled={live.busy||phase==='solved'&&!practice}/></div>
  <div className={styles.actions} aria-busy={live.busy}><CloudCanvas identity={'puzzles:'+(userId??'guest')} nodes={actions} parentId={id} scope="chess" opening={null} loading={false} showIdentifiers={dev} onOpen={(e,_id,to)=>{e.preventDefault();navigate(to);}} onHighlight={n=>openCloudControls(n,'chess',location.pathname+location.search)} onCommand={n=>{if(n.id.endsWith('-hint'))void hint();else if(n.id.endsWith('-reset'))reset();}}/></div></div>
  {live.error&&<div className={styles.error} role="alert"><span>{live.error}</span><Button variant="ghost" onClick={()=>void live.reload()}>Retry</Button></div>}
 </section>;
}
