// floot:external — Browser favicon and installed-web-app icon resource.
import { appMarkSVG } from '../helpers/appMark';
export async function handle(){return new Response(appMarkSVG,{headers:{'Content-Type':'image/svg+xml','Cache-Control':'public,max-age=86400'}});}
