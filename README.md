# Universo IF Avalia v1.0
Protótipo acadêmico de participação popular educativa para o Universo IF 2026.2. **Não representa votação ou julgamento oficial do evento**, salvo autorização expressa dos organizadores.

## Stack
- React + Vite + TypeScript (interface).
- Google Apps Script + Google Sheets (avaliações e dados).
- GitHub Actions (testes e build).
- GitHub Pages (destino futuro, após aprovação e homologação).

## Estrutura
```text
.github/workflows/   CI e automações
apps-script/         integração Google existente, preservada
backend/             contrato e futura implementação de votação
docs/                arquitetura, backlog, auditoria, Google e QA
scripts/             validação do catálogo
src/data/            catálogo JSON versionado
src/                 interface, domínio e testes
```

## Começar
Requer Node.js 22 ou superior.
```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

## Catálogo
Copie o arquivo original `universo_if_catalogo_46_projetos_v1.0.json` do kit para `src/data/` e execute `node scripts/validar-catalogo.mjs`.
Esperado: 46 projetos únicos — 24 Mostra Nacional e 22 Mostra de Extensão. Não invente dados ausentes. A auditoria registra a inspeção do arquivo no kit, mas ele ainda precisa ser adicionado ao repositório.

## Regras
Critérios: Criatividade e inovação (30%), Clareza (30%), Relevância e impacto (25%), Demonstração e resultados (15%). Notas inteiras de 1 a 5; [4,5,4,3] = 4,15. O mesmo código pode avaliar projetos diferentes, mas apenas uma vez cada projeto; a unicidade será aplicada no servidor. Ranking separado por modalidade, com mínimo de cinco avaliações.

## Segurança
A planilha deve permanecer privada. Nunca versionar tokens, códigos válidos, `.clasp.json`, `.clasprc.json` ou `.env`. A CI desta branch valida tipos, testes e build; não publica site nem implanta Apps Script. Publicação Pages, acesso anônimo do Apps Script e votos de homologação exigem aprovação.
Consulte `docs/BACKLOG.md`, `docs/AUDITORIA_CATALOGO.md`, `docs/CONFIGURAR_GOOGLE.md` e `docs/TESTES_E_QA.md`.