/* Boss Room native GameMaker patch loader. Copy/insert payloads are hash checked. */
(function(root){
  'use strict';
  const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
  async function apply(original,payload){
    original=new Uint8Array(original);payload=new Uint8Array(payload);
    if(payload.length<76||new TextDecoder().decode(payload.subarray(0,4))!=='BRP1')throw Error('Patch de batalha inválido.');
    const digest=async bytes=>new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
    if(!equal(await digest(original),payload.subarray(4,36)))throw Error('A versão do jogo difere da versão esperada.');
    const view=new DataView(payload.buffer,payload.byteOffset,payload.byteLength);
    const output=new Uint8Array(view.getUint32(68,true));const count=view.getUint32(72,true);
    let cursor=76,written=0;
    const read32=()=>{if(cursor+4>payload.length)throw Error('Patch incompleto.');const n=view.getUint32(cursor,true);cursor+=4;return n;};
    for(let i=0;i<count;i++){
      if(cursor>=payload.length)throw Error('Patch incompleto.');
      const kind=payload[cursor++];let bytes;
      if(kind===0){const offset=read32(),length=read32();if(offset+length>original.length)throw Error('Cópia fora dos limites.');bytes=original.subarray(offset,offset+length);}
      else if(kind===1){const length=read32();if(cursor+length>payload.length)throw Error('Patch incompleto.');bytes=payload.subarray(cursor,cursor+length);cursor+=length;}
      else throw Error('Operação desconhecida no patch.');
      if(written+bytes.length>output.length)throw Error('Saída do patch fora dos limites.');
      output.set(bytes,written);written+=bytes.length;
    }
    if(written!==output.length||cursor!==payload.length||!equal(await digest(output),payload.subarray(36,68)))throw Error('Falha ao verificar a batalha modificada.');
    return output;
  }
  async function prepare(buffer){
    const status=document.getElementById('status');if(status)status.textContent='Preparando batalha direta…';
    const siteBase=root.BOSSROOM_SITE_BASE||new URL('./',location.href).href;
    const base=new URL('chapter'+root.BOSSROOM_CHAPTER+'/',siteBase).href;
    let payload;
    if(root.BOSSROOM_CHAPTER===5){
      const response=await fetch(base+'battle.patch.json?rev=5',{cache:'no-store'});
      if(!response.ok)throw Error('Falha ao preparar áudio da batalha.');
      const manifest=await response.json();
      const buffers=await Promise.all(manifest.parts.map(async name=>{
        if(!/^battle\.patch\.gz\.part[0-9]+$/.test(name))throw Error('Parte inválida.');
        const r=await fetch(base+name+'?rev=5',{cache:'no-store'});
        if(!r.ok)throw Error('Falha ao baixar batalha.');return r.arrayBuffer();
      }));
      payload=new Uint8Array(await new Blob(buffers).arrayBuffer());
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',payload)),b=>b.toString(16).padStart(2,'0')).join('');
      if(hash!==manifest.compressed_sha256)throw Error('Partes da batalha corrompidas.');
    }else{
      const response=await fetch(base+'battle.patch.gz?rev=5',{cache:'no-store'});
      if(!response.ok)throw Error('Falha ao baixar batalha.');payload=new Uint8Array(await response.arrayBuffer());
    }
    if(payload[0]===31&&payload[1]===139){
      if(typeof DecompressionStream==='undefined')throw Error('Atualize o navegador para usar batalhas diretas.');
      payload=new Uint8Array(await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    }
    let output=await apply(buffer,payload);
    const manifestResponse=await fetch(new URL('party-native.json',siteBase),{cache:'no-store'});
    if(!manifestResponse.ok)throw Error('Não foi possível verificar o suporte co-op.');
    const party=await manifestResponse.json();
    if(party.chapters.includes(root.BOSSROOM_CHAPTER)){
      const response=await fetch(base+'coop.patch.gz',{cache:'no-store'});
      if(!response.ok)throw Error('Patch co-op indisponível.');
      const bytes=await response.arrayBuffer();
      const raw=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      output=await apply(output,raw);
    }
    if(status)status.textContent='Iniciando batalha…';return output;
  }
  root.BossRoomPatch={apply,prepare};
  if(typeof module!=='undefined')module.exports=root.BossRoomPatch;
})(globalThis);
