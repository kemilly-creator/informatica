# Auditoria do catálogo — v1.0

## Fonte e resultado
Arquivo-fonte: `universo_if_catalogo_46_projetos_v1.0.json`, fornecido em `UNIVERSO_IF_AVALIA_KIT_ALUNOS_v1.0.zip`. O JSON foi incluído no repositório em `src/data/universo_if_catalogo_46_projetos_v1.0.json`.

- Total: **46 projetos**.
- Mostra Nacional: **24** (NAC-001 a NAC-024).
- Mostra de Extensão: **22** (EXT-001 a EXT-022).
- IDs distintos: **46**; duplicados: **0**.
- Campos obrigatórios ausentes: **0** para id, titulo, modalidade, area_tematica, data, inicio, fim, formato, local e fontes.

## Validação reproduzível
O script `node scripts/validar-catalogo.mjs` confere contagem, modalidades, IDs e campos obrigatórios. A CI executa essa validação antes de checar tipos, testes e build.

## Limites da conferência
Os registros foram transcritos do JSON consolidado do kit. A revisão visual independente de todas as páginas dos PDFs e a revisão amostral por outra pessoa ainda não foram executadas nesta etapa. Portanto, não afirmar QA documental independente concluído.

## Preservação
Não inventar títulos, autores, resumos, campus, imagens, URLs ou descrições. Preservar acentos e grafia do catálogo. AGROSENTINELA e TRAÇO VIVO são registros distintos da Mostra Nacional, sem destaque ou peso adicional. Não acrescentar modalidades ou dias ausentes do catálogo.
