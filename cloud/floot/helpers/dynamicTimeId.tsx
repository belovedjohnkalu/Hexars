export function dynamicTimeId(id:string){return /^(?:time-tx-[a-f0-9-]{36}(?:-(?:amount|other|kind|date|copy|feature|creation|buyers))?|work-session-[a-f0-9-]{36})$/.test(id);}
