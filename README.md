# Informática

Repositório para estudos e projetos da área de Informática, incluindo integração com Google Apps Script.

## Estrutura

- `apps-script/`: código executado pelo Google Apps Script.
- `docs/`: arquitetura, segurança e especificação de integração.
- `.github/workflows/`: automação de publicação.

## Começar

Consulte [o guia de configuração](apps-script/README.md) e [a arquitetura](docs/arquitetura.md).

### Requisitos

- Node.js e npm
- Google Apps Script
- API Apps Script ativada
- `@google/clasp`

### Comandos

```bash
npm install
npm install -g @google/clasp
clasp login
```

Associe o diretório `apps-script` a um projeto Apps Script usando `clasp create` ou importe um projeto existente com `clasp clone`. Depois:

```bash
clasp push --rootDir apps-script
```

Para publicação automática, configure os secrets `CLASPRC_JSON` e `SCRIPT_ID` em Settings > Secrets and variables > Actions.

**Segurança:** nunca envie `.clasp.json`, `.clasprc.json`, tokens ou arquivos `.env` ao Git. A API oferece somente operações explicitamente permitidas e não executa código arbitrário.
