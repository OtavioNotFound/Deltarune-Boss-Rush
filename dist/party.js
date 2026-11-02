/* Native party co-op: one host simulation, exclusive character claims, one soul per seat. */
(function(){
 'use strict';
 const {Party,keys,seatValid}=BossRoomPartyCore;
 const names=['Kris','Susie','Ralsei'];
 const frame=document.getElementById('game-frame');
 const panel=document.createElement('dialog');panel.id='party-panel';panel.setAttribute('aria-labelledby','party-title');
 panel.innerHTML=`<div class="dialog-top"><h2 id="party-title">CO-OP · ESCOLHA SUA PARTY</h2><button id="party-close" aria-label="Fechar co-op">×</button></div>
 <p>Cada jogador escolhe um ou mais personagens. Você controla os turnos deles e sua própria alma na esquiva. Cada golpe atinge um dos seus personagens.</p>
 <fieldset id="party-characters"><legend>SEUS PERSONAGENS</legend>${names.map((name,i)=>`<label><input type="checkbox" data-character="${i}"> ${name} <span id="party-owner-${i}"></span></label>`).join('')}</fieldset>
 <p id="party-roster" aria-live="polite"></p>
 <details><summary>COMO CONECTAR</summary><p>O anfitrião cria um convite para J2 ou J3. O amigo abre este site, cola o convite e gera uma resposta. O anfitrião cola a resposta e conecta. Cada um marca seus personagens; depois o anfitrião inicia a batalha. Também é possível conectar com uma batalha já aberta.</p></details>
 <label for="party-seat">Convidar jogador</label><select id="party-seat"><option value="1">J2 · MAGENTA</option><option value="2">J3 · CIANO</option></select>
 <div class="party-actions"><button id="party-host">CRIAR CONVITE</button><button id="party-join">GERAR RESPOSTA</button><button id="party-connect">CONECTAR RESPOSTA</button></div>
 <label for="party-in">Código recebido do amigo</label><textarea id="party-in" maxlength="100000" autocomplete="off" spellcheck="false"></textarea>
 <label for="party-out">Seu código para enviar ao amigo</label><textarea id="party-out" readonly spellcheck="false"></textarea><button id="party-copy">COPIAR CÓDIGO</button>
 <p id="party-status" role="status" aria-live="polite">Sem conexão. Personagens livres ficam com o anfitrião.</p>
 <p class="party-note">Vídeo sem áudio. Algumas redes exigem TURN, que este site não fornece. Compartilhe os códigos somente com seus amigos: eles contêm dados de conexão. Recarregar ou trocar de chefe encerra a sessão.</p>
 <button id="party-controls">CONTROLES NA TELA</button><button id="party-stop">ENCERRAR CO-OP</button>`;
 document.body.append(panel);
 const open=document.createElement('button');open.id='party-open';open.textContent='CO-OP';open.setAttribute('aria-haspopup','dialog');document.body.append(open);
 const video=document.createElement('video');video.id='party-video';video.autoplay=true;video.playsInline=true;video.muted=true;video.hidden=true;document.body.append(video);
 const banner=document.createElement('div');banner.id='party-banner';banner.hidden=true;banner.setAttribute('role','status');document.body.append(banner);
 const waiting=document.createElement('div');waiting.id='party-waiting';waiting.hidden=true;waiting.textContent='Aguardando o anfitrião iniciar a batalha…';document.body.append(waiting);
 const el=id=>document.getElementById('party-'+id),status=text=>{el('status').textContent=text;};
 let party=new Party(),mode=null,mySeat=0,guestPeer=null,viewOwners=[0,-1,-1],viewConnected=[true,false,false];
 let nativeState=null,nativeTime=0,stream=null,canvas=null,busy=false,generation=0,claimSeq=0,stateSeq=0,pendingClaim=null;
 const peers=new Map(),localHeld=new Set();
 const hostActive=()=>mode==='host'&&[...peers.values()].some(peer=>peer.connected);
 const active=()=>hostActive()||(mode==='guest'&&guestPeer?.connected===true);
 const locked=()=>Array.isArray(nativeState?.hearts)&&nativeState.hearts.length>0;
 function send(peer,data){if(peer?.channel?.readyState==='open'&&peer.channel.bufferedAmount<65536)peer.channel.send(JSON.stringify(data));}
 function inputSnapshot(){if(mode==='guest')send(guestPeer,{v:2,type:'input',seq:guestPeer.inputSeq++,keys:[...localHeld]});}
 function release(){localHeld.clear();party.release(0);inputSnapshot();}
 function resetMedia(){stream?.getTracks().forEach(track=>track.stop());stream=null;canvas=null;}
 function drop(peer,message){
  if(!peer||peer.closed)return;peer.closed=true;peer.connected=false;
  if(peer.channel){peer.channel.onclose=null;peer.channel.onmessage=null;peer.channel.close();}
  peer.pc.onconnectionstatechange=null;peer.pc.close();
  if(mode==='host'){peers.delete(peer.seat);party.disconnect(peer.seat);if(!hostActive()){release();resetMedia();}broadcast();}
  else if(mode==='guest'&&guestPeer===peer){
   guestPeer=null;mode=null;mySeat=0;release();video.srcObject=null;video.hidden=true;waiting.hidden=true;
   document.body.classList.remove('party-guest');gamestarted=false;document.getElementById('main-menu-ui').style.display='';applyConfig();
  }
  if(message)status(message);render();
 }
 function stop(message='Sessão encerrada. O anfitrião voltou ao controle solo.'){
  generation++;release();if(guestPeer)drop(guestPeer);for(const peer of [...peers.values()])drop(peer);
  mode=null;mySeat=0;party=new Party();viewOwners=[0,-1,-1];viewConnected=[true,false,false];nativeState=null;nativeTime=0;pendingClaim=null;
  resetMedia();video.srcObject=null;video.hidden=true;waiting.hidden=true;el('in').value='';el('out').value='';banner.hidden=true;status(message);render();
 }
 function stateForWire(){
  if(!nativeState)return null;
  return{v:2,ready:nativeState.ready===1?1:0,turn:Number.isInteger(nativeState.turn)?nativeState.turn:-1,myfight:Number.isFinite(nativeState.myfight)?nativeState.myfight:-1,
   chars:Array.isArray(nativeState.chars)?nativeState.chars.slice(0,3):[],hp:Array.isArray(nativeState.hp)?nativeState.hp.slice(0,3):[],
   hearts:Array.isArray(nativeState.hearts)?nativeState.hearts.slice(0,3).map(heart=>({seat:heart.seat,x:heart.x,y:heart.y,inv:heart.inv})):[]};
 }
 function broadcast(){
  if(mode!=='host')return;
  const message={v:2,type:'state',seq:stateSeq++,owners:party.owners,connected:party.connected,state:stateForWire()};
  for(const peer of peers.values())if(peer.connected)send(peer,message);
 }
 function validState(data){
  return Number.isSafeInteger(data.seq)&&data.seq>=0&&Array.isArray(data.owners)&&data.owners.length===3&&data.owners.every(owner=>owner===-1||seatValid(owner))&&Array.isArray(data.connected)&&data.connected.length===3&&data.connected.every(value=>typeof value==='boolean')&&
   (data.state===null||(data.state?.v===2&&[0,1].includes(data.state.ready)&&Number.isInteger(data.state.turn)&&Number.isFinite(data.state.myfight)&&Array.isArray(data.state.hearts)&&data.state.hearts.length<=3&&data.state.hearts.every(heart=>seatValid(heart?.seat)&&Number.isFinite(heart.x)&&Number.isFinite(heart.y)&&Number.isFinite(heart.inv))&&Array.isArray(data.state.chars)&&data.state.chars.length<=3&&data.state.chars.every(char=>Number.isInteger(char)&&char>=0&&char<100)&&Array.isArray(data.state.hp)&&data.state.hp.length<=3&&data.state.hp.every(Number.isFinite)));
 }
 function receive(peer,event){
  if(typeof event.data!=='string'||event.data.length>16384)return;
  let data;try{data=JSON.parse(event.data);}catch{return;}
  if(data?.v!==2)return;
  if(mode==='host'){
   if(data.type==='input'&&party.receive(peer.seat,data)){peer.lastSeen=Date.now();return;}
   if(data.type==='claim'&&Number.isSafeInteger(data.seq)&&data.seq>=0&&data.seq>peer.claimSeq){
    peer.claimSeq=data.seq;peer.lastSeen=Date.now();
    const accepted=party.claim(peer.seat,data.characters,locked());
    send(peer,{v:2,type:'claim-result',seq:data.seq,ok:accepted});broadcast();render();
   }
  }else if(mode==='guest'&&peer===guestPeer){
   if(data.type==='state'&&validState(data)&&data.seq>peer.stateSeq){
    peer.stateSeq=data.seq;peer.lastSeen=Date.now();viewOwners=data.owners.slice();viewConnected=data.connected.slice();nativeState=data.state;nativeTime=Date.now();render();
   }else if(data.type==='claim-result'&&typeof data.ok==='boolean'&&Number.isSafeInteger(data.seq)){
    if(pendingClaim?.seq===data.seq)pendingClaim=null;
    status(data.ok?'Personagens reservados. Feche o painel para jogar.':'Escolha recusada: personagem ocupado ou esquiva em andamento.');
   }
  }
 }
 function wire(peer,channel){
  if(peer.channel||channel.label!=='bossroom-party'){channel.close();return;}
  peer.channel=channel;channel.onmessage=event=>receive(peer,event);channel.onclose=()=>drop(peer,'Conexão encerrada. Crie um novo convite para reconectar.');
  channel.onopen=()=>{
   if(peer.closed)return;peer.connected=true;peer.lastSeen=Date.now();releaseGameKeys();
   if(mode==='host'){party.connect(peer.seat);broadcast();}
   else{gamestarted=true;document.body.classList.add('party-guest');video.hidden=false;waiting.hidden=false;applyConfig();inputSnapshot();}
   status('Conectado. Marque seus personagens e feche o painel.');render();
  };
 }
 function createPeer(seat,host){
  if(!window.isSecureContext||!window.RTCPeerConnection)throw Error('Use HTTPS ou localhost em um navegador com WebRTC.');
  const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
  const peer={pc,seat,connected:false,closed:false,channel:null,sender:null,lastSeen:Date.now(),inputSeq:0,claimSeq:-1,stateSeq:-1,attachedTrack:null};
  if(host){peer.sender=pc.addTransceiver('video',{direction:'sendonly'}).sender;wire(peer,pc.createDataChannel('bossroom-party',{ordered:true}));}
  else{
   pc.ondatachannel=event=>wire(peer,event.channel);
   pc.ontrack=event=>{if(guestPeer!==peer)return;video.srcObject=event.streams[0]||new MediaStream([event.track]);video.play().catch(()=>status('Feche o painel ou toque em CO-OP para ativar o vídeo.'));};
  }
  pc.onconnectionstatechange=()=>{if(['failed','closed','disconnected'].includes(pc.connectionState))drop(peer,'Conexão interrompida. Crie outro convite.');};
  return peer;
 }
 async function writeCode(peer){
  await new Promise((resolve,reject)=>{
   const pc=peer.pc;if(pc.iceGatheringState==='complete'){resolve();return;}
   const timeout=setTimeout(()=>{cleanup();reject(Error('Tempo de conexão esgotado. Crie outro convite.'));},15000);
   function cleanup(){clearTimeout(timeout);pc.removeEventListener('icegatheringstatechange',check);}
   function check(){if(pc.iceGatheringState==='complete'){cleanup();resolve();}}
   pc.addEventListener('icegatheringstatechange',check);
  });
  if(peer.closed)return;
  el('out').value=JSON.stringify({app:'bossroom-party',v:2,seat:peer.seat,description:peer.pc.localDescription});
  status(mode==='host'?'Envie o convite para J'+(peer.seat+1)+' e aguarde a resposta.':'Envie esta resposta ao anfitrião e aguarde a conexão.');
 }
 function decode(type){
  let data;try{data=JSON.parse(el('in').value);}catch{throw Error('Código inválido. Cole o código completo.');}
  if(data?.app!=='bossroom-party'||data.v!==2||![1,2].includes(data.seat)||data.description?.type!==type||typeof data.description.sdp!=='string'||data.description.sdp.length>90000)throw Error('Código incompatível. Confira convite e resposta.');
  return data;
 }
 async function run(action){
  if(busy)return;busy=true;const revision=generation;for(const id of ['host','join','connect'])el(id).disabled=true;
  try{await action();}catch(error){if(generation===revision)status('Não foi possível conectar: '+error.message);}
  finally{busy=false;for(const id of ['host','join','connect'])el(id).disabled=false;render();}
 }
 async function attachVideo(){
  if(!hostActive()||!gamestarted||nativeState?.ready!==1||Date.now()-nativeTime>3000)return;
  const nextCanvas=frame.contentDocument?.querySelector('canvas');if(!nextCanvas?.captureStream)return;
  if(nextCanvas!==canvas){resetMedia();canvas=nextCanvas;try{stream=canvas.captureStream(30);}catch{canvas=null;status('O navegador não permitiu transmitir a batalha.');return;}}
  const track=stream?.getVideoTracks()[0];if(!track)return;
  for(const peer of peers.values())if(peer.connected&&peer.sender&&peer.attachedTrack!==track){peer.attachedTrack=track;try{await peer.sender.replaceTrack(track);}catch{peer.attachedTrack=null;status('Falha ao transmitir para J'+(peer.seat+1)+'. Reconecte esse jogador.');}}
 }
 function render(){
  const owners=mode==='guest'?viewOwners:party.owners,connected=mode==='guest'?viewConnected:party.connected;
  const labels=[];
  for(let char=0;char<3;char++){
   const owner=owners[char],input=panel.querySelector('[data-character="'+char+'"]');input.checked=mode==='guest'&&pendingClaim?pendingClaim.characters.includes(char):owner===mySeat;
   input.disabled=locked()||(owner!==-1&&owner!==mySeat)||(mode==='guest'&&!guestPeer?.connected);
   el('owner-'+char).textContent=owner===-1?'LIVRE (ANFITRIÃO)':owner===mySeat?'SEU':'J'+(owner+1);
   labels.push(names[char]+': '+(owner===-1?'livre':'J'+(owner+1)));
  }
  el('roster').textContent=labels.join(' · ')+(locked()?' · Escolhas travadas durante a esquiva.':'');
  el('seat').disabled=mode==='guest';
  const mine=names.filter((_,char)=>owners[char]===mySeat);
  const turnSlot=nativeState?.turn,character=Number.isInteger(turnSlot)?nativeState?.chars?.[turnSlot]:null;
  const turnOwner=character>=1&&character<=3?(owners[character-1]===-1?0:owners[character-1]):0;
  const ready=nativeState?.ready===1&&Date.now()-nativeTime<3000;
  const lead='J'+(mySeat+1)+' · '+(mine.length?mine.join(' / '):'ESCOLHA SEUS PERSONAGENS');
  banner.textContent=lead+(ready?(locked()?' · ESQUIVA':' · TURNO DE J'+(turnOwner+1)):' · AGUARDANDO BATALHA');banner.hidden=!active();
  if(mode==='guest'){waiting.hidden=ready&&video.readyState>=2;waiting.textContent=ready?'Aguardando vídeo da batalha…':'Aguardando o anfitrião iniciar uma batalha compatível…';}
  document.body.dataset.partySeat=String(mySeat);
  for(const option of el('seat').options){const seat=Number(option.value);option.textContent='J'+(seat+1)+(connected[seat]?' · CONECTADO':seat===1?' · MAGENTA':' · CIANO');}
 }
 panel.querySelectorAll('[data-character]').forEach(input=>input.onchange=()=>{
  const chars=[...panel.querySelectorAll('[data-character]:checked')].map(node=>Number(node.dataset.character));
  if(mode==='guest'){pendingClaim={seq:claimSeq++,characters:chars};send(guestPeer,{v:2,type:'claim',...pendingClaim});}
  else{if(!party.claim(0,chars,locked()))status('Escolha recusada: personagem ocupado ou esquiva em andamento.');broadcast();}
  release();render();
 });
 el('host').onclick=()=>run(async()=>{
  if(mode==='guest')throw Error('Encerre a sessão de convidado antes de criar convites.');
  const seat=Number(el('seat').value),existing=peers.get(seat);
  if(existing?.connected)throw Error('J'+(seat+1)+' já está conectado.');
  if(existing)drop(existing);
  el('out').value='';el('in').value='';status('Preparando convite para J'+(seat+1)+'…');
  mode='host';mySeat=0;const peer=createPeer(seat,true);peers.set(seat,peer);
  try{await peer.pc.setLocalDescription(await peer.pc.createOffer());await writeCode(peer);}catch(error){drop(peer);throw error;}
 });
 el('join').onclick=()=>run(async()=>{
  if(mode||gamestarted)throw Error('Entre pelo menu, sem batalha ou sessão aberta.');
  const offer=decode('offer'),peer=createPeer(offer.seat,false);el('out').value='';status('Preparando resposta…');mode='guest';mySeat=offer.seat;claimSeq=0;pendingClaim=null;viewOwners=[0,-1,-1];nativeState=null;guestPeer=peer;
  try{await peer.pc.setRemoteDescription(offer.description);await peer.pc.setLocalDescription(await peer.pc.createAnswer());await writeCode(peer);}catch(error){drop(peer);throw error;}
 });
 el('connect').onclick=()=>run(async()=>{
  const answer=decode('answer'),peer=peers.get(answer.seat);
  if(mode!=='host'||!peer||peer.pc.signalingState!=='have-local-offer')throw Error('Crie um convite para esse jogador primeiro.');
  status('Conectando…');await peer.pc.setRemoteDescription(answer.description);
 });
 el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(el('out').value);status('Código copiado.');}catch{el('out').select();status('Selecione e copie o código acima.');}};
 el('controls').onclick=()=>toggleMobileHardware();el('stop').onclick=()=>stop();
 open.onclick=()=>{releaseGameKeys();release();render();panel.showModal();};
 el('close').onclick=()=>{panel.close();if(mode==='guest')video.play().catch(()=>{});};
 panel.addEventListener('close',release);panel.addEventListener('cancel',release);
 window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});window.addEventListener('pagehide',()=>stop());
 setInterval(()=>{
  const now=Date.now();
  if(mode==='host'){
   party.expire();for(const peer of [...peers.values()])if(peer.connected&&now-peer.lastSeen>5000)drop(peer,'J'+(peer.seat+1)+' ficou sem resposta. Seus personagens voltaram ao anfitrião.');
   broadcast();attachVideo().catch(()=>status('Falha na transmissão. Reconecte o convidado.'));
  }else if(mode==='guest'&&guestPeer?.connected){if(now-guestPeer.lastSeen>5000)drop(guestPeer,'Anfitrião sem resposta. Crie uma nova conexão.');else inputSnapshot();}
  render();
 },100);
 window.BossRoomParty={
  get state(){return nativeState;},qa:null,
  packet(){const packet=party.packet(hostActive());if(this.qa!==null)packet.qa=this.qa;return packet;},
  receive(state){if(mode==='guest'||state?.v!==2||state.ready!==1)return;nativeState=state;nativeTime=Date.now();},
  get owners(){return(mode==='guest'?viewOwners:party.owners).slice();},
  get seat(){return mySeat;}
 };
 window.BossRoomCoop={
  get active(){return active();},get guest(){return mode==='guest'&&guestPeer!==null;},
  releaseAll(){release();},
  route(key,down){
   if(!active())return false;
   if(!keys.includes(key))return true;
   if(panel.open){release();return true;}
   down?localHeld.add(key):localHeld.delete(key);
   if(mode==='host')party.input(0,key,down);else inputSnapshot();return true;
  }
 };
 render();
})();
