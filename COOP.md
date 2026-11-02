# Co-op de personagens (experimental)

Cada pessoa escolhe um ou mais personagens entre Kris, Susie e Ralsei. Os turnos de batalha desses personagens respondem aos controles do dono. Na defesa, cada jogador controla uma alma própria. Quando uma alma é atingida, o dano vai para um personagem vivo daquele jogador: o alvo do ataque é mantido se pertencer a ele; caso contrário, o jogo escolhe um dos personagens vivos que ele possui. Um golpe aplica dano a apenas um personagem.

O anfitrião executa uma simulação nativa do jogo. Até três jogadores (anfitrião, J2 e J3) podem participar; personagens sem dono conectado ficam com o anfitrião. As almas têm posição e invulnerabilidade independentes. A interface mostra o vídeo do anfitrião aos convidados, sem áudio. Os saves continuam sendo os do anfitrião.

## Como jogar

1. Ambos abrem a mesma versão do site em HTTPS ou localhost, em navegador compatível com WebRTC. Cada pessoa pode abrir o site em seu próprio dispositivo.
2. No anfitrião, abra **CO-OP**, selecione J2 ou J3 em **Convidar jogador** e clique em **CRIAR CONVITE**.
3. Envie o código ao amigo pelo canal que preferirem. O convidado cola em **Código recebido do amigo** e clica em **GERAR RESPOSTA**; devolva a resposta ao anfitrião, que cola e clica em **CONECTAR RESPOSTA**.
4. Cada jogador marca os personagens que quer controlar. A posse é exclusiva e pode incluir mais de um personagem para a mesma pessoa. O anfitrião inicia a batalha depois das escolhas.
5. Na defesa, cada pessoa move a sua alma. No teclado, as setas movem, Z confirma/ataca e X/C fazem as outras ações do jogo. O anfitrião pode usar os controles na tela.

É possível conectar convidados com uma batalha aberta, mas as escolhas de personagens ficam bloqueadas enquanto há almas na tela. Ao desconectar, os personagens daquele convidado retornam ao anfitrião e a alma dele desaparece. Recarregar, voltar ao menu ou trocar de chefe encerra a sessão.

## Rede e limites

- A conexão usa WebRTC com STUN público, sem servidor de salas nem TURN. Algumas redes, firewalls ou NATs impedem a conexão. Convites e respostas contêm dados de conexão e devem ser enviados só aos participantes.
- A conexão não usa áudio. O anfitrião é a autoridade para combate e saves; não há migração do anfitrião ou reconexão automática.
- A implementação nativa foi compilada e exercitada nos capítulos 1–3. Capítulos 4 e 5 ainda não estão habilitados para co-op. Capítulos suportados precisam baixar tanto o patch normal da batalha quanto o `coop.patch.gz` adicional.
- O teste nativo automatizado verifica menu, atribuição de turnos, duas almas, movimento, invulnerabilidade e colisões/dano reais em um cenário de QA no capítulo 1. Não comprova vitória de chefe nem cobertura de todos os padrões de ataque dos capítulos 1–3.
- Modificações do jogo que retiram ou alteram membros do grupo podem limitar escolhas disponíveis em encontros específicos. O modo continua experimental; não foi validado em sessões longas, redes externas, navegadores além do Chrome nem aparelhos móveis físicos.

## Validação

Requer Node.js 20+, Python 3, Chrome e as dependências do projeto (`npm ci`).

```sh
python check.py
npm test
npm run test:browser
```

O teste do navegador abre três contextos Chrome isolados, usa WebRTC real e verifica lobby, propriedade exclusiva, entradas independentes, vídeo, perda de foco, reconexão, validade dos pacotes e layout móvel. O teste nativo requer uma ferramenta de modificação GameMaker compatível, os arquivos do runtime fixados pelo projeto e a criação local de um patch QA. Esse patch inclui ganchos exclusivos de teste e não é distribuído.

```powershell
$env:BOSSROOM_COOP_ROOT=(Get-Location).Path
$env:BOSSROOM_COOP_QA='1'
.\local\tools\utmt\UndertaleModCli.exe load local\chapter1\baseline.unx -s scripts\apply-party-coop.csx -o local\chapter1\qa.unx -f
python scripts\package_native_patch.py local\chapter1\baseline.unx local\chapter1\qa.unx local\chapter1\qa.patch.gz
$env:PARTY_QA_PATCH=(Resolve-Path local\chapter1\qa.patch.gz).Path
npm run test:native
```

O patch de QA não deve ser incluído em publicação ou usado numa batalha normal. A compilação usa uma versão do runtime fixada no histórico do projeto; consulte `MODDING.md` para a origem e os hashes. A adaptação segue as práticas do [AGENTS.md do Co-op Anything](https://github.com/cranebeaker/coop-anything/blob/main/AGENTS.md), [autoridade da simulação](https://github.com/cranebeaker/coop-anything/blob/main/playbook/how-coop-mods-work.md) e [QA automatizado](https://github.com/cranebeaker/coop-anything/blob/main/playbook/automated-qa.md). Nenhum `AGENTS.md` foi encontrado no repositório de destino.
