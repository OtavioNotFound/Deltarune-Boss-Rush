# Co-op de personagens (experimental)

Cada pessoa pode escolher Kris, Susie, Ralsei ou mais de um. O dono controla os turnos dos seus personagens e, na defesa, controla uma alma própria. Quando a alma é atingida, o dano vai para um personagem vivo daquele jogador. Preserva o alvo do ataque se ele pertencer ao jogador; se estiver caído ou pertencer a outra pessoa, redireciona para um personagem vivo que ele possui. Cada golpe machuca apenas um personagem.

O anfitrião executa a simulação e mantém os saves. Até três jogadores podem participar. Os convidados recebem vídeo sem áudio. Personagens sem dono conectado ficam com o anfitrião.

## Entrar numa sala

1. Todos abrem o jogo em HTTPS ou localhost, em um navegador com WebRTC.
2. O anfitrião abre **CO-OP** e clica em **CRIAR SALA**. Ele envia o código de 6 dígitos aos amigos.
3. Cada amigo abre **CO-OP**, digita esse código e clica em **ENTRAR NA SALA**.
4. Cada jogador escolhe seus personagens. O anfitrião inicia a batalha.

J2 e J3 são atribuídos automaticamente pela ordem de entrada. Cada jogador pode ter vários personagens, mas cada personagem só pode pertencer a um jogador. As escolhas ficam travadas durante a defesa. Se alguém desconectar, os personagens dele voltam para o anfitrião e ele pode entrar novamente com o mesmo código enquanto a sala estiver aberta. O anfitrião encerra a sala pelo botão **ENCERRAR CO-OP**; trocar de chefe ou recarregar também encerra.

## P2P e rede

- O código curto é o endereço temporário da sala no PeerJS Cloud, usado para sinalização inicial. O projeto inclui o cliente PeerJS 1.5.5. Controles e vídeo usam WebRTC; normalmente seguem direto entre os navegadores, mas o PeerJS também configura TURN público como alternativa quando a rede não permite conexão direta. O serviço é compartilhado e pode ficar indisponível. O [FAQ do PeerJS](https://peerjs.com/client/faq) explica essa divisão.
- O código de 6 dígitos funciona como convite, não como autenticação forte. Compartilhe apenas com amigos e use a sala logo após criá-la. O código para de funcionar quando o anfitrião encerra a sala. Em caso raro de código já ocupado, o jogo tenta gerar outro.
- Não há TURN próprio. O PeerJS usa TURN público, que pode retransmitir mídia quando a conexão direta falha; desempenho e disponibilidade podem variar. O áudio do jogo permanece no anfitrião.
- Não há servidor de jogo, autoridade central, migração de anfitrião ou reconexão automática. O anfitrião é a autoridade do combate. A sinalização usa o PeerJS Cloud; o jogo e vídeo normalmente seguem direto, mas podem passar pelo relay TURN público.
- A implementação nativa está habilitada nos capítulos 1–3; os capítulos 4–5 continuam solo. O combate nativo foi testado apenas no capítulo 1 por meio de uma arena QA controlada. Os patches dos capítulos 2–3 compilam, mas ainda não foram exercitados em combate.
- Não foi validada vitória de chefe, cobertura integral dos ataques, rede externa em vários provedores, sessões longas ou dispositivos móveis físicos. Encontros que removem membros do grupo podem limitar quais personagens estão disponíveis.

## Validação

Requer Node.js 20+, Python 3, Chrome e dependências (`npm ci`). O teste de navegador usa o PeerJS Cloud e conexões WebRTC reais; depende da disponibilidade desse serviço externo.

```sh
python check.py
npm test
npm run test:browser
```

O teste de navegador abre três contextos Chrome isolados e verifica códigos de sala, propriedade de personagens, entradas independentes, vídeo, perda de foco, reconexão e layout móvel. O teste nativo requer UndertaleModTool, arquivos do runtime fixados pelo projeto e uma compilação de QA local com ganchos de teste, que não deve ser distribuída. Consulte `MODDING.md` para a compilação.

O co-op segue as práticas do [AGENTS.md do Co-op Anything](https://github.com/cranebeaker/coop-anything/blob/main/AGENTS.md), [autoridade da simulação](https://github.com/cranebeaker/coop-anything/blob/main/playbook/how-coop-mods-work.md) e [QA automatizado](https://github.com/cranebeaker/coop-anything/blob/main/playbook/automated-qa.md). Não há `AGENTS.md` no repositório do jogo.
