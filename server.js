const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3010;
const dir = __dirname;

http.createServer((req, res) => {
    let safeUrl = req.url.split('?')[0];
    let filePath = path.join(dir, safeUrl === '/' ? 'index.html' : safeUrl);
    
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'text/javascript';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.json') contentType = 'application/json';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}).listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
