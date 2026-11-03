/* Three isolated clients, real WebRTC, and a canvas fixture. No native combat claims. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const serve=require('./static-server.cjs');
const fixture=`<!doctype html><html><head></head><body><canvas width="640" height="480"></canvas><script>
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
window.world={frames:0,positions:[{x:140,y:220},{x:310,y:220},{x:480,y:220}]};
setInterval(()=>{const packet=parent.BossRoomParty.packet();world.frames++;ctx.fillStyle='#080310';ctx.fillRect(0,0,640,480);
 for(let seat=0;seat<3;seat++){const keys=packet.held[seat],p=world.positions[seat];p.x+=2*(keys[1]-keys[3]);p.y+=2*(keys[0]-keys[2]);ctx.fillStyle=['#ff3333','#ff44dd','#44ddff'][seat];ctx.fillRect(p.x,p.y,16,16);}
 ctx.fillStyle='#fff';ctx.font='20px monospace';ctx.fillText('PARTY TRANSPORT FIXTURE / '+world.frames,70,70);},33);
</script></body></html>`;
const until=(page,fn,arg)=>page.waitForFunction(fn,arg,{timeout:15000});
async function key(page,key,down){const accepted=await page.evaluate(({key,down})=>BossRoomCoop.route(key,down),{key,down});assert.equal(accepted,true,`co-op input route rejected ${key} ${down}`);}
async function openPanel(page){if(!await page.locator('#party-panel').evaluate(panel=>panel.open))await page.locator('#party-open').click();}
async function closePanel(page){if(await page.locator('#party-panel').evaluate(panel=>panel.open))await page.locator('#party-close').click();}
async function connect(host,guest,seat){
 await openPanel(host);
 if(seat===1){await host.locator('#party-host').click();await until(host,()=>/^\d{6}$/.test(document.getElementById('party-code-display').textContent));}
 const code=await host.locator('#party-code-display').textContent();assert.match(code,/^\d{6}$/);
 await openPanel(guest);await guest.locator('#party-code').fill(code);await guest.locator('#party-join').click();
 await until(guest,seat=>BossRoomCoop.active&&BossRoomParty.seat===seat,seat);await until(host,()=>document.getElementById('party-status').textContent.includes('conectado'));
 await closePanel(host);
}
async function main(){
 const server=await serve();let browser;const pages=[],errors=[];
 try{
  browser=await chromium.launch({channel:process.env.BOSSROOM_BROWSER_CHANNEL||'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  const entryContext=await browser.newContext(),entry=await entryContext.newPage(),entryFailures=[];
  entry.on('response',response=>{if(response.status()>=400)entryFailures.push(response.url()+' '+response.status());});
  await entry.goto(server.rootUrl);await entry.waitForURL(/\/Deltarune-Boss-Rush\/dist\/$/);await entry.waitForSelector('#launch');
  assert.deepEqual(entryFailures,[]);await entryContext.close();
  for(let i=0;i<3;i++){
   const context=await browser.newContext(),page=await context.newPage();pages.push(page);page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>{
    window.partyTestChannels=[];window.partyAddedTracks=0;const Native=RTCPeerConnection;
    window.RTCPeerConnection=class extends Native{
     constructor(...args){super(...args);this.addEventListener('datachannel',event=>partyTestChannels.push(event.channel));}
     createDataChannel(...args){const channel=super.createDataChannel(...args);partyTestChannels.push(channel);return channel;}
     addTrack(...args){partyAddedTracks++;return super.addTrack(...args);}
    };
   });
   await page.goto(server.url);await page.waitForSelector('#party-open');await page.waitForSelector('#launch');
  }
  const [host,j2,j3]=pages;
  await j2.locator('#options-open').click();await j2.keyboard.press('x');assert.equal(await j2.locator('#menu-options').evaluate(dialog=>dialog.open),false);
  await openPanel(j2);await j2.locator('#party-code').fill('abc');await j2.locator('#party-join').click();
  assert.ok((await j2.locator('#party-status').textContent()).includes('6 números'));assert.equal(await j2.evaluate(()=>gamestarted),false);await closePanel(j2);

  // Negotiate data-only channels before any battle starts.
  await connect(host,j2,1);
  await j2.locator('[data-character="1"]').check();await j2.locator('[data-character="2"]').check();
  await until(host,()=>BossRoomParty.owners[1]===1&&BossRoomParty.owners[2]===1);await closePanel(j2);
  await connect(host,j3,2);assert.equal(await j3.locator('[data-character="2"]').isDisabled(),true);await closePanel(j3);
  await openPanel(j2);await j2.locator('[data-character="2"]').uncheck();await until(host,()=>BossRoomParty.owners[2]===-1);await closePanel(j2);
  await openPanel(j3);await until(j3,()=>!document.querySelector('[data-character="2"]').disabled);await j3.locator('[data-character="2"]').check();
  await until(host,()=>BossRoomParty.owners[2]===2);await closePanel(j3);
  assert.deepEqual(await host.evaluate(()=>BossRoomParty.owners),[0,1,2]);

  await key(host,'ArrowUp',true);await until(host,()=>BossRoomParty.packet().held[0][2]===1);
  await key(j2,'ArrowDown',true);await until(host,()=>BossRoomParty.packet().held[1][0]===1);
  await key(j3,'z',true);await until(j3,()=>BossRoomParty.packet().held[2][4]===1);await until(host,()=>BossRoomParty.packet().held[2][4]===1);
  await key(host,'ArrowUp',false);await key(j2,'ArrowDown',false);await key(j3,'z',false);
  await until(host,()=>BossRoomParty.packet().held.flat().every(value=>value===0));
  await key(j2,'z',true);await until(host,()=>BossRoomParty.packet().held[1][4]===1);await key(j2,'z',false);
  await until(host,()=>BossRoomParty.packet().held[1][4]===0);

  // Independent local runtimes receive the same launch command; data transport carries no media tracks.
  await j2.evaluate(()=>window.BossRoomLaunch=id=>window.partyLaunched=id);await j3.evaluate(()=>window.BossRoomLaunch=id=>window.partyLaunched=id);
  await host.evaluate(html=>{
   gamestarted=true;document.getElementById('main-menu-ui').style.display='none';frame.style.display='block';injectAndLoad(html);
   window.partyFixtureHearts=[];
   setInterval(()=>BossRoomParty.receive({v:2,ready:1,turn:0,myfight:0,chars:[1,2,3],hp:[90,110,70],hearts:partyFixtureHearts}),50);
  },fixture);
  await host.evaluate(()=>BossRoomCoop.launch('jevil'));
  await until(j2,()=>window.partyLaunched==='jevil');await until(j3,()=>window.partyLaunched==='jevil');
  await until(j2,()=>document.getElementById('party-banner').textContent.includes('TURNO DE J1'));
  assert.equal(await j2.locator('#party-waiting').isVisible(),true,'guest must not hide the waiting screen before its own battle is ready');
  assert.match(await j2.locator('#party-waiting').textContent(),/Carregando a batalha local/);
  const guestTelemetry={v:2,ready:1,turn:0,myfight:0,chars:[1,2,3],hp:[90,110,70],hearts:[]};
  await j2.evaluate(state=>BossRoomParty.receive(state),guestTelemetry);
  await j2.locator('#party-waiting').waitFor({state:'hidden'});
  assert.equal(await j2.locator('#party-waiting').isVisible(),false,'guest waiting screen hides after its local runtime reports ready');
  await j2.evaluate(()=>BossRoomParty.reportLocalError('falha de teste'));
  assert.equal(await j2.locator('#party-waiting').isVisible(),true);
  assert.match(await j2.locator('#party-waiting').textContent(),/falha de teste/);
  await j2.evaluate(state=>BossRoomParty.receive(state),guestTelemetry);
  await j2.locator('#party-waiting').waitFor({state:'hidden'});
  assert.equal(await host.evaluate(()=>document.getElementById('party-video')),null);assert.equal(await j2.evaluate(()=>partyAddedTracks),0);assert.equal(await j3.evaluate(()=>partyAddedTracks),0);
  await host.evaluate(()=>{partyFixtureHearts=[{seat:0,x:140,y:220,inv:-1},{seat:1,x:310,y:220,inv:-1},{seat:2,x:480,y:220,inv:-1}];});
  await openPanel(j2);await until(j2,()=>[...document.querySelectorAll('[data-character]')].every(input=>input.disabled));await closePanel(j2);
  await host.evaluate(()=>{partyFixtureHearts=[];});

  await key(j2,'ArrowLeft',true);await until(host,()=>BossRoomParty.packet().held[1][3]===1);
  await j2.evaluate(()=>window.dispatchEvent(new Event('blur')));await until(host,()=>BossRoomParty.packet().held[1][3]===0);
  await j3.evaluate(()=>{useMobileControls=true;applyConfig();});
  const touch=await j3.context().newCDPSession(j3),box=await j3.locator('#btn-x').boundingBox();
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
  await until(host,()=>BossRoomParty.packet().held[2][5]===1);await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await until(host,()=>BossRoomParty.packet().held[2][5]===0);

  await key(j3,'c',true);await until(host,()=>BossRoomParty.packet().held[2][6]===1);await key(j3,'c',false);await until(host,()=>BossRoomParty.packet().held[2][6]===0);
  assert.equal(await host.evaluate(()=>BossRoomCoop.active),true);assert.equal(await host.evaluate(()=>BossRoomParty.owners[1]),1);
  await openPanel(j3);await j3.locator('#party-stop').click();await until(host,()=>BossRoomParty.owners[2]===-1&&BossRoomParty.packet().owners[2]===0);await until(j3,()=>!BossRoomCoop.guest);

  await openPanel(j2);await j2.locator('#party-stop').click();await until(host,()=>BossRoomParty.owners[1]===-1&&BossRoomParty.packet().owners[1]===0);await until(host,()=>!BossRoomCoop.active);assert.equal(await host.evaluate(()=>BossRoomParty.packet().active),0);
  await host.setViewportSize({width:360,height:800});await openPanel(host);
  assert.ok(await host.locator('#party-panel').evaluate(panel=>{const rect=panel.getBoundingClientRect();return rect.left>=0&&rect.right<=innerWidth&&panel.scrollWidth<=panel.clientWidth;}));
  assert.ok(await host.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(process.env.PARTY_SCREENSHOT)await host.screenshot({path:process.env.PARTY_SCREENSHOT});
  assert.deepEqual(errors,[]);
  console.log('RESULT: PASS — GitHub Pages project path and root redirect; three clients; six-digit room codes via PeerJS signaling; data-only WebRTC; synchronized launch; lobby; exclusive multiple claims; claim locking; independent input snapshots; invalid code; no media tracks; blur; touch cancel; disconnect fallback; guest exit; 360px dialog (canvas fixture, not native combat).');
 }catch(error){
  for(const page of pages)console.error(await page.evaluate(()=>JSON.parse(JSON.stringify({status:document.getElementById('party-status')?.textContent,owners:window.BossRoomParty?.owners,packet:(()=>{const p=window.BossRoomParty?.packet();if(p)p.held=p.held.map(row=>row.join(''));return p})(),seat:window.BossRoomParty?.seat,role:window.BossRoomCoop?.role,active:window.BossRoomCoop?.active,channels:window.partyTestChannels?.map(channel=>channel.readyState)}))).catch(()=>({closed:true})));
  console.error('Browser errors:',errors);throw error;
 }finally{await browser?.close();await server.close();}
}
main().catch(error=>{console.error('RESULT: FAIL',error);process.exitCode=1;});
