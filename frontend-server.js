import http from 'http';
import fs from 'fs';
import path from 'path';

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  // Get the file path from the request URL
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  // All paths should resolve to the dist folder
  const resolvedPath = path.resolve(path.join('dist', filePath));

  // Check if the file exists, otherwise serve index.html
  fs.access(resolvedPath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found, serve index.html for SPA routing
      fs.readFile(path.resolve(path.join('dist', 'index.html')), (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        }
      });
    } else {
      // File found, serve it
      fs.readFile(resolvedPath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Server Error');
        } else {
          let contentType = 'text/html';
          if (resolvedPath.endsWith('.js')) contentType = 'text/javascript';
          if (resolvedPath.endsWith('.css')) contentType = 'text/css';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Frontend server listening on port ${port}`);
});