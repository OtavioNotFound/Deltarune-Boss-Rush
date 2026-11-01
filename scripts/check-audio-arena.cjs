const fs=require('node:fs'),path=require('node:path');
const {prepare}=require('../dist/native-battle.js');
const scratch=process.argv[2];
global.location={origin:'https://test.invalid'};global.document={getElementById:()=>null};
global.fetch=async url=>{const file=path.join(__dirname,'../dist',new URL(url).pathname);try{return new Response(fs.readFileSync(file));}catch{return new Response('',{status:404});}};
(async()=>{
 for(const ch of [1,5]){
  global.BOSSROOM_CHAPTER=ch;
  const original=fs.readFileSync(path.join(scratch,`ch${ch}.unx`));
  const output=await prepare(original);
  const expected=fs.readFileSync(path.join(scratch,ch===1?'fixed1.unx':'native-music5.unx'));
  if(!Buffer.from(output).equals(expected))throw Error('Reconstruction differs');
  original[0]^=1;let rejected=false;try{await prepare(original)}catch{rejected=true}if(!rejected)throw Error('Altered source accepted');
  console.log(`Chapter ${ch}: production loader downloads, verifies and reconstructs compiled game; changed source rejected.`);
 }
})().catch(e=>{console.error(e);process.exitCode=1});
