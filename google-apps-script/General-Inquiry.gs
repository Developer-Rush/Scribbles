/**
 * Scribbles Uniforms — GENERAL INQUIRY form backend.
 *
 * Handles the "Name, Email, Phone, Message" form used on Home, About
 * Us, R&D and Contact Us. Saves each submission as a row in one
 * Google Sheet and emails the site owner a copy.
 *
 * This is a SEPARATE, STANDALONE Apps Script project from the Careers
 * one (Careers.gs) — deploy each on its own with its own Web App URL.
 *
 * ---------------------------------------------------------------
 * SETUP
 * ---------------------------------------------------------------
 * 1. Create a Google Sheet for general inquiries. Copy its ID out of
 *    its URL: https://docs.google.com/spreadsheets/d/<THIS_PART>/edit
 *
 * 2. Go to https://script.google.com -> New project (a fresh,
 *    separate project — not the same one as Careers.gs).
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
 * 5. Paste that URL into APPS_SCRIPT_GENERAL_URL near the top of
 *    js/main.js.
 * ---------------------------------------------------------------
 */

var SHEET_ID = "PASTE_GENERAL_INQUIRIES_SPREADSHEET_ID_HERE";
var OWNER_EMAIL = "owner@example.com";
var SHEET_NAME = "Inquiries";

function doPost(e) {
  try {
    var params = (e && e.parameter) || {};

    var sheet = getSheet(SHEET_ID, SHEET_NAME,
      ["Timestamp", "Page", "Name", "Email", "Phone", "Message"]);

    sheet.appendRow([
      new Date(),
      params.Page || "",
      params.Name || "",
      params.Email || "",
      params.Phone || "",
      params.Message || ""
    ]);

    var subject = "New website inquiry — " + (params.Page || "Website") +
      " (" + (params.Name || "no name") + ")";
    var body =
      "A new inquiry was submitted on the Scribbles Uniforms website.\n\n" +
      "Page: " + (params.Page || "-") + "\n" +
      "Name: " + (params.Name || "-") + "\n" +
      "Email: " + (params.Email || "-") + "\n" +
      "Phone: " + (params.Phone || "-") + "\n" +
      "Message: " + (params.Message || "-") + "\n";

    MailApp.sendEmail(OWNER_EMAIL, subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* One-off manual test: select "testEmail" in the function dropdown
   next to Run, then click Run. If Gmail permission was never granted
   (or was revoked), this is what will trigger the authorization
   popup — approve "Send email as you" when asked. Check the
   Executions log afterwards, or your inbox/spam folder directly. */
function testEmail() {
  MailApp.sendEmail(OWNER_EMAIL, "Test email from Apps Script", "If you got this, MailApp is working correctly.");
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
