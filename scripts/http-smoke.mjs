import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    const relativePath = normalize(pathname).replace(/^([/\\])+/, "");
    const target = resolve(project, relativePath);
    if (!target.startsWith(project)) throw new Error("invalid path");
    const info = await stat(target);
    if (!info.isFile()) throw new Error("not file");
    const body = await readFile(target);
    res.statusCode = 200;
    res.setHeader("Content-Type", contentTypes[extname(target)] || "application/octet-stream");
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end("not found");
  }
});

await new Promise(resolvePromise => server.listen(0, "127.0.0.1", resolvePromise));
try {
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}`;
  const manifest = JSON.parse(await readFile(join(project, "build-manifest.json"), "utf8"));
  const paths = [
    "/",
    "/index.html",
    "/sw.js",
    "/version.json",
    manifest.entry,
    manifest.stylesheet,
    manifest.webmanifest,
    ...Object.values(manifest.icons),
    ...Object.values(manifest.modules)
  ].map(value => String(value).replace(/^\.\//, "/"));

  for (const path of new Set(paths)) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, `${path} should return 200`);
    const body = await response.arrayBuffer();
    assert.ok(body.byteLength > 0, `${path} should not be empty`);
  }

  const indexText = await (await fetch(`${base}/`)).text();
  assert.ok(indexText.includes(manifest.entry), "served index should reference current hashed entry");
  assert.ok(indexText.includes('id="updateBanner"'), "served index should include update banner");
  console.log(`HTTP production smoke: ${manifest.buildId} · ${new Set(paths).size} resources OK`);
} finally {
  await new Promise(resolvePromise => server.close(resolvePromise));
}
