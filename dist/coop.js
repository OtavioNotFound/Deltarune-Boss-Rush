/* WebRTC co-pilot: one native game, one video stream, two disjoint input seats. */
(function(){
 'use strict';
 const {InputRouter,owns,keys}=BossRoomCoopCore;
 const panel=document.createElement('dialog');panel.id='coop-panel';panel.setAttribute('aria-labelledby','coop-title');
 panel.innerHTML=`<div class="dialog-top"><h2 id="coop-title">CO-OP · ALMA COMPARTILHADA</h2><button id="coop-close" aria-label="Fechar co-op">×</button></div>
 <p>Uma batalha, dois jogadores. Um move com as setas; o outro usa Z, X e C. O anfitrião mantém a batalha e os saves. O convidado recebe vídeo sem áudio.</p>
 <p>1. Anfitrião: inicie uma batalha, abra CO-OP e crie um convite.<br>2. Convidado: abra este mesmo site, cole o convite e gere a resposta.<br>3. Anfitrião: cole a resposta e conecte. Depois fechem este painel.</p>
 <label for="coop-role">O convidado controla</label><select id="coop-role"><option value="movement">Movimento (setas)</option><option value="actions">Ações (Z / X / C)</option></select>
 <div><button id="coop-host">CRIAR CONVITE</button><button id="coop-join">GERAR RESPOSTA</button><button id="coop-connect">CONECTAR RESPOSTA</button></div>
 <label for="coop-in">Código recebido do amigo</label><textarea id="coop-in" spellcheck="false" autocomplete="off" maxlength="100000"></textarea>
 <label for="coop-out">Seu código: copie e envie ao amigo</label><textarea id="coop-out" readonly spellcheck="false"></textarea><button id="coop-copy">COPIAR CÓDIGO</button>
 <p id="coop-status" role="status" aria-live="polite">Desconectado. Co-op experimental para dois jogadores.</p>
 <p>Conexão direta WebRTC. Algumas redes precisam de um relay TURN, que este site não fornece. Os códigos contêm dados de conexão: compartilhe apenas com seu amigo. Recomeçar ou trocar de chefe encerra a sessão.</p>
 <button id="coop-stop">ENCERRAR CO-OP</button>`;
 document.body.append(panel);
 const open=document.createElement('button');open.id='coop-open';open.textContent='CO-OP';open.setAttribute('aria-haspopup','dialog');document.body.append(open);
 const video=document.createElement('video');video.id='coop-video';video.autoplay=true;video.playsInline=true;video.muted=true;video.hidden=true;document.body.append(video);
 const banner=document.createElement('div');banner.id='coop-banner';banner.hidden=true;banner.setAttribute('role','status');document.body.append(banner);
 const el=id=>document.getElementById('coop-'+id);
 const status=text=>{el('status').textContent=text;};
 const frame=document.getElementById('game-frame');
 const deliver=(key,down)=>frame.contentWindow?.postMessage({type:down?'keydown':'keyup',key},location.origin);
 const router=new InputRouter(deliver);
 let pc=null,channel=null,stream=null,seat=null,connected=false,timer=null,seq=0,lastSeen=0,remoteRole='movement',generation=0;
 const held=new Set();
 function send(packet){if(channel?.readyState==='open'&&channel.bufferedAmount<16384)channel.send(JSON.stringify(packet));}
 function snapshot(){send({v:1,type:'input',seq:seq++,keys:[...held]});}
 function release(){held.clear();if(seat==='guest')snapshot();else router.release('local');}
 function showRole(){
  const role=seat==='guest'?remoteRole:(remoteRole==='movement'?'actions':'movement');
  banner.textContent=(seat==='guest'?'CONVIDADO':'ANFITRIÃO')+' · '+(role==='movement'?'SETAS: MOVIMENTO':'Z / X / C: AÇÕES')+' · CO-OP';banner.hidden=!connected;
 }
 function stop(message='Sessão encerrada. O anfitrião voltou ao controle solo.'){
  generation++;clearInterval(timer);timer=null;release();router.stop();connected=false;
  if(channel){channel.onclose=null;channel.onmessage=null;channel.close();}channel=null;
  if(pc){pc.onconnectionstatechange=null;pc.close();}pc=null;
  stream?.getTracks().forEach(track=>track.stop());stream=null;video.srcObject=null;video.hidden=true;banner.hidden=true;
  const wasGuest=seat==='guest';seat=null;document.body.classList.remove('coop-guest');el('role').disabled=false;
  el('out').value='';el('in').value='';
  if(wasGuest){gamestarted=false;document.getElementById('main-menu-ui').style.display='';applyConfig();}
  status(message);
 }
 function receive(event){
  if(typeof event.data!=='string'||event.data.length>2048)return;
  let data;try{data=JSON.parse(event.data);}catch{return;}
  if(data?.v!==1)return;
  if(seat==='host'){
   if(router.receive(panel.open&&data.type==='input'?{...data,keys:[]}:data))lastSeen=Date.now();
  }else if(data.type==='state'&&['movement','actions'].includes(data.role)){
   lastSeen=Date.now();if(remoteRole!==data.role){release();remoteRole=data.role;showRole();}
  }
 }
 function wire(dc){
  if(channel){dc.close();return;}
  channel=dc;dc.onmessage=receive;
  dc.onclose=()=>stop('Conexão encerrada. Crie um novo convite para reconectar.');
  dc.onopen=()=>{
   connected=true;lastSeen=Date.now();releaseGameKeys();
   if(seat==='host')router.start(remoteRole);
   else{gamestarted=true;document.body.classList.add('coop-guest');video.hidden=false;applyConfig();}
   showRole();status('Conectado. Feche o painel para jogar. '+(seat==='guest'?'Você recebe vídeo sem áudio.':'A batalha continua no anfitrião.'));
   const tick=()=>{
    if(Date.now()-lastSeen>5000){stop('Conexão sem resposta. Controle solo restaurado no anfitrião.');return;}
    if(seat==='guest')snapshot();
    else{router.expire();send({v:1,type:'state',role:remoteRole});}
   };tick();timer=setInterval(tick,100);
  };
 }
 function create(seatName){
  if(!window.isSecureContext||!window.RTCPeerConnection)throw Error('Use HTTPS ou localhost em um navegador com WebRTC.');
  seat=seatName;pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  const current=pc;
  pc.onconnectionstatechange=()=>{if(pc===current&&['failed','closed','disconnected'].includes(current.connectionState))stop('Conexão interrompida. Crie outro convite.');};
  pc.ontrack=event=>{if(pc===current){video.srcObject=event.streams[0]||new MediaStream([event.track]);video.play().catch(()=>status('Toque em CO-OP e feche o painel para ativar o vídeo.'));}};
  pc.ondatachannel=event=>{if(pc===current)wire(event.channel);};
  return pc;
 }
 async function code(current){
  await new Promise((resolve,reject)=>{
   if(current.iceGatheringState==='complete'){resolve();return;}
   const timeout=setTimeout(()=>{cleanup();reject(Error('Tempo de conexão esgotado. Crie outro convite.'));},15000);
   function cleanup(){clearTimeout(timeout);current.removeEventListener('icegatheringstatechange',check);}
   function check(){if(current.iceGatheringState==='complete'){cleanup();resolve();}}
   current.addEventListener('icegatheringstatechange',check);
  });
  if(pc!==current)return;
  el('out').value=JSON.stringify({app:'bossroom-copilot',v:1,description:current.localDescription});
  status(seat==='host'?'Envie o convite e aguarde a resposta.':'Envie esta resposta ao anfitrião. Aguarde a conexão.');
 }
 function decode(type){
  let data;try{data=JSON.parse(el('in').value);}catch{throw Error('Código inválido. Cole o código completo.');}
  if(data?.app!=='bossroom-copilot'||data.v!==1||data.description?.type!==type||typeof data.description.sdp!=='string'||data.description.sdp.length>90000)throw Error('Código incompatível. Confira convite e resposta.');
  return data.description;
 }
 let busy=false;
 async function run(action){
  if(busy)return;busy=true;const revision=generation;
  for(const id of ['host','join','connect'])el(id).disabled=true;
  try{await action();}catch(error){if(generation===revision)stop('Não foi possível conectar: '+error.message);}
  finally{busy=false;for(const id of ['host','join','connect'])el(id).disabled=false;}
 }
 el('host').onclick=()=>run(async()=>{
  if(pc)throw Error('Encerre a sessão atual antes de criar outra.');
  const canvas=frame.contentDocument?.querySelector('canvas');
  if(!gamestarted||!canvas||!canvas.captureStream||(frame.contentWindow.Module&&!frame.contentWindow.Module.calledRun))throw Error('Inicie uma batalha e aguarde a imagem antes de criar o convite.');
  remoteRole=el('role').value;const current=create('host');
  stream=canvas.captureStream(30);if(!stream.getVideoTracks().length)throw Error('O navegador não permitiu transmitir a batalha.');
  for(const track of stream.getTracks())current.addTrack(track,stream);
  wire(current.createDataChannel('bossroom-copilot',{ordered:true}));
  await current.setLocalDescription(await current.createOffer());await code(current);
 });
 el('join').onclick=()=>run(async()=>{
  if(pc||gamestarted)throw Error('Entre como convidado a partir do menu, sem uma batalha aberta.');
  const offer=decode('offer');const current=create('guest');el('role').disabled=true;
  await current.setRemoteDescription(offer);await current.setLocalDescription(await current.createAnswer());await code(current);
 });
 el('connect').onclick=()=>run(async()=>{
  if(seat!=='host'||!pc||pc.signalingState!=='have-local-offer')throw Error('Crie um convite primeiro.');
  const answer=decode('answer');status('Conectando… Se falhar, as redes podem precisar de TURN.');
  await pc.setRemoteDescription(answer);
 });
 el('role').onchange=()=>{remoteRole=el('role').value;if(connected&&seat==='host'){releaseGameKeys();router.setRole(remoteRole);send({v:1,type:'state',role:remoteRole});showRole();}};
 el('stop').onclick=()=>stop();
 el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(el('out').value);status('Código copiado.');}catch{el('out').select();status('Selecione e copie o código acima.');}};
 open.onclick=()=>{releaseGameKeys();release();panel.showModal();};
 el('close').onclick=()=>{panel.close();if(seat==='guest')video.play().catch(()=>{});};
 panel.addEventListener('close',release);panel.addEventListener('cancel',release);
 window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
 window.addEventListener('pagehide',()=>stop());
 // Called by both the parent controls and the iframe's native keyboard interceptor.
 window.BossRoomCoop={
  get active(){return connected;},
  get guest(){return seat==='guest'&&pc!==null;},
  releaseAll(){release();router.release('remote');},
  route(key,down){
   if(!connected)return false;
   if(!keys.includes(key))return true;
   if(panel.open){release();return true;}
   if(seat==='guest'){
    if(owns(remoteRole,key)){if(down)held.add(key);else held.delete(key);snapshot();}
   }else router.input(key,down);
   return true;
  }
 };
})();
