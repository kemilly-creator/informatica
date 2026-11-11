/**
 * Entry points for the Informática integration.
 * Deploy as a Web App only after configuring API_TOKEN and SPREADSHEET_ID.
 */
function doGet() {
  return json_({ ok: true, service: "informatica-apps-script", version: "1.0.0" });
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};
    const expected = PropertiesService.getScriptProperties().getProperty("API_TOKEN");
    if (!expected || !body.token || !constantTimeEquals_(String(body.token), expected)) {
      return json_({ ok: false, error: "unauthorized" });
    }
    const result = Api.dispatch(body.action, body.args || {});
    return json_({ ok: true, result: result });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: "request_failed", message: String(err.message || err) });
  }
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function constantTimeEquals_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Run manually once to confirm the project is executable. */
function testarIntegracao() {
  return { ok: true, timestamp: new Date().toISOString() };
}
