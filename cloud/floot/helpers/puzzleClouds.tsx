import {chessVariants} from './chessVariants';
import type {CloudNode} from '../endpoints/cloud_POST.schema';
export const chessPuzzlesId='6a7b29cf-c0cc-4794-82fa-3b67a4480a47',checkersPuzzlesId='53abf83d-469a-41a7-b3bc-b1a3da5704bd';
export const puzzleRoot=(variant:string)=>chessVariants.isCheckers(variant)?checkersPuzzlesId:chessPuzzlesId;
export const puzzleClouds:CloudNode[]=[
 {id:chessPuzzlesId,parentId:'d8b61dd3-a222-492d-8ccc-9dc08cf12cd2',name:'Puzzles',color:'rose',system:true},
 {id:checkersPuzzlesId,parentId:'a6cded5d-3392-482a-8fcf-f3bded201a8e',name:'Puzzles',color:'rose',system:true},
 ...chessVariants.all.flatMap((v,i)=>[
  {id:'puzzle-'+v.id,parentId:puzzleRoot(v.id),name:v.name,variant:v.id,isImage:true,color:(['cyan','lavender','rose','amber','mint','blue'] as const)[i%6],system:true},
  ...(['goal','hint','reset','all','rules'] as const).map((key,j)=>({id:'puzzle-'+v.id+'-'+key,parentId:'puzzle-'+v.id,name:['Today','Hint','Again','Puzzles','Rules'][j],variant:v.id,color:(['amber','cyan','mint','lavender','blue'] as const)[j],system:true})),
 ]),
];
