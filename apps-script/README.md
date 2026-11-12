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


## Universo IF Avalia — votação controlada

O módulo \`Voting.gs\` implementa a camada de domínio da votação. A interface deve chamar
\`submitEvaluation(payload)\` por \`google.script.run\` (HTML Service), não enviar o segredo
\`API_TOKEN\` ao navegador.

### Abas privadas esperadas

Execute manualmente \`configurarAbasVotacao()\` no editor do Apps Script. A função cria
as abas ausentes e cabeçalhos, sem limpar conteúdo preexistente:

- \`Projetos\`: \`id_projeto | titulo | modalidade\`
- \`Codigos\`: \`hash_codigo | status | validade\` — status deve ser \`ativo\`; validade pode ficar vazia.
- \`Avaliacoes\`: requisição, recibo, hash do código, projeto, quatro notas, nota ponderada e data.
- \`Configuracao\`: reservada para parâmetros operacionais.

Cadastre os 46 projetos na aba \`Projetos\`. Gere hashes dos códigos com
\`gerarHashCodigoVotacao(codigo)\` e grave somente o hash na aba \`Codigos\`.
Nunca guarde os códigos em texto puro. Proteja as quatro abas e limite o acesso aos
administradores responsáveis.

### Ativação e interface

A propriedade de script \`VOTING_ENABLED\` deve permanecer ausente ou \`false\` durante
desenvolvimento. Só defina \`true\` depois de revisão de segurança, preenchimento e
conferência das abas, teste de concorrência e homologação autorizada.

O payload de \`submitEvaluation\` contém \`codigo\`, \`idProjeto\`, \`notas\` (quatro inteiros
de 1 a 5) e \`idRequisicao\` (chave aleatória por tentativa). A função valida tudo no
servidor, usa LockService, armazena somente SHA-256 do código, impede repetição do mesmo
código no mesmo projeto e devolve recibo. Repetição da mesma chave de requisição retorna
o recibo original. Um código pode avaliar projetos diferentes.

O ranking devolve apenas agregados e omite projetos com menos de cinco avaliações.
A interface React estática ainda não está conectada a este módulo; use HTML Service ou
um gateway autenticado revisado antes de habilitar envio pelo site.

### Testes

Execute \`executarTestesDominioVotacao()\` no editor do Apps Script. Isso testa cálculo,
validação das notas e normalização sem tocar na planilha. Testes de concorrência,
integração com Sheets, recibo e leitura de retorno continuam pendentes de homologação.
