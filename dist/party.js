/* Native party co-op with short-code discovery and direct WebRTC data only. */
(function(){
 'use strict';
 const {Party,keys,seatValid}=BossRoomPartyCore;
 const names=['Kris','Susie','Ralsei'];
 const panel=document.createElement('dialog');panel.id='party-panel';panel.setAttribute('aria-labelledby','party-title');
 panel.innerHTML=`<div class="dialog-top"><h2 id="party-title">CO-OP · ESCOLHA SUA PARTY</h2><button id="party-close" aria-label="Fechar co-op">×</button></div>
 <p>Cada jogador roda sua própria cópia da batalha. A rede sincroniza as escolhas e controles; vídeo do anfitrião não é enviado.</p>
 <fieldset id="party-characters"><legend>SEUS PERSONAGENS</legend>${names.map((name,i)=>`<label><input type="checkbox" data-character="${i}"> ${name} <span id="party-owner-${i}"></span></label>`).join('')}</fieldset>
 <p id="party-roster" aria-live="polite"></p>
 <details><summary>COMO JOGAR EM CO-OP</summary><p>1. O anfitrião cria uma sala e envia o código de 6 dígitos. 2. Os amigos digitam o código e entram. 3. Cada um escolhe seus personagens. Depois, o anfitrião inicia a batalha.</p></details>
 <div class="party-actions"><button id="party-host">CRIAR SALA</button><button id="party-copy" disabled>COPIAR CÓDIGO</button></div>
 <p id="party-room" aria-live="polite" hidden>SEU CÓDIGO: <strong id="party-code-display"></strong></p>
 <label for="party-code">Entrar numa sala</label><input id="party-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="000000" aria-label="Código de 6 dígitos">
 <button id="party-join">ENTRAR NA SALA</button>
 <p id="party-status" role="status" aria-live="polite">Sem conexão. Personagens livres ficam com o anfitrião.</p>
 <p class="party-note">A conexão P2P troca apenas dados do jogo. O código é temporário; algumas redes podem bloquear conexões diretas.</p>
 <button id="party-controls">CONTROLES NA TELA</button><button id="party-stop" hidden>ENCERRAR CO-OP</button>`;
 document.body.append(panel);
 const open=document.createElement('button');open.id='party-open';open.textContent='CO-OP';open.setAttribute('aria-haspopup','dialog');document.body.append(open);
 const banner=document.createElement('div');banner.id='party-banner';banner.hidden=true;banner.setAttribute('role','status');document.body.append(banner);
 const waiting=document.createElement('div');waiting.id='party-waiting';waiting.hidden=true;waiting.textContent='Aguardando o anfitrião iniciar a batalha…';document.body.append(waiting);
 const el=id=>document.getElementById('party-'+id),status=text=>{el('status').textContent=text;};
 let party=new Party(),mode=null,mySeat=0,guestPeer=null,signalingPeer=null,roomCode='',viewOwners=[0,-1,-1],viewConnected=[true,false,false];
 let nativeState=null,localNativeState=null,nativeTime=0,localNativeTime=0,localError='',remoteHeld=[[],[],[]],busy=false,generation=0,claimSeq=0,stateSeq=0,pendingClaim=null,pendingLaunch=null,activeBossId=null,localLaunchStarted=false;
 const peers=new Map(),localHeld=new Set(),peerOptions=()=>window.BOSSROOM_PEER_OPTIONS||{};
 const hostActive=()=>mode==='host'&&[...peers.values()].some(peer=>peer.connected);
 const active=()=>hostActive()||(mode==='guest'&&guestPeer?.connected===true);
 const locked=()=>Array.isArray(nativeState?.hearts)&&nativeState.hearts.length>0;
 function send(peer,data){if(peer?.channel?.open&&peer.channel.dataChannel?.bufferedAmount<65536){try{peer.channel.send(data);return true;}catch{}}return false;}
 function inputSnapshot(){if(mode==='guest')send(guestPeer,{v:2,type:'input',seq:guestPeer.inputSeq++,keys:[...localHeld]});}
 function release(){localHeld.clear();party.release(0);inputSnapshot();}
 function closePeer(peer){clearTimeout(peer.connectTimer);clearTimeout(peer.handshakeTimer);if(peer.channel){peer.channel.removeAllListeners?.('close');peer.channel.removeAllListeners?.('data');peer.channel.close();}peer.call?.close();peer.localPeer?.destroy();if(signalingPeer===peer.localPeer)signalingPeer=null;}
 function drop(peer,message){
  if(!peer||peer.closed)return;peer.closed=true;peer.connected=false;closePeer(peer);
  if(mode==='host'){peers.delete(peer.seat);party.disconnect(peer.seat);broadcast();}
  else if(mode==='guest'&&guestPeer===peer){guestPeer=null;mode=null;mySeat=0;release();waiting.hidden=true;document.body.classList.remove('party-guest');gamestarted=false;document.getElementById('main-menu-ui').style.display='';applyConfig();}
  if(message)status(message);render();
 }
 function stop(message='Sessão encerrada. O anfitrião voltou ao controle solo.'){
  generation++;release();if(guestPeer)drop(guestPeer);for(const peer of [...peers.values()])drop(peer);
  mode=null;mySeat=0;party=new Party();viewOwners=[0,-1,-1];viewConnected=[true,false,false];nativeState=null;localNativeState=null;nativeTime=0;remoteHeld=[[],[],[]];pendingClaim=null;pendingLaunch=null;activeBossId=null;roomCode='';
  signalingPeer?.destroy();signalingPeer=null;waiting.hidden=true;banner.hidden=true;status(message);render();
 }
 function stateForWire(){
  if(!nativeState)return null;
  return{v:2,ready:nativeState.ready===1?1:0,turn:Number.isInteger(nativeState.turn)?nativeState.turn:-1,myfight:Number.isFinite(nativeState.myfight)?nativeState.myfight:-1,
   chars:Array.isArray(nativeState.chars)?nativeState.chars.slice(0,3):[],hp:Array.isArray(nativeState.hp)?nativeState.hp.slice(0,3):[],
   hearts:Array.isArray(nativeState.hearts)?nativeState.hearts.slice(0,3).map(heart=>({seat:heart.seat,x:heart.x,y:heart.y,inv:heart.inv})):[],held:party.packet(hostActive()).held};
 }
 function broadcast(){if(mode!=='host')return;if(!activeBossId&&nativeState?.ready===1){const saved=sessionStorage.getItem('bossroom-active');if(validBossId(saved))activeBossId=saved;}const message={v:2,type:'state',seq:stateSeq++,owners:party.owners,connected:party.connected,held:party.packet(hostActive()).held,state:stateForWire(),boss:activeBossId};for(const peer of peers.values())if(peer.connected)send(peer,message);}
 function validState(data){
   return Number.isSafeInteger(data.seq)&&data.seq>=0&&(data.boss===undefined||data.boss===null||validBossId(data.boss))&&Array.isArray(data.owners)&&data.owners.length===3&&data.owners.every(owner=>owner===-1||seatValid(owner))&&Array.isArray(data.connected)&&data.connected.length===3&&data.connected.every(value=>typeof value==='boolean')&&Array.isArray(data.held)&&data.held.length===3&&data.held.every(keys=>Array.isArray(keys)&&keys.length===10&&keys.every(value=>value===0||value===1))&&
   (data.state===null||(data.state?.v===2&&[0,1].includes(data.state.ready)&&Number.isInteger(data.state.turn)&&Number.isFinite(data.state.myfight)&&Array.isArray(data.state.held)&&data.state.held.length===3&&data.state.held.every(keys=>Array.isArray(keys)&&keys.length===10&&keys.every(value=>value===0||value===1))&&Array.isArray(data.state.hearts)&&data.state.hearts.length<=3&&data.state.hearts.every(heart=>seatValid(heart?.seat)&&Number.isFinite(heart.x)&&Number.isFinite(heart.y)&&Number.isFinite(heart.inv))&&Array.isArray(data.state.chars)&&data.state.chars.length<=3&&data.state.chars.every(char=>Number.isInteger(char)&&char>=0&&char<100)&&Array.isArray(data.state.hp)&&data.state.hp.length<=3&&data.state.hp.every(Number.isFinite)));
 }
 const validBossId=boss=>typeof boss==='string'&&/^[a-z0-9-]{1,32}$/.test(boss);
 function startGuestBoss(boss,retry=false){
  if(mode!=='guest'||!guestPeer||!validBossId(boss))return;
  if(pendingLaunch!==boss||retry){pendingLaunch=boss;localNativeState=null;localNativeTime=0;localError='';localLaunchStarted=false;}
  if(!window.BossRoomLaunch||localLaunchStarted)return;
  localLaunchStarted=true;window.BossRoomLaunch(boss);
 }
 function receive(peer,data){
  try{if(JSON.stringify(data).length>16384)return;}catch{return;}
  if(data?.v!==2)return;
  if(mode==='host'){
   if(data.type==='input'&&party.receive(peer.seat,data)){peer.lastSeen=Date.now();return;}
   if(data.type==='claim'&&Number.isSafeInteger(data.seq)&&data.seq>=0&&data.seq>peer.claimSeq){peer.claimSeq=data.seq;peer.lastSeen=Date.now();const accepted=party.claim(peer.seat,data.characters,locked());send(peer,{v:2,type:'claim-result',seq:data.seq,ok:accepted});broadcast();render();}
  }else if(mode==='guest'&&peer===guestPeer){
   if(data.type==='hello'&&seatValid(data.seat)&&data.seat>0){clearTimeout(peer.handshakeTimer);peer.seat=data.seat;mySeat=data.seat;gamestarted=true;document.body.classList.add('party-guest');applyConfig();status('Conectado. Escolha seus personagens.');render();if(pendingLaunch)startGuestBoss(pendingLaunch);}
   else if(data.type==='full'){drop(peer,'Essa sala já está cheia.');return;}
   else if(data.type==='state'&&validState(data)&&data.seq>peer.stateSeq){peer.stateSeq=data.seq;peer.lastSeen=Date.now();viewOwners=data.owners.slice();viewConnected=data.connected.slice();nativeState=data.state;remoteHeld=data.held;nativeTime=Date.now();if(validBossId(data.boss))startGuestBoss(data.boss);render();}
   else if(data.type==='launch'&&validBossId(data.boss))startGuestBoss(data.boss,true);
   else if(data.type==='claim-result'&&typeof data.ok==='boolean'&&Number.isSafeInteger(data.seq)){if(pendingClaim?.seq===data.seq)pendingClaim=null;status(data.ok?'Personagens reservados. Feche o painel para jogar.':'Escolha recusada: personagem ocupado ou esquiva em andamento.');}
  }
 }
 function wire(peer,channel){
  if(peer.channel||channel.metadata?.app!=='bossroom-party'){channel.close();return;}
  peer.channel=channel;channel.on('data',data=>receive(peer,data));channel.on('close',()=>drop(peer,'Conexão encerrada. Você pode entrar de novo com o mesmo código.'));
  channel.on('open',()=>{if(peer.closed)return;clearTimeout(peer.connectTimer);peer.connected=true;peer.lastSeen=Date.now();releaseGameKeys();
   if(mode==='host'){if(peer.seat<1){send(peer,{v:2,type:'full'});setTimeout(()=>drop(peer),200);}else{party.connect(peer.seat);send(peer,{v:2,type:'hello',seat:peer.seat});if(activeBossId)send(peer,{v:2,type:'launch',boss:activeBossId});broadcast();status('Jogador J'+(peer.seat+1)+' conectado.');}}
   else{status('Conectando à sala…');inputSnapshot();peer.handshakeTimer=setTimeout(()=>{if(mode==='guest'&&mySeat===0)drop(peer,'A sala não respondeu. Confira o código e tente de novo.');},10000);}render();
  });
 }
 function subscribeHost(peer){
  peer.on('connection',channel=>{
   if(channel.metadata?.app!=='bossroom-party'){channel.close();return;}
   const seat=peers.size<2?[1,2].find(value=>!peers.has(value)):undefined;
   const remote={seat:seat||-1,peerId:channel.peer,connected:false,closed:false,channel:null,lastSeen:Date.now(),inputSeq:0,claimSeq:-1,stateSeq:-1,call:null};
   if(seat){peers.set(seat,remote);remote.connectTimer=setTimeout(()=>{if(!remote.connected)drop(remote,'Jogador demorou para conectar. A sala continua aberta.');},15000);}wire(remote,channel);
  });
 }
 function subscribeGuest(peer){
  peer.on('error',error=>{if(mode!=='guest'||signalingPeer!==peer)return;const message=error.type==='peer-unavailable'?'Sala não encontrada. Confira o código e tente de novo.':'Conexão interrompida. Entre de novo com o mesmo código.';if(guestPeer?.localPeer===peer)drop(guestPeer,message);else{mode=null;signalingPeer=null;peer.destroy();status(message);render();}});
 }
 function newPeer(id){return new Peer(id,peerOptions());}
 function randomCode(){const value=new Uint32Array(1);crypto.getRandomValues(value);return String(value[0]%1000000).padStart(6,'0');}
 function waitOpen(peer,timeout=30000){return new Promise((resolve,reject)=>{let done=false;const timer=setTimeout(()=>finish(Error('O serviço de salas demorou demais. Tente novamente.')),timeout);function finish(error,value){if(done)return;done=true;clearTimeout(timer);peer.off('open',opened);peer.off('error',failed);error?reject(error):resolve(value);}function opened(){finish(null,peer);}function failed(error){finish(error);}peer.once('open',opened);peer.once('error',failed);});}
 async function run(action){if(busy)return;busy=true;render();try{await action();}catch(error){status(error.message||'Não foi possível conectar. Tente novamente.');}finally{busy=false;render();}}
 async function createRoom(){
  if(mode==='guest')throw Error('Encerre a sessão de convidado antes de criar uma sala.');
  if(mode==='host')throw Error('Você já criou uma sala.');
  if(!window.isSecureContext||!window.Peer)throw Error('O navegador não conseguiu carregar a conexão P2P. Atualize a página e tente novamente.');
  mode='host';mySeat=0;status('Criando sala…');
  for(let attempt=0;attempt<5;attempt++){
   const code=randomCode(),peer=newPeer('dtrbr'+code);
   try{await waitOpen(peer);signalingPeer=peer;roomCode=code;subscribeHost(peer);peer.on('error',error=>{if(mode==='host')status(error.type==='network'?'Servidor de sala desconectado. Jogadores conectados podem continuar.':'Erro na sala: '+error.type);});status('Sala criada. Envie o código para seus amigos.');return;}
   catch(error){peer.destroy();if(error.type==='unavailable-id')continue;mode=null;throw error;}
  }
  mode=null;throw Error('Não consegui reservar um código agora. Tente criar a sala novamente.');
 }
 async function joinRoom(){
  if(mode||gamestarted)throw Error('Entre pelo menu, sem batalha ou outra sala aberta.');
  if(!window.isSecureContext||!window.Peer)throw Error('O navegador não conseguiu carregar a conexão P2P. Atualize a página e tente novamente.');
  const code=el('code').value.trim();if(!/^\d{6}$/.test(code))throw Error('Digite os 6 números do código da sala.');
  mode='guest';mySeat=0;claimSeq=0;pendingClaim=null;viewOwners=[0,-1,-1];nativeState=null;roomCode=code;status('Procurando a sala…');
  const peer=newPeer();signalingPeer=peer;const openTimer=setTimeout(()=>{if(mode==='guest'&&signalingPeer===peer&&!guestPeer){mode=null;signalingPeer=null;peer.destroy();status('O serviço de salas demorou demais. Confira sua conexão e tente novamente.');render();}},30000);
  peer.on('open',()=>{clearTimeout(openTimer);if(mode!=='guest')return;const channel=peer.connect('dtrbr'+code,{metadata:{app:'bossroom-party',v:2},serialization:'json'});const remote={seat:0,peerId:'dtrbr'+code,localPeer:peer,connected:false,closed:false,channel:null,lastSeen:Date.now(),inputSeq:0,claimSeq:-1,stateSeq:-1,call:null};guestPeer=remote;wire(remote,channel);});
  subscribeGuest(peer);
  peer.on('error',()=>clearTimeout(openTimer));
 }
 function launch(boss){if(!validBossId(boss))return;activeBossId=boss;if(mode==='host'){for(const peer of peers.values())if(peer.connected)send(peer,{v:2,type:'launch',boss});}pendingLaunch=boss;window.BossRoomLaunch?.(boss);}
 function render(){
  const owners=mode==='guest'?viewOwners:party.owners;
  for(let char=0;char<3;char++){const owner=owners[char],input=panel.querySelector('[data-character="'+char+'"]');input.checked=mode==='guest'&&pendingClaim?pendingClaim.characters.includes(char):owner===mySeat;
   input.disabled=locked()||(owner!==-1&&owner!==mySeat)||(mode==='guest'&&!guestPeer?.connected);
   el('owner-'+char).textContent=owner===-1?'LIVRE (ANFITRIÃO)':owner===mySeat?'SEU':'J'+(owner+1);}
  const labels=names.map((name,char)=>name+': '+(owners[char]===-1?'livre':'J'+(owners[char]+1)));
  el('roster').textContent=labels.join(' · ')+(locked()?' · Escolhas travadas durante a esquiva.':'');
  el('room').hidden=mode!=='host';el('code-display').textContent=roomCode;el('copy').disabled=mode!=='host'||!roomCode;
  el('code').disabled=mode!==null;el('join').disabled=busy||mode!==null||gamestarted;el('host').disabled=busy||mode!==null;el('stop').hidden=mode===null;
  const mine=names.filter((_,char)=>owners[char]===mySeat),turnSlot=nativeState?.turn,character=Number.isInteger(turnSlot)?nativeState?.chars?.[turnSlot]:null;
  const turnOwner=character>=1&&character<=3?(owners[character-1]===-1?0:owners[character-1]):0,ready=nativeState?.ready===1&&Date.now()-nativeTime<3000;
  const localReady=mode==='guest'&&!localError&&localNativeState?.ready===1&&Date.now()-localNativeTime<3000;
  banner.textContent='J'+(mySeat+1)+' · '+(mine.length?mine.join(' / '):'ESCOLHA SEUS PERSONAGENS')+(ready?(locked()?' · ESQUIVA':' · TURNO DE J'+(turnOwner+1)):' · AGUARDANDO BATALHA');banner.hidden=!active();
  if(mode==='guest'){
   waiting.hidden=localReady;
   waiting.textContent=localError?'Falha ao iniciar sua batalha: '+localError:ready?(pendingLaunch?'Carregando a batalha local… Se continuar assim, verifique WebGL e recarregue a página.':'O anfitrião já começou, mas a partida ainda não sincronizou. Tentando novamente…'):'Aguardando o anfitrião iniciar a batalha…';
  }
  document.body.dataset.partySeat=String(mySeat);
 }
 panel.querySelectorAll('[data-character]').forEach(input=>input.onchange=()=>{const characters=[...panel.querySelectorAll('[data-character]:checked')].map(node=>Number(node.dataset.character));
  if(mode==='guest'){pendingClaim={seq:claimSeq++,characters};send(guestPeer,{v:2,type:'claim',...pendingClaim});}
  else{if(!party.claim(0,characters,locked()))status('Escolha recusada: personagem ocupado ou esquiva em andamento.');broadcast();}
  release();render();
 });
 el('host').onclick=()=>run(createRoom);el('join').onclick=()=>run(joinRoom);
 el('code').addEventListener('input',()=>{el('code').value=el('code').value.replace(/\D/g,'').slice(0,6);});
 el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(roomCode);status('Código copiado. Envie para seus amigos.');}catch{status('Seu código é '+roomCode+'. Selecione e copie.');}};
 el('controls').onclick=()=>toggleMobileHardware();el('stop').onclick=()=>stop();
 open.onclick=()=>{releaseGameKeys();release();render();panel.showModal();};
 el('close').onclick=()=>{panel.close();};
 panel.addEventListener('close',release);panel.addEventListener('cancel',release);window.addEventListener('blur',release);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});window.addEventListener('pagehide',()=>stop());
 setInterval(()=>{const now=Date.now();if(mode==='host'){party.expire();for(const peer of [...peers.values()])if(peer.connected&&now-peer.lastSeen>30000)drop(peer,'J'+(peer.seat+1)+' ficou sem resposta. Ele pode entrar de novo com o mesmo código.');broadcast();}
  else if(mode==='guest'&&guestPeer?.connected){if(now-guestPeer.lastSeen>30000)drop(guestPeer,'Anfitrião sem resposta. Entre de novo com o mesmo código.');else inputSnapshot();}render();},100);
 window.BossRoomParty={get state(){return nativeState;},get localState(){return mode==='guest'?localNativeState:nativeState;},get localReady(){return mode==='guest'&&localNativeState?.ready===1&&Date.now()-localNativeTime<3000;},reportLocalError(message){if(mode!=='guest')return;localError=String(message||'Erro desconhecido.').slice(0,180);render();},qa:null,packet(){let packet;if(mode==='guest'){packet={v:2,active:active()?1:0,local_seat:mySeat,owners:viewOwners.map(owner=>owner<0?0:owner),held:remoteHeld.map((held,seat)=>Array.from({length:10},(_,i)=>i<7&&(seat===mySeat?localHeld.has(BossRoomPartyCore.keys[i]):held.includes(BossRoomPartyCore.keys[i]))?1:0))};}else{packet=party.packet(hostActive());packet.local_seat=0;}if(this.qa!==null)packet.qa=this.qa;return packet;},receive(state){if(mode==='guest'){if(state?.v===2&&state.ready===1){localNativeState=state;localNativeTime=Date.now();localError='';}return;}if(state?.v!==2||state.ready!==1)return;nativeState=state;nativeTime=Date.now();},get owners(){return(mode==='guest'?viewOwners:party.owners).slice();},get seat(){return mySeat;},launch};
 window.BossRoomCoop={get active(){return active();},get guest(){return mode==='guest'&&guestPeer!==null;},get role(){return mode;},releaseAll(){release();},launch,route(key,down){if(!active())return false;if(!keys.includes(key))return true;if(panel.open){release();return true;}down?localHeld.add(key):localHeld.delete(key);if(mode==='host')party.input(0,key,down);else inputSnapshot();return true;}};
 render();
})();
