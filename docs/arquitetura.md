# Arquitetura da integração

## Componentes

- **ChatGPT**: interface de conversa e planejamento das alterações.
- **GitHub**: fonte de verdade, histórico e revisão do código.
- **Google Apps Script**: execução de automações Google.
- **clasp**: sincronização local entre arquivos versionados e Apps Script.
- **GitHub Actions**: publicação automatizada após configurar os segredos.

## Fluxo de desenvolvimento

1. Alterar arquivos em `apps-script/`.
2. Revisar e testar localmente.
3. Enviar alterações com Git para a branch `main`.
4. O workflow publica no Apps Script se os secrets estiverem configurados.

`clasp push` envia código para Apps Script; `git push` envia commits ao GitHub. São operações diferentes.

## Integração do GPT

O Apps Script implementa um conjunto restrito de operações em `Api.gs`. Para disponibilizar essas operações como GPT Action, crie um gateway (recomendado: Cloud Run) que:

- autentique a chamada por cabeçalho Authorization;
- guarde o segredo fora do esquema OpenAPI;
- valide cada ação e seus argumentos;
- encaminhe somente operações permitidas;
- registre erros sem gravar tokens ou dados pessoais.

Não exponha uma função genérica `eval`, `runCode` ou equivalente.


## Universo IF Avalia — fluxo de votação

O módulo \`apps-script/Voting.gs\` recebe votos no servidor via HTML Service
(\`google.script.run\`). O site Vite estático não recebe segredos e não deve chamar o
Apps Script com um token embutido no bundle. Um gateway público só poderá ser adotado
após revisão de autenticação, CORS, rate limit e autorização.

O voto é serializado por \`LockService.getScriptLock()\`. A unicidade é
\`(SHA-256(codigo), id_projeto)\`; o código original nunca é persistido. A chave
\`idRequisicao\` garante idempotência e o recibo só é retornado depois de gravar e
executar \`SpreadsheetApp.flush()\`. O servidor recalcula a nota com pesos 30/30/25/15.
Ranking agrega somente notas e só exibe projetos com pelo menos cinco votos.

A ativação depende de \`VOTING_ENABLED=true\`, configuração privada da planilha,
testes concorrentes e autorização expressa. A implementação deste módulo não equivale
a implantação ou homologação.
