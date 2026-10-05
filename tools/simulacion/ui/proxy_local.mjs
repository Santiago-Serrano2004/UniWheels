// Proxy local mínimo (puerto 8090) que imita las reglas de gateway/api-locations.conf
// para que el panel (vite dev, sin proxy) hable con los 4 servicios en localhost.
// Solo apunta a 127.0.0.1. Uso: node proxy_local.mjs
import http from 'node:http';

const RUTAS = [
  [/^\/api\/v1\/admin\/(vehicles|documents)/, 8002],
  [/^\/api\/v1\/admin\/(sos-events|trips)/, 8004],
  [/^\/api\/v1\/admin\/users/, 8001],
  [/^\/api\/v1\/(auth|institutions|user|driver\/register)/, 8001],
  [/^\/api\/v1\/vehicles/, 8002],
  [/^\/api\/v1\/routes/, 8003],
  [/^\/api\/v1\/(trips|passenger)/, 8004],
  [/^\/api\/v1\/(notifications|users|push)/, 8005],
];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type,accept',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
};

http
  .createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      return res.end();
    }
    const destino = RUTAS.find(([re]) => re.test(req.url));
    if (!destino) {
      res.writeHead(404, { ...CORS, 'content-type': 'application/json' });
      return res.end(JSON.stringify({ message: 'sin ruta en el proxy local (como en el gateway)', url: req.url }));
    }
    const p = http.request(
      { host: '127.0.0.1', port: destino[1], path: req.url, method: req.method, headers: { ...req.headers, host: `127.0.0.1:${destino[1]}` } },
      (r) => {
        res.writeHead(r.statusCode, { ...r.headers, ...CORS });
        r.pipe(res);
      },
    );
    p.on('error', (e) => {
      res.writeHead(502, { ...CORS, 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: String(e) }));
    });
    req.pipe(p);
  })
  .listen(8090, '127.0.0.1', () => console.log('proxy local en http://127.0.0.1:8090'));
