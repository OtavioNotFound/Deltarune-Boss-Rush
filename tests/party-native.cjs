/* Actual GameMaker VM objects, input, collision and HP; QA-only hooks are not shipped. */
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),serve=require('./static-server.cjs');
const until=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:30000});
const state=p=>p.evaluate(()=>BossRoomParty.state);
const key=(p,key,down)=>p.evaluate(({key,down})=>updateKey(key,down),{key,down});
async function tap(p,k){await key(p,k,true);await p.waitForTimeout(130);await key(p,k,false);await p.waitForTimeout(130);}
async function panel(p,open){if(await p.locator('#party-panel').evaluate(d=>d.open)!==open)await p.locator(open?'#party-open':'#party-close').click();}
async function connect(host,guest,seat){await panel(host,true);if(seat===1){await host.locator('#party-host').click();await until(host,()=>/^\d{6}$/.test(document.getElementById('party-code-display').textContent));}const code=await host.locator('#party-code-display').textContent();assert.match(code,/^\d{6}$/);await panel(guest,true);await guest.locator('#party-code').fill(code);await guest.locator('#party-join').click();await until(guest,n=>BossRoomCoop.active&&BossRoomParty.seat===n,seat);await panel(host,false);}
let seq=0;
async function command(host,verb,extra={}){const next=++seq;await host.evaluate(qa=>{BossRoomParty.qa=qa;},{seq:next,verb,...extra});await host.waitForFunction(n=>BossRoomParty.state?.qa===n,next,{timeout:15000});}
async function main(){
 const patch=path.resolve(process.env.PARTY_QA_PATCH||'local/chapter1/qa.patch.gz');if(!fs.existsSync(patch))throw Error('Build local QA native patch first; see COOP.md.');
 const server=await serve();let browser;const pages=[],errors=[];
 try{
  browser=await chromium.launch({channel:process.env.BOSSROOM_BROWSER_CHANNEL||'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  for(let i=0;i<3;i++){const p=await(await browser.newContext()).newPage();pages.push(p);p.on('pageerror',e=>errors.push(e.message));p.on('dialog',async d=>{errors.push(d.message());await d.dismiss();});await p.goto(server.url+'?boss=jevil');await p.waitForSelector('#launch');}
  const [host,guest,third]=pages;
  for(const page of pages)await page.route('**/chapter1/coop.patch.gz',route=>route.fulfill({path:patch,contentType:'application/gzip'}));
  await connect(host,guest,1);await guest.locator('[data-character="1"]').check();await guest.locator('[data-character="2"]').check();await panel(guest,false);
  await until(host,()=>BossRoomParty.owners[1]===1&&BossRoomParty.owners[2]===1);
  await host.locator('#launch').click();
  await host.waitForFunction(()=>BossRoomParty.state?.myfight===0&&BossRoomParty.state?.turn===0,null,{timeout:120000});
  await guest.waitForFunction(()=>BossRoomParty.localState?.myfight===0&&BossRoomParty.localState?.turn===0,null,{timeout:120000});
  assert.equal(await guest.evaluate(()=>BossRoomParty.localState.local_seat),1);
  // Native menu: only the owner can move/confirm the current character's action.
  const menu=(await state(host)).menu;await tap(guest,'ArrowRight');assert.equal((await state(host)).menu,menu);
  await tap(host,'ArrowLeft');assert.equal((await state(host)).menu,4);await guest.waitForFunction(()=>BossRoomParty.localState?.menu===4);await tap(host,'z');await until(host,()=>BossRoomParty.state.turn===1);await until(guest,()=>BossRoomParty.localState?.turn===1);
  const susieMenu=(await state(host)).menu;await tap(host,'ArrowRight');assert.equal((await state(host)).menu,susieMenu);
  await tap(guest,'ArrowLeft');await tap(guest,'z');await until(host,()=>BossRoomParty.state.turn===2);await until(guest,()=>BossRoomParty.localState?.turn===2);
  await command(host,'arena');await until(host,()=>BossRoomParty.state.hearts.length===2);
  const items=(await state(host)).items;assert.deepEqual(items.slice(0,12),[2,2,2,2,6,7,16,16,1,1,8,8]);assert.equal(items[12],999);
  assert.deepEqual((await state(host)).hearts.map(h=>h.seat).sort(),[0,1]);
  const before=(await state(host)).hearts;
  await key(guest,'ArrowRight',true);await host.waitForTimeout(330);await key(guest,'ArrowRight',false);
  let hearts=(await state(host)).hearts;assert.ok(hearts.find(h=>h.seat===1).x>before.find(h=>h.seat===1).x+10);assert.equal(hearts.find(h=>h.seat===0).x,before.find(h=>h.seat===0).x);
  await key(host,'ArrowLeft',true);await host.waitForTimeout(330);await key(host,'ArrowLeft',false);
  const hp=(await state(host)).hp;
  await command(host,'hit',{seat:1,target:0});await until(host,()=>BossRoomParty.state.hp[1]<110);
  let after=(await state(host)).hp;assert.equal(after[0],hp[0]);assert.equal(after[2],hp[2]);assert.ok(after[1]<hp[1]);
  // A different heart can take its hit while the first is invulnerable.
  await command(host,'hit',{seat:0,target:1});await until(host,()=>BossRoomParty.state.hp[0]<90);after=(await state(host)).hp;assert.ok(after[0]<hp[0]);assert.equal(after[2],hp[2]);
  const beforeRalsei=after.slice();await command(host,'hit',{seat:1,target:2});await until(host,()=>BossRoomParty.state.hp[2]<70);after=(await state(host)).hp;assert.equal(after[0],beforeRalsei[0]);assert.equal(after[1],beforeRalsei[1]);
  await command(host,'down',{character:2});const hpDown=(await state(host)).hp;
  await command(host,'hit',{seat:1,target:1});await host.waitForTimeout(100);after=(await state(host)).hp;assert.equal(after[0],hpDown[0]);assert.equal(after[1],0);assert.ok(after[2]<hpDown[2]);
  await command(host,'clear');await command(host,'heal');
  await panel(guest,true);await guest.locator('[data-character="2"]').uncheck();await panel(guest,false);await until(host,()=>BossRoomParty.owners[2]===-1);
  await connect(host,third,2);await until(third,()=>!document.querySelector('[data-character="2"]').disabled);await third.locator('[data-character="2"]').click();await panel(third,false);await until(host,()=>BossRoomParty.owners[2]===2);
  await command(host,'arena');await until(host,()=>BossRoomParty.state.hearts.length===3);assert.deepEqual((await state(host)).hearts.map(h=>h.seat).sort(),[0,1,2]);
  await key(guest,'ArrowRight',true);await key(third,'ArrowDown',true);await host.waitForTimeout(330);await key(guest,'ArrowRight',false);await key(third,'ArrowDown',false);
  await command(host,'hit',{seat:2,target:0});await until(host,()=>BossRoomParty.state.hp[2]<70);assert.equal((await state(host)).hp[0],90);assert.equal((await state(host)).hp[1],110);
  await third.waitForFunction(()=>BossRoomParty.localState?.ready===1&&BossRoomParty.localState?.myfight===0,null,{timeout:120000});
  assert.equal(await third.evaluate(()=>BossRoomParty.localState.local_seat),2);
  assert.equal(await third.evaluate(()=>document.getElementById('party-video')),null);
  if(process.env.PARTY_NATIVE_SCREENSHOT)await third.screenshot({path:process.env.PARTY_NATIVE_SCREENSHOT});
  assert.deepEqual(errors,[]);console.log('RESULT: PASS — independent native chapter1 simulations on J1/J2/J3; synchronized turn inputs and boss launches; local seat identity; native soul movement/invulnerability; real bullet collisions; owner-only single-target damage and downed-target reroute. No full boss victory claim.');
 }catch(e){for(const p of pages)console.error(await p.evaluate(()=>({native:window.BossRoomParty?.state,status:document.getElementById('party-status')?.textContent})).catch(()=>null));console.error(errors);throw e;}
 finally{await browser?.close();await server.close();}
}
main().catch(e=>{console.error('RESULT: FAIL',e);process.exitCode=1;});
