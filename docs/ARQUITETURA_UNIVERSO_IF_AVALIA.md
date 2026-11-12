# Arquitetura — Universo IF Avalia

## Componentes
- **Frontend:** React, Vite e TypeScript; catálogo e navegação estática no GitHub Pages.
- **Domínio:** funções puras TypeScript para cálculo, validação e busca.
- **Backend:** Google Apps Script com operações explicitamente permitidas.
- **Persistência:** Google Sheets privado; API pública entrega apenas agregados.
- **CI:** GitHub Actions executa instalação, checagem de tipos, testes e build.

## Fluxo de avaliação
1. Visitante seleciona projeto e informa o código de votação.
2. Servidor valida estado da votação, código, projeto e quatro notas inteiras.
3. Servidor recalcula a média ponderada.
4. Sob LockService, verifica idempotência e unicidade do par hash do código/projeto.
5. Grava a avaliação e devolve recibo verificável.
6. Ranking consulta somente agregados, separado por modalidade.

## Limites técnicos
GitHub Pages é hospedagem estática, não backend. Não expor códigos nem linhas individuais de avaliação. Apps Script ContentService não garante CORS/recibo automaticamente; testar o fluxo no navegador real. Se necessário, usar HTML Service + google.script.run para as telas dinâmicas.

## Integração preexistente
A pasta apps-script contém uma integração genérica anterior e foi mantida intacta nesta etapa. Ela não deve ser usada para gravar votos até ser substituída por endpoints específicos e auditados.
