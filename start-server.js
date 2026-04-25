/**
 * Beelisten 本地服务器
 * 运行方式：在此文件夹下打开终端，执行 node start-server.js
 */
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 9001;
const ROOT = __dirname;

const MIME = {
  '.html' : 'text/html; charset=utf-8',
  '.css'  : 'text/css; charset=utf-8',
  '.js'   : 'application/javascript; charset=utf-8',
  '.json' : 'application/json; charset=utf-8',
  '.png'  : 'image/png',
  '.jpg'  : 'image/jpeg',
  '.jpeg' : 'image/jpeg',
  '.gif'  : 'image/gif',
  '.svg'  : 'image/svg+xml',
  '.ico'  : 'image/x-icon',
  '.mp3'  : 'audio/mpeg',
  '.mp4'  : 'video/mp4',
  '.srt'  : 'text/plain; charset=utf-8',
  '.woff' : 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf'  : 'font/ttf',
};

const server = http.createServer((req, res) => {
  // 解码 URL，处理中文路径
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // 安全检查：防止目录穿越
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>404 - 找不到文件</h2><p>${urlPath}</p>`);
      return;
    }

    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type' : mime,
      'Content-Length': stat.size,
      // 允许跨域（本地开发用）
      'Access-Control-Allow-Origin': '*',
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  ✅ Beelisten 服务器已启动！');
  console.log('');
  console.log(`  👉 打开浏览器访问：http://localhost:${PORT}/`);
  console.log('');
  console.log('  按 Ctrl+C 停止服务器');
  console.log('');
});
