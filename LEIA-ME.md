# DELTARUNE · Boss Room — código do projeto

Exportação da versão 7 publicada no ChatGPT Sites.
Commit: d16af78c14fb3d8c3ebdee73a344a907140fb711

## Rodar no computador

1. Extraia o ZIP e abra esta pasta no VS Code.
2. Instale Python 3, caso ainda não tenha.
3. No terminal desta pasta, execute:

   python -m http.server 8000 --directory dist

   No Windows, também pode usar:

   py -m http.server 8000 --directory dist

4. Abra http://localhost:8000 no navegador.
5. Use um navegador com WebGL e aceleração gráfica ativados.

Não abra index.html com duplo clique: o jogo usa fetch e precisa de um servidor HTTP. Não há npm install ou etapa de build para editar a interface.

## Onde editar

- dist/index.html: página, controles e carregamento dos capítulos.
- dist/selector.js e dist/selector.css: seleção dos chefes e visual do menu.
- dist/presets.json: checkpoints e configurações dos encontros.
- dist/game-input.js: envio de comandos e ativação do áudio.
- dist/game-layout.js: proporções e adaptação da tela.
- dist/native-battle.js: aplicação dos patches do jogo.
- dist/chapter1 até chapter5: carregadores, runtimes e patches compilados.
- mods/: eventos GameMaker modificados, em GML.
- scripts/: ferramentas para compilar/preparar patches e verificar alterações.
- MODDING.md: documentação técnica das modificações e verificações.

## Dependências e limites

O site depende de internet: parte dos arquivos originais dos capítulos, músicas e bibliotecas é carregada dos endereços configurados no projeto. Este ZIP contém o código do site e suas modificações; não é um pacote offline dos jogos nem o projeto GameMaker original completo. Os recursos originais estão fixados no repositório https://github.com/ByAlvaro19/deltarune, commit 125c727d07732276d3c6677227ddfa07d5221c72.

Os patches binários já estão prontos. Para alterar a lógica nativa além dos arquivos da interface, consulte MODDING.md e use UndertaleModTool CLI 0.9.2.0 com os recursos originais.

A versão exportada inclui as mudanças da música do Flowery e da arena de King/Jevil. Os arquivos e a ativação do áudio foram verificados separadamente; as lutas completas não foram validadas no navegador de teste, por falta de WebGL.

## Hospedar em outro lugar

Publique o conteúdo de dist na raiz de uma hospedagem estática. O arquivo .openai/hosting.json registra a identidade do site atual no ChatGPT Sites; ele não é necessário para rodar localmente ou hospedar em outro provedor.

Projeto de fã não oficial. DELTARUNE e seus personagens: Toby Fox. Consulte os avisos e licenças dos recursos originais antes de redistribuí-los.
