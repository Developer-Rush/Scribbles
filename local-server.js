/* Local test server that mimics the .htaccess rewrite rules:
   - Requests ending in .html get 301-redirected to the clean URL.
   - Clean URLs (no extension) serve the matching .html file.
   Run with:  node local-server.js
   Then open: http://localhost:8080/ */
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = 8080;

const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".json": "application/json"
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);

  // Redirect *.html requests to the clean URL (matches the .htaccess rule).
  if (/\.html$/i.test(urlPath)) {
    const clean = urlPath.replace(/\.html$/i, "") || "/";
    res.writeHead(301, { Location: clean });
    res.end();
    return;
  }

  let filePath;
  if (urlPath === "/") {
    filePath = path.join(root, "index.html");
  } else {
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    const asIs = path.join(root, safePath);
    const withHtml = asIs + ".html";
    if (fs.existsSync(withHtml) && fs.statSync(withHtml).isFile()) {
      filePath = withHtml;
    } else {
      filePath = asIs;
    }
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found: " + urlPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, () => {
  console.log("Local server running at http://localhost:" + port + "/");
});
