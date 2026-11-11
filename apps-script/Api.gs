/**
 * Deliberately small allowlist. Do not add arbitrary eval/code execution here.
 * Configure SPREADSHEET_ID in Apps Script > Project Settings > Script properties.
 */
const Api = (() => {
  const handlers = {
    ping: () => ({ pong: true, timestamp: new Date().toISOString() }),
    getScriptInfo: () => ({
      scriptId: ScriptApp.getScriptId(),
      timeZone: Session.getScriptTimeZone()
    }),
    listSheets: () => {
      const ss = openConfiguredSpreadsheet_();
      return ss.getSheets().map(s => ({ name: s.getName(), sheetId: s.getSheetId() }));
    },
    readRange: args => {
      const range = validateRange_(args.range);
      const sheet = getSheet_(args.sheet);
      return sheet.getRange(range).getDisplayValues();
    },
    appendRow: args => {
      if (!Array.isArray(args.values) || args.values.length === 0 || args.values.length > 50) {
        throw new Error("args.values deve ser uma lista de 1 a 50 valores.");
      }
      const sheet = getSheet_(args.sheet);
      sheet.appendRow(args.values.map(v => String(v).slice(0, 5000)));
      return { appended: true, row: sheet.getLastRow() };
    }
  };

  function dispatch(action, args) {
    if (!Object.prototype.hasOwnProperty.call(handlers, action)) {
      throw new Error("Ação não permitida: " + String(action));
    }
    return handlers[action](args);
  }
  return { dispatch };
})();

function openConfiguredSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Configure a propriedade SPREADSHEET_ID.");
  return SpreadsheetApp.openById(id);
}
function getSheet_(name) {
  if (!name || typeof name !== "string" || name.length > 100) throw new Error("Informe args.sheet.");
  const sheet = openConfiguredSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error("A aba não foi encontrada.");
  return sheet;
}
function validateRange_(range) {
  if (typeof range !== "string" || range.length > 100 ||
      !/^[A-Z]{1,3}[1-9][0-9]*(:[A-Z]{1,3}[1-9][0-9]*)?$/.test(range)) {
    throw new Error("Intervalo inválido. Exemplo: A1:D20.");
  }
  return range;
}
