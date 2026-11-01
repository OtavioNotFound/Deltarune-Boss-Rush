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

Modo de batalha experimental: as batalhas ainda precisam de validação completa no navegador. Créditos do port e checkpoints em `dist/README.txt`.
