// The ownership suite must fail if the host's remote-seat guard is removed.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const source=fs.readFileSync(path.join(__dirname,'../dist/coop-core.js'),'utf8');
const guard='if(down&&this.active&&owns(this.remoteRole,key))return;';
if(!source.includes(guard))throw Error('Mutation target changed; update the test.');
const folder=path.join(__dirname,'../test-results');fs.mkdirSync(folder,{recursive:true});
const mutant=path.join(folder,'mutant-core.cjs');
try{
 fs.writeFileSync(mutant,source.replace(guard,''));
 const result=spawnSync(process.execPath,['--test',path.join(__dirname,'coop-core.test.cjs')],{env:{...process.env,COOP_CORE_PATH:mutant},encoding:'utf8'});
 if(result.status!==1||!result.stdout.includes('each seat owns disjoint controls'))throw Error('Ownership mutation did not fail in the expected test.');
 console.log('RESULT: PASS — ownership bypass mutant rejected by the real input suite.');
}finally{fs.unlinkSync(mutant);}
