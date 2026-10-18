export const SAVED_GAME_DAYS=30;
export const savedGameCutoff=(now=new Date())=>new Date(now.getTime()-SAVED_GAME_DAYS*24*60*60*1000);
export const savedGameExpired=(updatedAt:Date|string,now=new Date())=>new Date(updatedAt).getTime()<=savedGameCutoff(now).getTime();
