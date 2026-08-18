import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png" };

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
  if (!path) path = "index.html";
  let file = join(root, path);
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) file = join(root, "index.html");
  res.setHeader("Content-Type", types[extname(file)] || "application/octet-stream");
  res.setHeader("Cache-Control", "no-store");
  createReadStream(file).pipe(res);
});
server.listen(port, "127.0.0.1", () => console.log(`Static server: http://127.0.0.1:${port}`));
