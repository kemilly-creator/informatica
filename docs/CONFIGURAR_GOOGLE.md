# Configuração do Google Apps Script e Google Sheets

Este guia prepara a configuração manual. Nenhuma planilha ou implantação foi criada por esta alteração.

## 1. Planilha privada
Crie uma planilha da equipe com abas:
- `Projetos`: catálogo público, idêntico ao JSON versionado.
- `Codigos`: hash dos códigos de autorização e estado de habilitação.
- `Avaliacoes`: id_requisicao, hash_codigo, id_projeto, quatro notas, nota ponderada, timestamp e estado.
- `Configuracao`: estado/período da votação, mínimo do ranking e versão do catálogo.

Mantenha a planilha privada. Não armazene nomes, emails, IPs ou MACs. Nunca publique códigos válidos, tokens ou logs sensíveis.

## 2. Apps Script
1. Acesse https://script.google.com/ e crie um projeto da equipe.
2. Configure as propriedades de script, como `SPREADSHEET_ID`; segredos nunca entram no Git.
3. Valide no servidor estado, código, projeto e notas.
4. Use `LockService.getScriptLock()` para verificar e gravar o par `(hash_codigo, id_projeto)` atomicamente.
5. Use `id_requisicao` para idempotência e só confirme após recibo confiável.

## 3. Publicação e CORS
Não publicar acesso anônimo nesta etapa. A implantação como Web App depende de autorização do grupo e da política institucional. Apps Script ContentService não garante CORS convencional; não usar `mode: no-cors` como confirmação. Se Pages ↔ Apps Script não der recibo verificável, considerar HTML Service + `google.script.run` para telas dinâmicas. Não habilitar `XFrameOptionsMode.ALLOWALL` sem mitigação de clickjacking.