import { db } from './db';
import { savedGameCutoff } from './gameRetention';
// One daily batch, using the save timestamp rather than page views.
export async function expireSavedGames(){
 const cutoff=savedGameCutoff();
 const result=await db.deleteFrom('hexchessGames').where('updatedAt','<=',cutoff).executeTakeFirst();
 console.log('Expired saved chess games:',Number(result.numDeletedRows));
}
