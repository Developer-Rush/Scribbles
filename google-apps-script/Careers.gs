/**
 * Scribbles Uniforms — CAREERS application form backend.
 *
 * Handles the careers page's application form (First Name, Last Name,
 * Email, Phone Number, CV link). Saves each submission as a row in
 * its own Google Sheet and emails the site owner a copy.
 *
 * This is a SEPARATE, STANDALONE Apps Script project from the General
 * Inquiry one (General-Inquiry.gs) — deploy each on its own with its
 * own Web App URL.
 *
 * ---------------------------------------------------------------
 * SETUP
 * ---------------------------------------------------------------
 * 1. Create a Google Sheet for career applications. Copy its ID out
 *    of its URL: https://docs.google.com/spreadsheets/d/<THIS_PART>/edit
 *
 * 2. Go to https://script.google.com -> New project (a fresh,
 *    separate project — not the same one as General-Inquiry.gs).
 *    Delete the placeholder code and paste this whole file in.
 *
 * 3. Fill in SHEET_ID and OWNER_EMAIL below.
 *
 * 4. Deploy -> New deployment -> gear icon -> "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Deploy, authorize the permission prompts (Sheets + Gmail), then
 *    copy the "Web app URL" it gives you.
 *
 * 5. Paste that URL into APPS_SCRIPT_CAREERS_URL near the top of
 *    js/main.js.
 * ---------------------------------------------------------------
 */

var SHEET_ID = "PASTE_CAREERS_SPREADSHEET_ID_HERE";
var OWNER_EMAIL = "owner@example.com";
var SHEET_NAME = "Applications";

function doPost(e) {
  try {
    var params = (e && e.parameter) || {};

    var sheet = getSheet(SHEET_ID, SHEET_NAME,
      ["Timestamp", "First Name", "Last Name", "Email", "Phone Number", "CV Link"]);

    sheet.appendRow([
      new Date(),
      params["First-Name"] || "",
      params["Last-Name"] || "",
      params.Email || "",
      params["Phone-Number"] || "",
      params["Upload-your-CV-Google-Drive-link"] || ""
    ]);

    var subject = "New career application — " +
      (params["First-Name"] || "") + " " + (params["Last-Name"] || "");
    var body =
      "A new career application was submitted on the Scribbles Uniforms website.\n\n" +
      "First Name: " + (params["First-Name"] || "-") + "\n" +
      "Last Name: " + (params["Last-Name"] || "-") + "\n" +
      "Email: " + (params.Email || "-") + "\n" +
      "Phone Number: " + (params["Phone-Number"] || "-") + "\n" +
      "CV Link: " + (params["Upload-your-CV-Google-Drive-link"] || "-") + "\n";

    MailApp.sendEmail(OWNER_EMAIL, subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheet(spreadsheetId, sheetName, headerRow) {
  var ss = SpreadsheetApp.openById(spreadsheetId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headerRow);
    sheet.getRange(1, 1, 1, headerRow.length).setFontWeight("bold");
  }
  return sheet;
}
