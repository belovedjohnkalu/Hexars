import {spawnSync} from 'node:child_process';
import {existsSync,mkdirSync} from 'node:fs';
const win=process.platform==='win32',compiler=process.env.HEXCHESS_CXX||(win&&existsSync('C:\\msys64\\ucrt64\\bin\\g++.exe')?'C:\\msys64\\ucrt64\\bin\\g++.exe':'g++');
mkdirSync('build',{recursive:true});
const rules=['shared/src/geometry.cpp','shared/src/hex_rules.cpp','shared/src/wellisch_rules.cpp',...['glinski','mccooey','shafran','brusky','devasa','wellisch','variant'].map(v=>'shared/variants/'+v+'.cpp')];
for(const [folder,name] of [['engine-2','positional'],['engine-3','defensive'],['engine-4','materialist'],['engine-5','unconventional'],['engine-6','universal']]){
 const output='build/'+name+'-search-tests'+(win?'.exe':'');
 for(const [cmd,args] of [[compiler,['-std=c++20','-O2','-Wall','-Wextra','-Wpedantic','-Ishared/include','tests/engine/search-quality.cpp','engines/'+folder+'/search.cpp',...rules,'-o',output]],[output,[]]]){
  const result=spawnSync(cmd,args,{stdio:'inherit',timeout:600000});if(result.status!==0)process.exit(result.status||1);
 }
}

const oracle='build/materialist-oracle-tests'+(win?'.exe':'');
for(const [cmd,args] of [[compiler,['-std=c++20','-O2','-Wall','-Wextra','-Wpedantic','-Ishared/include','tests/engine/materialist-oracle.cpp','engines/engine-4/search.cpp',...rules,'-o',oracle]],[oracle,[]]]){
 const result=spawnSync(cmd,args,{stdio:'inherit',timeout:600000});if(result.status!==0)process.exit(result.status||1);
}
