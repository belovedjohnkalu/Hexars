// k6: target only an explicitly provisioned staging deployment.
import http from 'k6/http';
import { check, sleep } from 'k6';
const origin=__ENV.ION_STAGING_ORIGIN;
const host=typeof origin==='string'?/^https:\/\/([a-z0-9.-]+)(?::[0-9]+)?\/?$/i.exec(origin)?.[1].toLowerCase():null;
if(!host||['ion.floot.app','iontech.info','www.iontech.info'].includes(host))throw Error('Set ION_STAGING_ORIGIN to a provisioned staging origin, never the live ION app.');
const vus=Number(__ENV.ION_VUS||20);
if(!Number.isInteger(vus)||vus<1||vus>1000000)throw Error('ION_VUS must be 1–1000000.');
export const options={scenarios:{visitors:{executor:'constant-vus',vus,duration:__ENV.ION_DURATION||'60s'}},thresholds:{http_req_failed:['rate<0.01'],http_req_duration:['p(95)<1000','p(99)<2500']}};
export default function(){
  const r=http.get(origin.replace(/\/$/,'')+'/_api/public_bootstrap?v=launch',{tags:{journey:'guest-bootstrap'}});
  check(r,{'public bootstrap succeeds':r=>r.status===200,'public view stays anonymous':r=>{try{const d=r.json();return d.time.userId===null&&!d.home.dev&&!d.chess.dev&&!d.home.userId&&!d.chess.userId;}catch{return false;}}});
  sleep(1+Math.random()*2);
}
