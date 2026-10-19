import { appMarkSVG } from '../helpers/appMark';
export async function handle(){return new Response(appMarkSVG,{headers:{'Content-Type':'image/svg+xml','Cache-Control':'public,max-age=86400'}});}
