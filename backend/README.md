# Backend — Google Apps Script

A implementação de votação será isolada aqui, sem misturar operações genéricas da integração existente em `apps-script/`.

## Contrato planejado
- Consultar catálogo público e ranking agregado.
- Validar código, estado da votação, projeto e notas no servidor.
- Recalcular a média ponderada no servidor.
- Garantir unicidade por `(hash_codigo, id_projeto)` com `LockService`.
- Garantir idempotência por `id_requisicao`.
- Retornar recibo somente após gravação confirmada.

## Segurança
Não expor abas privadas `Codigos` e `Avaliacoes`; não guardar token em texto puro; não aceitar execução arbitrária; não publicar segredos no frontend ou no repositório.

O backend de votação ainda não está implementado. A integração genérica em `apps-script/` foi preservada e não deve ser usada para gravar avaliações.