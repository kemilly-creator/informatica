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
