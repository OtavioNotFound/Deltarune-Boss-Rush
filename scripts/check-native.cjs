// Cross-language integration check: Python-produced patch, browser decoder, compiled game.
const fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const {apply}=require('../dist/native-battle.js');
(async()=>{
 const scratch=process.argv[2];if(!scratch)throw Error('Supply a directory containing original chN.unx and compiled patchedN.unx files.');
 for(let ch=1;ch<=5;ch++){
  let original=fs.readFileSync(path.join(scratch,`ch${ch}.unx`));
  const folder=path.join(__dirname,`../dist/chapter${ch}`);
  const compressed=fs.existsSync(path.join(folder,'battle.patch.json'))?Buffer.concat(JSON.parse(fs.readFileSync(path.join(folder,'battle.patch.json'))).parts.map(name=>fs.readFileSync(path.join(folder,name)))):fs.readFileSync(path.join(folder,'battle.patch.gz'));
  let payload=zlib.gunzipSync(compressed);
  let output=await apply(original,payload),expected=fs.readFileSync(path.join(scratch,`${process.argv[3]||"patched"}${ch}.unx`));
  if(!Buffer.from(output).equals(expected))throw Error('Native game reconstruction differs, chapter '+ch);
  if(ch===1){original[0]^=1;let rejected=false;try{await apply(original,payload)}catch{rejected=true}if(!rejected)throw Error('Changed upstream game was not rejected.');}
  console.log(`Chapter ${ch}: browser decoder matches compiled game.`);
  original=payload=output=expected=null;global.gc?.();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
