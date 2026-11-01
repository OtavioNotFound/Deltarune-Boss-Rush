/* Two independent browser contexts, real WebRTC and an instrumented canvas world. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../dist');
const fixture=fs.readFileSync(path.join(__dirname,'fixtures/input-world.html'),'utf8');
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.otf':'font/otf','.svg':'image/svg+xml','.png':'image/png','.wasm':'application/wasm','.gz':'application/gzip'};
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(data);});
});
async function until(page,fn){await page.waitForFunction(fn,null,{timeout:12000});}
async function state(page){return page.frames()[1].evaluate(()=>world);}
async function key(page,key,down){await page.evaluate(({key,down})=>updateKey(key,down),{key,down});}
async function closePanel(page){await page.locator('#coop-close').click();}
async function connect(host,guest){
  // Force onopen to run before setRemoteDescription's promise resolves: the UI
  // must keep its connected status rather than overwrite it with "connecting".
  await host.evaluate(()=>{
   if(window.remoteDelayInstalled)return;window.remoteDelayInstalled=true;
   const original=RTCPeerConnection.prototype.setRemoteDescription;
   RTCPeerConnection.prototype.setRemoteDescription=async function(...args){await original.apply(this,args);await new Promise(resolve=>setTimeout(resolve,300));};
  });
  await host.locator('#coop-open').click();await host.locator('#coop-host').click();
  await until(host,()=>document.getElementById('coop-out').value.includes('offer'));
  const offer=await host.locator('#coop-out').inputValue();
  await guest.locator('#coop-open').click();await guest.locator('#coop-in').fill(offer);await guest.locator('#coop-join').click();
  await until(guest,()=>document.getElementById('coop-out').value.includes('answer'));
  await host.locator('#coop-in').fill(await guest.locator('#coop-out').inputValue());await host.locator('#coop-connect').click();
  for(const page of [host,guest])await until(page,()=>document.getElementById('coop-status').textContent.startsWith('Conectado.'));
  await closePanel(host);await closePanel(guest);
}
async function main(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port;
 let browser;const errors=[],pages=[];
 try{
  browser=await chromium.launch({channel:process.env.BOSSROOM_BROWSER_CHANNEL||'chrome',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
  const hostContext=await browser.newContext(),guestContext=await browser.newContext();
  const host=await hostContext.newPage(),guest=await guestContext.newPage();
  pages.push(host,guest);
  for(const page of [host,guest]){
   page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(()=>{window.testPeers=[];const Native=RTCPeerConnection;window.RTCPeerConnection=class extends Native{constructor(...args){super(...args);testPeers.push(this);}};});
   // Existing remote menu sounds/fonts are irrelevant to this transport test.
   if(!process.env.COOP_NATIVE)await page.route('https://**/*',route=>route.abort());
   await page.goto(url);await page.waitForSelector('#launch');
  }
  await guest.locator('#options-open').click();await guest.keyboard.press('x');
  assert.equal(await guest.locator('#menu-options').evaluate(dialog=>dialog.open),false);
  await guest.locator('#coop-open').click();await guest.locator('#coop-in').fill('z ArrowRight invalid code');
  await guest.locator('#coop-join').click();
  assert.ok((await guest.locator('#coop-status').textContent()).includes('completo'));
  assert.equal(await guest.evaluate(()=>gamestarted),false);await closePanel(guest);
  if(process.env.COOP_NATIVE){
   await host.evaluate(()=>startBoss(presets.find(b=>b.id==='jevil')));
   await host.waitForFunction(()=>document.getElementById('game-frame').contentWindow.Module?.calledRun,null,{timeout:120000});
  }else{
   await host.evaluate(html=>{gamestarted=true;document.getElementById('main-menu-ui').style.display='none';frame.style.display='block';injectAndLoad(html);},fixture);
   await until(host,()=>document.getElementById('game-frame').contentWindow.world?.frames>2);
   await host.frames()[1].evaluate(()=>document.querySelector('canvas').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true})));
   await until(host,()=>document.getElementById('game-frame').contentWindow.world.held.includes('ArrowLeft'));
   await host.evaluate(()=>releaseGameKeys());
   await until(host,()=>!document.getElementById('game-frame').contentWindow.world.held.length);
  }
  await connect(host,guest);
  await until(guest,()=>document.getElementById('coop-video').videoWidth===640&&document.getElementById('coop-video').getVideoPlaybackQuality().totalVideoFrames>2);
  assert.equal(await guest.evaluate(()=>testPeers[0].connectionState),'connected');
  if(process.env.COOP_NATIVE){
   await guest.waitForFunction(()=>{const video=document.getElementById('coop-video'),c=document.createElement('canvas');c.width=64;c.height=48;const ctx=c.getContext('2d');ctx.drawImage(video,0,0,64,48);const pixels=ctx.getImageData(0,0,64,48).data;const colors=new Set();for(let i=0;i<pixels.length;i+=4)colors.add(pixels.slice(i,i+3).join(','));return colors.size>16;},null,{timeout:60000});
   await key(guest,'ArrowRight',true);await host.waitForTimeout(300);await key(guest,'ArrowRight',false);
   await key(host,'z',true);await key(host,'z',false);
   if(process.env.COOP_SCREENSHOT)await guest.screenshot({path:process.env.COOP_SCREENSHOT});
   assert.deepEqual(errors,[]);
   console.log('RESULT: PASS — chapter 1 native runtime started; nonblank native canvas decoded over real WebRTC. Combat outcomes/independent hearts not asserted.');return;
  }
  await key(guest,'ArrowRight',true);await until(host,()=>document.getElementById('game-frame').contentWindow.world.x>335);await key(guest,'ArrowRight',false);
  await until(host,()=>!document.getElementById('game-frame').contentWindow.world.held.length);
  const initial=await state(host);await key(host,'ArrowRight',true);await key(guest,'z',true);await key(guest,'z',false);
  await host.waitForTimeout(200);assert.equal((await state(host)).x,initial.x);assert.equal((await state(host)).actions,0);
  // Physical keys in the iframe must obey the same seat, without recursive forwarding.
  await host.frames()[1].evaluate(()=>{const c=document.querySelector('canvas');c.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));c.dispatchEvent(new KeyboardEvent('keydown',{key:'z',bubbles:true}));c.dispatchEvent(new KeyboardEvent('keyup',{key:'z',bubbles:true}));});
  await until(host,()=>document.getElementById('game-frame').contentWindow.world.actions===1);
  assert.equal((await state(host)).x,initial.x);
  await key(guest,'ArrowUp',true);await until(host,()=>document.getElementById('game-frame').contentWindow.world.held.includes('ArrowUp'));
  await guest.evaluate(()=>window.dispatchEvent(new Event('blur')));await until(host,()=>!document.getElementById('game-frame').contentWindow.world.held.length);
  await host.locator('#coop-open').click();await host.locator('#coop-role').selectOption('actions');await closePanel(host);
  await until(guest,()=>document.getElementById('coop-banner').textContent.includes('AÇÕES'));
  await key(guest,'z',true);await key(guest,'z',false);await until(host,()=>document.getElementById('game-frame').contentWindow.world.actions===2);
  await key(host,'ArrowDown',true);await until(host,()=>document.getElementById('game-frame').contentWindow.world.y>245);await key(host,'ArrowDown',false);
  // Touch uses the exact same production bridge.
  await guest.evaluate(()=>{useMobileControls=true;applyConfig();});
  const touch=await guestContext.newCDPSession(guest);const box=await guest.locator('#btn-x').boundingBox();
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});await until(host,()=>document.getElementById('game-frame').contentWindow.world.held.includes('x'));
  await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await until(host,()=>!document.getElementById('game-frame').contentWindow.world.held.length);
  // Add real delivery delay, then suppress snapshots to exercise the held-key lease.
  await guest.evaluate(()=>{const original=RTCDataChannel.prototype.send;window.sendOriginal=original;RTCDataChannel.prototype.send=function(data){const dc=this;setTimeout(()=>{if(dc.readyState==='open')original.call(dc,data);},150);};});
  await key(guest,'c',true);await until(host,()=>document.getElementById('game-frame').contentWindow.world.held.includes('c'));
  await key(guest,'c',false);await until(host,()=>!document.getElementById('game-frame').contentWindow.world.held.length);
  await key(guest,'x',true);await until(host,()=>document.getElementById('game-frame').contentWindow.world.held.includes('x'));
  await guest.evaluate(()=>{RTCDataChannel.prototype.send=function(){};});
  await until(host,()=>!document.getElementById('game-frame').contentWindow.world.held.length);
  await until(host,()=>document.getElementById('coop-status').textContent.includes('sem resposta'));
  await key(host,'z',true);await key(host,'z',false);await until(host,()=>document.getElementById('game-frame').contentWindow.world.actions===3);
  await until(guest,()=>!BossRoomCoop.guest);
  await guest.evaluate(()=>{RTCDataChannel.prototype.send=window.sendOriginal;});
  await connect(host,guest);
  await until(guest,()=>document.getElementById('coop-video').getVideoPlaybackQuality().totalVideoFrames>2);
  await key(guest,'z',true);await key(guest,'z',false);await until(host,()=>document.getElementById('game-frame').contentWindow.world.actions===4);
  assert.deepEqual(await host.frames()[1].evaluate(()=>[...navigator.getGamepads()]),[]);
  await guest.locator('#coop-open').click();await guest.locator('#coop-stop').click();await closePanel(guest);
  await until(host,()=>!BossRoomCoop.active);
  await host.setViewportSize({width:360,height:800});
  await host.locator('#coop-open').click();
  assert.ok(await host.locator('#coop-panel').evaluate(panel=>{const r=panel.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&panel.scrollWidth<=panel.clientWidth;}));
  if(process.env.COOP_SCREENSHOT)await host.screenshot({path:process.env.COOP_SCREENSHOT});
  assert.deepEqual(errors,[]);
  console.log('RESULT: PASS — real WebRTC, decoded video, ownership, native iframe input, role swap, blur, touch cancel, delay, dropped snapshots, timeout, solo recovery, reconnect, guest exit and 360px layout (canvas fixture; not native combat).');
 }catch(error){
  for(const page of pages)console.error(await page.evaluate(()=>({status:document.getElementById('coop-status')?.textContent,peers:window.testPeers?.map(pc=>({connection:pc.connectionState,ice:pc.iceConnectionState,signaling:pc.signalingState})),native:document.getElementById('game-frame')?.contentDocument?.getElementById('status')?.textContent})).catch(()=>({closed:true})));
  console.error('Browser errors:',errors);
  if(process.env.COOP_SCREENSHOT&&pages[0])await pages[0].screenshot({path:process.env.COOP_SCREENSHOT}).catch(()=>{});
  throw error;
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error('RESULT: FAIL',error);process.exitCode=1;});
