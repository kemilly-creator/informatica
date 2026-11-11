# Apps Script

Código-fonte sincronizado com este repositório usando `clasp`.

## Configuração inicial

1. Crie ou escolha um projeto em https://script.google.com/.
2. Ative a API Apps Script: https://script.google.com/home/usersettings.
3. Instale Node.js e execute `npm install -g @google/clasp`.
4. Execute `clasp login`.
5. Na pasta `apps-script`, execute `clasp clone SEU_SCRIPT_ID` **somente se for importar um projeto existente**. Para associar este código a um projeto vazio, use `clasp create --type standalone --title "Informatica"` e mantenha o arquivo `.clasp.json` local.
6. Execute `clasp push` para enviar os arquivos ao Apps Script.

## Propriedades do script

Em Apps Script > Configurações do projeto > Propriedades do script, configure:

- `API_TOKEN`: segredo aleatório longo (não coloque no Git).
- `SPREADSHEET_ID`: ID da planilha que a API poderá acessar.

A API só oferece ações explícitas: `ping`, `getScriptInfo`, `listSheets`, `readRange` e `appendRow`. Não existe execução de código arbitrário.

## Publicação

Em Implantar > Nova implantação > Aplicativo da Web, escolha a identidade de execução e o público com muito cuidado. Para dados pessoais, restrinja o acesso à sua conta/organização. Não publique uma API que execute como proprietária para qualquer pessoa sem uma camada de autenticação e autorização adequada.

O token no corpo da requisição é apenas uma proteção básica para testes controlados. Para conectar um GPT Action, use um gateway autenticado (por exemplo, Cloud Run) que valide o cabeçalho de autorização e encaminhe apenas as operações permitidas. Não compartilhe o token do Apps Script no prompt, no esquema público ou no repositório.
