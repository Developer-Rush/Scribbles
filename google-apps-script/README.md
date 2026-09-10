# Form backend (Google Apps Script)

This folder has **two separate, standalone** Apps Script files, each
deployed as its own Web App with its own URL:

- **`General-Inquiry.gs`** — handles the "Name, Email, Phone, Message"
  form used on Home, About Us, R&D and Contact Us. Saves submissions
  to one Google Sheet and emails the owner.
- **`Careers.gs`** — handles the Careers application form (First
  Name, Last Name, Email, Phone, CV link). Saves submissions to a
  separate Google Sheet and emails the owner.

They don't share code or a deployment — set each one up independently
following the same steps, just with different files/sheets/URLs.

## Setup — repeat once for each script

### A) General Inquiry

1. Create a Google Sheet for general inquiries. Copy its ID from the
   URL: `https://docs.google.com/spreadsheets/d/<ID>/edit`

2. Go to [script.google.com](https://script.google.com) → **New
   project**. Delete the placeholder code and paste in all of
   `General-Inquiry.gs`.

3. Fill in `SHEET_ID` and `OWNER_EMAIL` at the top of the file.

4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy, approve the permission prompts (Sheets + Gmail), copy
     the **Web app URL**.

5. Paste that URL into `APPS_SCRIPT_GENERAL_URL` in `js/main.js`.

### B) Careers

1. Create a **different** Google Sheet for career applications. Copy
   its ID the same way.

2. Go to script.google.com → **New project** again (a second,
   separate project — don't reuse the General Inquiry one). Paste in
   all of `Careers.gs`.

3. Fill in `SHEET_ID` and `OWNER_EMAIL` at the top of the file.

4. **Deploy → New deployment → Web app** — same settings as above
   (Execute as Me, Anyone has access). Copy the Web app URL.

5. Paste that URL into `APPS_SCRIPT_CAREERS_URL` in `js/main.js`.

## Result

`js/main.js` ends up with two URLs filled in:

```js
var APPS_SCRIPT_GENERAL_URL = "...";
var APPS_SCRIPT_CAREERS_URL = "...";
```

`index.html`, `about.html`, `rd.html` and `contact.html`'s forms post
to the General Inquiry URL; `careers.html`'s form posts to the
Careers URL. No routing logic needed — each script only ever handles
its own kind of submission.

## Notes

- Re-run **Deploy → Manage deployments → edit → New version** any
  time you change either `.gs` file — editing the file alone doesn't
  update the live URL.
- The header row (column names) is created automatically the first
  time each sheet receives a submission.
- Free Gmail accounts can send ~100 emails/day via `MailApp`; a
  Google Workspace account gets ~1500/day.
- The browser can't read a real success/failure response back from
  Apps Script (`fetch(..., {mode: "no-cors"})` — Apps Script doesn't
  send CORS headers), so the site just shows its "thanks!" message
  once the request goes out without a network error.
