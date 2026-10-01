import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
execFileSync(process.execPath, [path.join(root, 'scripts/build.mjs')], { stdio: 'inherit' });
const dist = path.join(root, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const target = path.resolve(dist, `.${pathname}`, pathname.endsWith('/') ? 'index.html' : '');
    if (!target.startsWith(dist + path.sep) && target !== dist) throw new Error('Forbidden');
    const actual = (await stat(target)).isDirectory() ? path.join(target, 'index.html') : target;
    response.writeHead(200, { 'Content-Type': types[path.extname(actual)] || 'application/octet-stream' });
    response.end(await readFile(actual));
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(4173, () => console.log('http://localhost:4173'));
