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
const until=(page,fn)=>page.waitForFunction(fn,null,{timeout:15000});
async function key(page,key,down){await page.evaluate(({key,down})=>updateKey(key,down),{key,down});}
async function openPanel(page){if(!await page.locator('#party-panel').evaluate(panel=>panel.open))await page.locator('#party-open').click();}
async function closePanel(page){if(await page.locator('#party-panel').evaluate(panel=>panel.open))await page.locator('#party-close').click();}
async function connect(host,guest,seat){
 // Exercise the race where data-channel onopen precedes remote-description resolution.
 await host.evaluate(()=>{if(window.remoteDelayInstalled)return;window.remoteDelayInstalled=true;const original=RTCPeerConnection.prototype.setRemoteDescription;RTCPeerConnection.prototype.setRemoteDescription=async function(...args){await original.apply(this,args);await new Promise(resolve=>setTimeout(resolve,300));};});
 await openPanel(host);await host.locator('#party-seat').selectOption(String(seat));await host.locator('#party-host').click();
 await until(host,()=>document.getElementById('party-out').value.includes('offer'));
 const offer=await host.locator('#party-out').inputValue();assert.equal(JSON.parse(offer).seat,seat);
 await openPanel(guest);await guest.locator('#party-in').fill(offer);await guest.locator('#party-join').click();
 await until(guest,()=>document.getElementById('party-out').value.includes('answer'));
 await host.locator('#party-in').fill(await guest.locator('#party-out').inputValue());await host.locator('#party-connect').click();
 await until(guest,()=>BossRoomCoop.active);await until(host,()=>document.getElementById('party-status').textContent.startsWith('Conectado.'));
 await closePanel(host);
}
async function videoDecoded(page){await until(page,()=>{const video=document.getElementById('party-video');return video.videoWidth===640&&video.readyState>=2&&video.getVideoPlaybackQuality().totalVideoFrames>2;});}
async function main(){
 const server=await serve();let browser;const pages=[],errors=[];
 try{
  browser=await chromium.launch({channel:process.env.BOSSROOM_BROWSER_CHANNEL||'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  for(let i=0;i<3;i++){
   const context=await browser.newContext(),page=await context.newPage();pages.push(page);page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>{
    window.partyTestChannels=[];const Native=RTCPeerConnection;
    window.RTCPeerConnection=class extends Native{
     constructor(...args){super(...args);this.addEventListener('datachannel',event=>partyTestChannels.push(event.channel));}
     createDataChannel(...args){const channel=super.createDataChannel(...args);partyTestChannels.push(channel);return channel;}
    };
   });
   await page.route('https://**/*',route=>route.abort());await page.goto(server.url);await page.waitForSelector('#party-open');await page.waitForSelector('#launch');
  }
  const [host,j2,j3]=pages;
  await j2.locator('#options-open').click();await j2.keyboard.press('x');assert.equal(await j2.locator('#menu-options').evaluate(dialog=>dialog.open),false);
  await openPanel(j2);await j2.locator('#party-in').fill('z ArrowRight invalid code');await j2.locator('#party-join').click();
  assert.ok((await j2.locator('#party-status').textContent()).includes('completo'));assert.equal(await j2.evaluate(()=>gamestarted),false);await closePanel(j2);

  // Negotiate both media channels before any battle/canvas exists.
  await connect(host,j2,1);
  await j2.locator('[data-character="1"]').check();await j2.locator('[data-character="2"]').check();
  await until(host,()=>BossRoomParty.owners[1]===1&&BossRoomParty.owners[2]===1);await closePanel(j2);
  await connect(host,j3,2);assert.equal(await j3.locator('[data-character="2"]').isDisabled(),true);await closePanel(j3);
  await openPanel(j2);await j2.locator('[data-character="2"]').uncheck();await until(host,()=>BossRoomParty.owners[2]===-1);await closePanel(j2);
  await openPanel(j3);await until(j3,()=>!document.querySelector('[data-character="2"]').disabled);await j3.locator('[data-character="2"]').check();
  await until(host,()=>BossRoomParty.owners[2]===2);await closePanel(j3);
  assert.deepEqual(await host.evaluate(()=>BossRoomParty.owners),[0,1,2]);

  await key(host,'ArrowUp',true);await key(j2,'ArrowDown',true);await key(j3,'z',true);
  await until(host,()=>{const p=BossRoomParty.packet();return p.held[0][2]===1&&p.held[1][0]===1&&p.held[2][4]===1;});
  await key(host,'ArrowUp',false);await key(j2,'ArrowDown',false);await key(j3,'z',false);
  await until(host,()=>BossRoomParty.packet().held.flat().every(value=>value===0));
  await j2.evaluate(()=>partyTestChannels[0].send(JSON.stringify({v:2,type:'input',seq:999999,keys:['Escape']})));
  await key(j2,'z',true);await until(host,()=>BossRoomParty.packet().held[1][4]===1);await key(j2,'z',false);
  await until(host,()=>BossRoomParty.packet().held[1][4]===0);

  // Instrumented native-like telemetry enables capture; all transport/input paths are production.
  await host.evaluate(html=>{
   gamestarted=true;document.getElementById('main-menu-ui').style.display='none';frame.style.display='block';injectAndLoad(html);
   window.partyFixtureHearts=[];
   setInterval(()=>BossRoomParty.receive({v:2,ready:1,turn:0,myfight:0,chars:[1,2,3],hp:[90,110,70],hearts:partyFixtureHearts}),50);
  },fixture);
  await videoDecoded(j2);await videoDecoded(j3);
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

  await j3.evaluate(()=>{const original=RTCDataChannel.prototype.send;window.partyOriginalSend=original;RTCDataChannel.prototype.send=function(data){const channel=this;setTimeout(()=>{if(channel.readyState==='open')original.call(channel,data);},150);};});
  await key(j3,'c',true);await until(host,()=>BossRoomParty.packet().held[2][6]===1);await key(j3,'c',false);await until(host,()=>BossRoomParty.packet().held[2][6]===0);
  await key(j3,'x',true);await until(host,()=>BossRoomParty.packet().held[2][5]===1);
  await j3.evaluate(()=>{RTCDataChannel.prototype.send=function(){};});
  await until(host,()=>BossRoomParty.packet().held[2].every(value=>value===0));
  await until(host,()=>BossRoomParty.owners[2]===-1&&BossRoomParty.packet().owners[2]===0);
  assert.equal(await host.evaluate(()=>BossRoomCoop.active),true);assert.equal(await host.evaluate(()=>BossRoomParty.owners[1]),1);
  await until(j3,()=>!BossRoomCoop.guest);await j3.evaluate(()=>{RTCDataChannel.prototype.send=partyOriginalSend;});
  await connect(host,j3,2);await j3.locator('[data-character="2"]').check();await until(host,()=>BossRoomParty.owners[2]===2);await closePanel(j3);await videoDecoded(j3);
  await key(j3,'ArrowRight',true);await until(host,()=>BossRoomParty.packet().held[2][1]===1);await key(j3,'ArrowRight',false);
  await until(host,()=>BossRoomParty.packet().held[2][1]===0);

  await openPanel(j2);await j2.locator('#party-stop').click();await until(host,()=>BossRoomParty.owners[1]===-1&&BossRoomParty.packet().owners[1]===0);assert.equal(await host.evaluate(()=>BossRoomCoop.active),true);
  await openPanel(j3);await j3.locator('#party-stop').click();await until(host,()=>!BossRoomCoop.active);assert.equal(await host.evaluate(()=>BossRoomParty.packet().active),0);
  await host.setViewportSize({width:360,height:800});await openPanel(host);
  assert.ok(await host.locator('#party-panel').evaluate(panel=>{const rect=panel.getBoundingClientRect();return rect.left>=0&&rect.right<=innerWidth&&panel.scrollWidth<=panel.clientWidth;}));
  assert.ok(await host.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(process.env.PARTY_SCREENSHOT)await host.screenshot({path:process.env.PARTY_SCREENSHOT});
  assert.deepEqual(errors,[]);
  console.log('RESULT: PASS — three clients; lobby before battle; exclusive multiple claims; claim locking; independent snapshots; malformed signaling/input; video to both guests; blur; touch cancel; delay; lost snapshots; lease expiry; disconnect fallback; reconnect; guest exit; 360px dialog (canvas fixture, not native combat).');
 }catch(error){
  for(const page of pages)console.error(await page.evaluate(()=>({status:document.getElementById('party-status')?.textContent,owners:window.BossRoomParty?.owners})).catch(()=>({closed:true})));
  console.error('Browser errors:',errors);throw error;
 }finally{await browser?.close();await server.close();}
}
main().catch(error=>{console.error('RESULT: FAIL',error);process.exitCode=1;});
