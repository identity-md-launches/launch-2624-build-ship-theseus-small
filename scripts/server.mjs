import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const exportRoot = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

/** Small static preview; supports a real gateway-style prefix, never SPA fallbacks. */
export function createPreview(prefix = '/') {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      if (!url.pathname.startsWith(prefix)) { res.writeHead(404).end('Not found'); return; }
      const path = decodeURIComponent(url.pathname.slice(prefix.length));
      const filename = resolve(exportRoot, path || '.');
      if (!filename.startsWith(exportRoot + sep) && filename !== exportRoot) { res.writeHead(403).end('Forbidden'); return; }
      const file = await stat(filename);
      if (file.isDirectory() && !url.pathname.endsWith('/')) { res.writeHead(301, { Location: url.pathname + '/' + url.search }).end(); return; }
      const target = file.isDirectory() ? resolve(filename, 'index.html') : filename;
      const content = await readFile(target);
      res.writeHead(200, { 'Content-Type': types[extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(content);
    } catch {
      res.writeHead(404).end('Not found');
    }
  });
}
