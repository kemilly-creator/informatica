# Dados do catálogo

O catálogo original foi incluído em `universo_if_catalogo_46_projetos_v1.0.json`. Ele contém 46 registros: 24 da Mostra Nacional e 22 da Mostra de Extensão.

Para validar localmente:

```bash
node scripts/validar-catalogo.mjs
```

O script verifica a contagem total, distribuição por modalidade, IDs únicos e presença dos campos obrigatórios. Preserve os títulos e acentos originais; não complete lacunas com autores, resumos, imagens ou descrições inventadas.
