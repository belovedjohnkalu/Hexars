export const cloudColors=['white','blue','cyan','mint','amber','coral','rose','lavender'] as const;
export type CloudColor=typeof cloudColors[number];
export const colorName=(color:CloudColor)=>color[0].toUpperCase()+color.slice(1);
export const colorValue=(color?:CloudColor)=>'var(--word-'+(color||'white')+')';
