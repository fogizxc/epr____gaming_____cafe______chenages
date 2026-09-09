/**
 * Gaming Cafe EPR - Google Sheets -> MongoDB API bridge
 *
 * Install:
 * 1. Put this file into Extensions -> Apps Script of the catalog spreadsheet.
 * 2. Set API_URL and WEBHOOK_SECRET in Script Properties.
 * 3. Run installTrigger() once and authorize it.
 *
 * Expected sheet columns (header names are case-insensitive):
 * id, title, name, slug, category, platform, description, shortDescription,
 * isVisible, status, coverPhoto, coverImage, coverUrl, image1..image5,
 * video, videoUrl, referenceVideo
 */

const CONFIG = {
  SHEET_NAME: 'Games',
  API_URL_PROPERTY: 'EPR_GAME_SYNC_URL',
  SECRET_PROPERTY: 'EPR_GAME_SYNC_SECRET',
  SPREADSHEET_ID_PROPERTY: 'EPR_SPREADSHEET_ID',
  BATCH_SIZE: 500,
  MAX_ROWS: 5000
};

function getConfig_() {
  const p = PropertiesService.getScriptProperties();
  const apiUrl = p.getProperty(CONFIG.API_URL_PROPERTY);
  const secret = p.getProperty(CONFIG.SECRET_PROPERTY);
  if (!apiUrl || !secret) throw new Error('Set EPR_GAME_SYNC_URL and EPR_GAME_SYNC_SECRET in Script Properties.');
  return { apiUrl: apiUrl, secret: secret, spreadsheetId: p.getProperty(CONFIG.SPREADSHEET_ID_PROPERTY) || SpreadsheetApp.getActive().getId() };
}

function normalizeHeader_(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

function rowsFromSheet_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error('Sheet not found: ' + CONFIG.SHEET_NAME);
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values[0].map(normalizeHeader_);
  return values.slice(1).map((row, index) => {
    const out = { sheetRow: index + 2 };
    headers.forEach((header, i) => { if (header) out[header] = row[i]; });
    return out;
  }).filter(row => row.title || row.name);
}

function syncGames() {
  const cfg = getConfig_();
  let rows = rowsFromSheet_();
  if (rows.length > CONFIG.MAX_ROWS) throw new Error('Maximum ' + CONFIG.MAX_ROWS + ' catalog rows supported per sync.');

  for (let offset = 0; offset < rows.length; offset += CONFIG.BATCH_SIZE) {
    const batch = rows.slice(offset, offset + CONFIG.BATCH_SIZE);
    const response = UrlFetchApp.fetch(cfg.apiUrl, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Google-Sheets-Secret': cfg.secret },
      payload: JSON.stringify({
        spreadsheetId: cfg.spreadsheetId,
        sheetName: CONFIG.SHEET_NAME,
        rows: batch
      }),
      muteHttpExceptions: true
    });
    const status = response.getResponseCode();
    const body = response.getContentText();
    if (status < 200 || status >= 300) throw new Error('EPR sync failed (' + status + '): ' + body.slice(0, 500));
  }
  PropertiesService.getScriptProperties().setProperty('EPR_LAST_SYNC_AT', new Date().toISOString());
  return { success: true, rows: rows.length, syncedAt: new Date().toISOString() };
}

function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'syncGames') ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger('syncGames').forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  ScriptApp.newTrigger('syncGames').timeBased().everyHours(1).create();
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Gaming Cafe EPR')
    .addItem('Sync games now', 'syncGames')
    .addItem('Install automatic sync', 'installTrigger')
    .addToUi();
}
