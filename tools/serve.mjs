// Petit serveur local sans dépendance : node tools/serve.mjs [port]
// Écoute sur toutes les interfaces : le téléphone peut ouvrir http://<IP-de-l-ordinateur>:<port> sur le même wifi.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.argv[2]) || 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8",
};

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.endsWith("/")) path += "index.html";
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Introuvable");
  }
}).listen(port, () => {
  console.log(`Invadoku : http://localhost:${port}`);
  for (const nets of Object.values(networkInterfaces())) {
    for (const n of nets || []) if (n.family === "IPv4" && !n.internal) console.log(`Sur le wifi : http://${n.address}:${port}`);
  }
});
