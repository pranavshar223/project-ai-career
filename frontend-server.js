import http from 'http';
import fs from 'fs';
import path from 'path';

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? 'index.html' : req.url;
  const resolvedPath = path.resolve(path.join('dist', filePath));
  const fileExtension = path.extname(resolvedPath);

  fs.access(resolvedPath, fs.constants.F_OK, (err) => {
    if (err) {
      fs.readFile(path.resolve(path.join('dist', 'index.html')), (err, content) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content, 'utf-8');
      });
    } else {
      fs.readFile(resolvedPath, (err, content) => {
        let contentType = 'text/html';
        if (fileExtension === '.js') contentType = 'text/javascript';
        if (fileExtension === '.css') contentType = 'text/css';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
});