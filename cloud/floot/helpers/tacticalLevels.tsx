export const tacticalLevels=[
 {level:0,name:'Pre-Beginner',limits:{timeMs:40,depth:1,nodeLimit:125}},
 {level:1,name:'Beginner',limits:{timeMs:80,depth:1,nodeLimit:250}},
 {level:2,name:'Easy',limits:{timeMs:200,depth:2,nodeLimit:1800}},
 {level:3,name:'Medium',limits:{timeMs:750,depth:3,nodeLimit:30000}},
 {level:4,name:'Hard',limits:{timeMs:1500,depth:4,nodeLimit:100000}},
 {level:5,name:'Expert',limits:{timeMs:3000,depth:5,nodeLimit:300000}},
] as const;
