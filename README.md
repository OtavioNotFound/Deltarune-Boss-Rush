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

## Co-op experimental

O botão **CO-OP** permite compartilhar uma batalha com um amigo por WebRTC: um controla o movimento e o outro usa Z, X e C. O convidado recebe vídeo sem áudio; o anfitrião mantém o jogo e seus saves. Não há dois corações independentes. Conexão, testes e limitações de rede estão em [COOP.md](COOP.md).

Modo de batalha experimental: as batalhas ainda precisam de validação completa no navegador. Créditos do port e checkpoints em `dist/README.txt`.
