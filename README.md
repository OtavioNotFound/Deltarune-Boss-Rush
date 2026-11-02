# Deltarune Boss Rush

Site de seleção e acesso direto a 11 batalhas de DELTARUNE, criado no ChatGPT Sites.

## Executar localmente

Requer Python 3. Na pasta do projeto, execute:

```sh
python3 -m http.server 8000 --directory dist
```

Abra http://localhost:8000 em um navegador com WebGL habilitado.

## Arquivos

- `dist/`: site completo, imagens e runtimes das batalhas.
- `mods/`: modificações de GameMaker.
- `MODDING.md`: documentação das modificações.
- `check.py`: validação de JavaScript, checkpoints e arquivos necessários. Execute `python3 check.py` (requer Node.js).

O conteúdo a publicar em uma hospedagem estática fica em `dist/`.

Para GitHub Pages configurado como `main` + raiz, `index.html` encaminha para o site em `dist/`. Essa entrada estará disponível depois que a PR for integrada à `main`.

## Co-op experimental

O botão **CO-OP** permite até três jogadores escolherem Kris, Susie e Ralsei, inclusive mais de um personagem por jogador. Para jogar junto, o anfitrião cria uma sala e envia um código de seis dígitos; os amigos digitam o código para entrar. Na defesa, cada pessoa controla sua própria alma. A conexão do jogo usa WebRTC P2P e ainda é experimental. Instruções e limitações em [COOP.md](COOP.md).

O co-op nativo está habilitado nos capítulos 1–3; os capítulos 4–5 continuam no modo solo. As batalhas ainda precisam de validação completa. Créditos do port e checkpoints em `dist/README.txt`.
