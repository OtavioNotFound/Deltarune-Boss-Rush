# Co-op web: alma compartilhada (experimental)

Dois jogadores colaboram na **mesma batalha e no mesmo coração**. O anfitrião executa o jogo, mantém seus saves e transmite o canvas a 30 FPS. O convidado recebe vídeo e envia controles por WebRTC. Não existe uma segunda simulação para sincronizar, nem acesso remoto aos arquivos ou à área de trabalho.

Por padrão, o convidado usa as setas e o anfitrião usa Z, X e C. Isso também divide a navegação dos menus: um escolhe a direção e o outro confirma. O anfitrião pode inverter os papéis em CO-OP. Gamepads do runtime ficam desativados enquanto a sessão estiver conectada; use teclado ou controles virtuais.

## Como jogar

1. Ambos abrem a mesma versão do site em HTTPS, de preferência no Chrome. Para testar na mesma máquina, sirva `dist` em `localhost`. Não abra os arquivos diretamente.
2. O anfitrião inicia uma batalha, espera a imagem aparecer, abre **CO-OP**, escolhe o papel do convidado e clica em **CRIAR CONVITE**.
3. O anfitrião copia o código e o envia ao amigo pelo canal de sua preferência. O site não envia mensagens automaticamente.
4. O convidado, ainda no menu de chefes, abre **CO-OP**, cola o convite em **Código recebido do amigo** e clica em **GERAR RESPOSTA**. Copia seu código e o devolve.
5. O anfitrião cola a resposta e clica em **CONECTAR RESPOSTA**. Ambos aguardam **Conectado** e fecham o painel.
6. No celular, os controles virtuais usam os mesmos papéis. Para sair, abra CO-OP e clique em **ENCERRAR CO-OP**. Para reconectar, troque um novo convite e uma nova resposta.

O painel do anfitrião suspende a aplicação dos controles compartilhados enquanto estiver aberto; a batalha continua sendo simulada. Não há pausa automática. O convidado libera suas teclas ao abrir o painel ou perder foco. O anfitrião volta ao controle solo ao encerrar a sessão.

Recomeçar, voltar aos chefes, recarregar ou trocar de batalha encerra a sessão. O convidado não escreve checkpoints nem importa saves do anfitrião. Para trocar de chefe, encerrem a sessão e conectem novamente após carregar a nova batalha.

## Rede e limites

- Não há servidor de salas. Convite e resposta contêm SDP e candidatos ICE: compartilhe apenas com o amigo, pois podem revelar dados de conexão, incluindo endereços de rede. Os códigos ficam somente na página, sem armazenamento persistente.
- O navegador usa `stun:stun.l.google.com:19302` para descobrir conectividade. Mídia e controles usam a conexão WebRTC negociada. Este projeto não fornece TURN; certas combinações de NAT, firewall ou rede corporativa não vão conectar. Não há garantia de funcionamento pela internet em todas as redes.
- Vídeo sem áudio para o convidado. Som permanece no anfitrião. A latência da transmissão e da rede afeta esquivas e confirmações.
- Apenas dois jogadores; não há personagens, HP ou corações independentes, migração do anfitrião, reconexão automática ou suporte Steam. Isto é co-op com controle compartilhado, não a implementação nativa de dois corações.
- Instantâneos completos de teclas são enviados a cada 100 ms e nas mudanças de entrada. Pacotes inválidos, sequências antigas e teclas fora do papel são rejeitados. Após 1,5 s sem entrada válida, as teclas remotas são soltas; após 5 s sem resposta, a sessão é encerrada. Uma interrupção prolongada da aba também pode encerrar a conexão.
- A conexão segue a batalha do anfitrião. Não há promessa de vitória, balanceamento co-op ou compatibilidade validada com todos os encontros e dispositivos.

## Arquitetura e origem

`dist/coop-core.js` define propriedade e validade da entrada; `dist/coop.js` gerencia sessão, vídeo e interface; `dist/game-input.js` mantém a ponte do runner e filtra teclado e gamepad durante o co-op. Não foram modificados os arquivos WASM, patches binários ou assets de jogo.

O projeto foi inspecionado na revisão `94be043`. Os recursos nativos já usados pelo launcher são fixados em `ByAlvaro19/deltarune@125c727d07732276d3c6677227ddfa07d5221c72` conforme [MODDING.md](MODDING.md). SHA-256 de `dist/chapter1/runner.wasm`: `956fcd252073d68454238006d03c121becc9e850b4d40f0f9dd930ed9563fb9b`. Não há executável Windows ou instalação Steam envolvida nesta adaptação. A versão comercial exata correspondente ao port não foi determinada.

Segui as práticas de [AGENTS.md do Co-op Anything](https://github.com/cranebeaker/coop-anything/blob/main/AGENTS.md), [autoridade da simulação](https://github.com/cranebeaker/coop-anything/blob/main/playbook/how-coop-mods-work.md) e [QA automatizado](https://github.com/cranebeaker/coop-anything/blob/main/playbook/automated-qa.md). A [issue 122](https://github.com/cranebeaker/coop-anything/issues/122) descreve outra proposta para o jogo nativo com UDP/Steam; suas alegações não foram reproduzidas aqui e esse código não foi incorporado. Nenhum AGENTS.md adicional foi encontrado no repositório de destino.

## Validação reproduzível

Requer Node.js 20+, Python 3 e Chrome instalado. Instale as dependências de teste com `npm ci`. O site estático não precisa dessas dependências para funcionar.

```text
python check.py
npm test
npm run test:mutation
npm run test:browser
```

`test:browser` inicia seu próprio servidor local e dois contextos isolados do Chrome, sem usar o perfil ou os saves pessoais. Usa WebRTC real e um cenário de canvas instrumentado em `tests/fixtures/input-world.html`. O bot chama a mesma ponte usada pelos controles do produto. Verifica vídeo decodificado, divisão de papéis, teclado dentro do iframe, troca de papel, perda de foco, cancelamento de toque, atraso, ausência de pacotes, expiração, retorno solo, reconexão, saída do convidado e largura de 360 px. Isso não é um teste de combate nativo.

Para o smoke test com o runtime real do capítulo 1, defina `COOP_NATIVE=1` antes de executar `npm run test:browser`. Ele baixa os recursos fixados já usados pelo jogo, carrega Jevil e verifica que o convidado decodifica uma imagem nativa com múltiplas cores por WebRTC. `COOP_SCREENSHOT` pode indicar um arquivo PNG de evidência; ele não deve ser incluído no PR. `BOSSROOM_BROWSER_CHANNEL` permite selecionar outro canal instalado, como `msedge`.

Resultados desta implementação:

- Validador do projeto: passou, incluindo 11 checkpoints, arquivos de cinco capítulos e sintaxe de todos os novos scripts. Corrigida leitura UTF-8 para executá-lo no Windows.
- Entrada: quatro testes passaram, incluindo 2.000 iterações com perda, duplicação e reordenação simuladas. A mutação que remove o bloqueio de propriedade falhou no teste esperado.
- Dois contextos, WebRTC e cenário instrumentado: passaram nos cenários descritos acima.
- Runtime nativo: capítulo 1 iniciou e o convidado recebeu imagem da arena/menu de Jevil. Uma tentativa inicial revelou uma corrida na mensagem de conexão: a interface podia voltar a “Conectando” depois de conectar. A ordem foi corrigida e o teste agora força essa sequência de eventos. Isso não constitui comprovação de estabilidade em sessões longas.
- Não verificados: derrota completa de um chefe, combate de todos os capítulos, rede externa real, outros navegadores, aparelhos móveis físicos e sessões prolongadas. Não classificar esta adaptação como co-op nativo completo ou gameplay integralmente automatizado.
