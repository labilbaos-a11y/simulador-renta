// Servidor estático mínimo para revisar el simulador en el navegador durante el desarrollo.
// No forma parte del sitio publicado: GitHub Pages sirve index.html directamente.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PUERTO = Number(process.env.PORT) || 4173;
const RAIZ = __dirname;
const TIPOS = { ".html": "text/html; charset=utf-8", ".md": "text/plain; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]);
  const archivo = path.join(RAIZ, rel === "/" ? "index.html" : rel);

  if (!archivo.startsWith(RAIZ)) { res.writeHead(403).end("Prohibido"); return; }

  fs.readFile(archivo, (err, buf) => {
    if (err) { res.writeHead(404, { "Content-Type": "text/plain" }).end("No encontrado"); return; }
    res.writeHead(200, {
      "Content-Type": TIPOS[path.extname(archivo)] || "application/octet-stream",
      "Cache-Control": "no-store"
    }).end(buf);
  });
}).listen(PUERTO, () => console.log("Simulador en http://localhost:" + PUERTO));
