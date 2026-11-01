let presets=[],selectedBoss=null,currentChapter=0;
const bossColors={jevil:'#935fe4',king:'#7485e6',spamton:'#e4bb46','spamton-neo':'#db3b8e',queen:'#51c9f0','giga-queen':'#30bdd5',tenna:'#e51c65',knight:'#b2afc2',gerson:'#80b12c',pink:'#ff83b1',flowery:'#f1d64b'};
const descriptions={jevil:'O caos não termina. Você ainda pode jogar.',king:'O trono espera. Mostre sua determinação.',spamton:'Uma oportunidade IMPERDÍVEL acaba de aparecer.','spamton-neo':'É a sua chance de ser um BIG SHOT.',queen:'A próxima rodada é por conta da rainha.','giga-queen':'Entre no ringue. Prepare os punhos.',tenna:'As câmeras estão ligadas. O show vai começar.',knight:'O silêncio antes da próxima lâmina.',gerson:'O sino da justiça está tocando.',pink:'Parece que alguém estava esperando por você.',flowery:'Um último encontro. Mantenha sua determinação.'};
const labels={jevil:'CAOS',king:'O REI',spamton:'UM BOM NEGÓCIO','spamton-neo':'BIG SHOT',queen:'CYBER WORLD','giga-queen':'ÚLTIMO ROUND',tenna:'NO AR',knight:'O CAVALEIRO',gerson:'JUSTIÇA',pink:'ENCONTRO SECRETO',flowery:'ATO FINAL'};
function filteredBosses(){return presets.filter(b=>!currentChapter||b.ch===currentChapter)}
function renderBosses(ch=currentChapter){
 currentChapter=ch;const list=document.getElementById('boss-list');list.replaceChildren();const bosses=filteredBosses();
 if(!bosses.some(b=>b.id===selectedBoss?.id))selectedBoss=bosses[0];
 const active=bosses.findIndex(b=>b.id===selectedBoss?.id);
 document.getElementById('count').textContent=String(bosses.length).padStart(2,'0')+' ENCONTROS';
 document.getElementById('position').textContent=String(active+1).padStart(2,'0')+' / '+String(bosses.length).padStart(2,'0');
 for(let i=0;i<bosses.length;i++){
  const boss=bosses[i];let delta=i-active;if(delta>bosses.length/2)delta-=bosses.length;if(delta< -bosses.length/2)delta+=bosses.length;
  const distance=Math.abs(delta),mobile=window.innerWidth<=760;
  const offsets=mobile?[0,164,295,390]:[0,210,373,505];
  const button=document.createElement('button');button.className='boss-card';button.dataset.boss=boss.id;button.type='button';
  button.hidden=distance>3;button.setAttribute('aria-pressed',String(distance===0));button.setAttribute('aria-label',boss.name+', capítulo '+boss.ch);
  button.style.setProperty('--card',bossColors[boss.id]);button.style.setProperty('--x',(Math.sign(delta)*(offsets[Math.min(distance,3)]))+'px');button.style.setProperty('--scale',String([1,.86,.72,.61][Math.min(distance,3)]));button.style.setProperty('--z',String(10-distance));
  button.innerHTML='<span class="corner tl" aria-hidden="true"></span><span class="corner tr" aria-hidden="true"></span><span class="corner bl" aria-hidden="true"></span><span class="corner br" aria-hidden="true"></span><span class="card-chapter">CAPÍTULO '+boss.ch+'</span><span class="card-portrait"><img src="./art/'+boss.id+'.png" alt="" draggable="false"></span><strong>'+boss.name.toUpperCase()+'</strong><span class="card-label">'+labels[boss.id]+'</span>';
  button.onclick=()=>{if(selectedBoss.id!==boss.id)playMove();selectedBoss=boss;renderBosses();renderDetail()};list.append(button);
 }
 const onlyOne=bosses.length<2;document.getElementById('previous-boss').disabled=onlyOne;document.getElementById('next-boss').disabled=onlyOne;
}
function renderDetail(){
 const panel=document.getElementById('detail');panel.replaceChildren();if(!selectedBoss)return;
 document.documentElement.style.setProperty('--accent',bossColors[selectedBoss.id]);
 const box=document.createElement('div');box.className='dialogue-box';
 const name=document.createElement('div');name.className='dialogue-name';name.textContent=selectedBoss.name.toUpperCase()+' / CAPÍTULO '+selectedBoss.ch;
 const text=document.createElement('p');text.textContent=descriptions[selectedBoss.id];box.append(name,text);
 const button=document.createElement('button');button.id='launch';button.type='button';button.setAttribute('aria-label','Lutar contra '+selectedBoss.name);button.innerHTML='<span class="soul-icon" aria-hidden="true"></span><span>LUTAR</span>';button.onclick=()=>startBoss(selectedBoss);panel.append(box,button);
 document.getElementById('error').textContent='';
}
function moveBoss(direction){const bosses=filteredBosses();if(!bosses.length)return;const index=bosses.findIndex(b=>b.id===selectedBoss.id);selectedBoss=bosses[(index+direction+bosses.length)%bosses.length];playMove();renderBosses();renderDetail()}
async function startBoss(b){const button=document.getElementById('launch');button.disabled=true;document.getElementById('error').textContent='';try{const probe=document.createElement('canvas');if(!probe.getContext('webgl2')&&!probe.getContext('webgl'))throw Error('Este navegador não disponibilizou WebGL. Tente o Chrome ou Firefox com aceleração gráfica ativada.');if(!Object.keys(b.files).length)throw Error('Checkpoint indisponível.');for(const [name,text] of Object.entries(b.files))await setSaveItem('/_savedata/'+name,text);await setSaveItem('/_savedata/dr.ini','[LANG]\nLANG=\"en\"\n');if(!b.battle)throw Error('Configuração da batalha indisponível.');await setSaveItem('/_savedata/bossroom.ini','[battle]\nencounter='+b.battle.encounter+'\nspecial='+b.battle.special+'\nmusic="'+b.battle.music+'"\n');sessionStorage.setItem('bossroom-active',b.id);document.getElementById('playing-name').textContent=b.name+' · BATALHA DIRETA';document.getElementById('game-toolbar').hidden=false;loadChapter(b.ch);}catch(e){document.getElementById('error').textContent='Não foi possível abrir: '+e.message;button.disabled=false}}
function restartBoss(){location.href='./?retry=1&boss='+encodeURIComponent(sessionStorage.getItem('bossroom-active')||'')}
document.querySelectorAll('#filters button').forEach(button=>button.onclick=()=>{document.querySelectorAll('#filters button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));playMove();renderBosses(Number(button.dataset.ch));renderDetail()});
document.getElementById('previous-boss').onclick=()=>moveBoss(-1);document.getElementById('next-boss').onclick=()=>moveBoss(1);
const optionsDialog=document.getElementById('menu-options');
document.getElementById('options-open').onclick=()=>{playSelect();optionsDialog.showModal()};
for(const id of ['options-close','options-done'])document.getElementById(id).onclick=()=>optionsDialog.close();
optionsDialog.addEventListener('click',e=>{if(e.target===optionsDialog){const r=optionsDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)optionsDialog.close()}});
const volumeSlider=document.getElementById('menu-volume');
function applyMenuVolume(value){const volume=Math.max(0,Math.min(1,Number(value)));sndMenuMove.volume=volume;sndSelect.volume=volume;volumeSlider.value=String(volume)}
applyMenuVolume(localStorage.getItem('bossroom-menu-volume')??.5);
volumeSlider.oninput=()=>{applyMenuVolume(volumeSlider.value);localStorage.setItem('bossroom-menu-volume',volumeSlider.value)};
window.addEventListener('keydown',event=>{
 if(gamestarted||event.ctrlKey||event.altKey||event.metaKey)return;
 const key=event.key.toLowerCase();
 if(optionsDialog.open){if(key==='x'){event.preventDefault();optionsDialog.close()}return;}
 if(event.target instanceof HTMLInputElement)return;
 if(['arrowleft','arrowup','a','w'].includes(key)){event.preventDefault();moveBoss(-1)}
 else if(['arrowright','arrowdown','d','s'].includes(key)){event.preventDefault();moveBoss(1)}
 else if((key==='z'||key==='enter')&&!event.repeat&&selectedBoss){if(key==='enter'&&event.target instanceof HTMLButtonElement&&!event.target.matches('.boss-card,#launch'))return;event.preventDefault();document.getElementById('launch').click()}
});
let menuResize;window.addEventListener('resize',()=>{cancelAnimationFrame(menuResize);menuResize=requestAnimationFrame(()=>{if(!gamestarted&&presets.length)renderBosses()})});
fetch('./presets.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Não foi possível preparar as batalhas.');return r.json()}).then(data=>{
 const order=['jevil','king','spamton','spamton-neo','queen','giga-queen','tenna','knight','gerson','pink','flowery'];
 presets=data.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));selectedBoss=presets.find(b=>b.id===new URLSearchParams(location.search).get('boss'))||presets.find(b=>b.id==='tenna');renderBosses();renderDetail();
 if(new URLSearchParams(location.search).get('retry')==='1')startBoss(selectedBoss);
}).catch(error=>{document.getElementById('error').textContent=error.message});
