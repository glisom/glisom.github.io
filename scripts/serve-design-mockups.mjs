import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index === -1 ? fallback : args[index + 1];
};
const host = valueAfter('--host', '127.0.0.1');
const port = Number(valueAfter('--port', '4174'));
const root = resolve('docs/design/mockups');
const media = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
]);

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(
    new URL(request.url ?? '/', `http://${host}`).pathname,
  );
  const requested = resolve(
    root,
    `.${pathname === '/' ? '/article-family-approved.html' : pathname}`,
  );
  if (requested !== root && !requested.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const stats = statSync(requested);
    if (!stats.isFile()) throw new Error('not a file');
    response.writeHead(200, {
      'content-type':
        media.get(extname(requested)) ?? 'application/octet-stream',
      'content-length': stats.size,
    });
    createReadStream(requested).pipe(response);
  } catch {
    response
      .writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      .end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`Approved design mockups: http://${host}:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
