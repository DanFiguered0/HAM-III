# SIMULADO N2 — HAM III

Site estático com **250 questões** (125 de Medicina do Adulto e 125 de Pediatria), cinco alternativas por questão, comentários e acompanhamento de tentativas.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie `index.html`, `style.css`, `script.js` e `questions.js` para a **raiz** do repositório, junto com este README.
3. Acesse **Settings → Pages → Build and deployment**, escolha **Deploy from a branch**, branch `main`, pasta `/(root)`.
4. Abra o endereço informado pelo GitHub Pages após a publicação.

Não é necessário instalar dependências ou executar um servidor. Os dados são guardados no `localStorage` do navegador, vinculados ao endereço do site; exporte o progresso em JSON antes de limpar os dados do navegador ou trocar de dispositivo.

## Modos e progresso

- **Estudo:** revela comentários imediatamente após a resposta, que fica bloqueada.
- **Prova:** não revela gabaritos, acertos, erros ou percentuais até a finalização. Finalizar bloqueia inclusive questões não respondidas.
- **Refazer erros:** após finalizar a tentativa original, inicia uma tentativa separada apenas com questões erradas, sem alterar a pontuação anterior.
- **Backup:** exportação e importação de JSON com validação. A importação substitui o progresso somente após confirmação.
- **Atualizações:** identificadores das questões são estáveis. Se o enunciado, alternativas ou gabarito forem alterados, a resposta antiga dessa questão é invalidada de modo controlado. Nesta atualização, as questões 36, 44, 47, 72, 88 e 89 foram reformuladas.

## Revisão e ressalvas

Foram verificados automaticamente os 250 registros, 1.250 justificativas preenchidas, as quantidades por tema e dificuldade, a sintaxe JavaScript e as funções principais com testes de navegador em ambiente isolado. O ambiente de testes bloqueou acesso direto a arquivos locais e ao endereço `localhost`; os testes de interação foram executados por injeção dos scripts e simulação de armazenamento, não em uma publicação real no GitHub Pages.

**A revisão acadêmica individual independente das 250 questões e a conferência documental integral de cada referência ainda requerem revisão humana especializada.** O banco é um recurso de estudo, não uma prova oficial da Afya nem substitui as diretrizes clínicas.
