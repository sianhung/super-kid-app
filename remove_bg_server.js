#!/usr/bin/env node
/**
 * Removes black background from a JPEG and saves a clean PNG.
 * Uses only Node.js built-in modules — no npm packages needed.
 * 
 * How it works:
 *  1. Read the JPEG as raw bytes
 *  2. Decode the JPEG using a minimal pure-JS JPEG decoder
 *  3. For every pixel where R<40 && G<40 && B<40, set Alpha=0
 *  4. Encode as PNG (using Node's zlib) and write to disk
 */

const fs   = require('fs');
const zlib = require('zlib');
const path = require('path');

// ─── Tiny pure-JS JPEG decoder (baseline DCT only) ───────────────────────────
// We use the well-known approach: parse JPEG markers to get dimensions,
// then use the Canvas API via a data URL in a headless context.
// Since we have no canvas module, we'll write a small HTTP server that
// serves a self-contained page, does the canvas work, and POSTs the PNG back.

const http = require('http');
const { execSync } = require('child_process');

const INPUT  = path.join(__dirname, 'assets', 'mascot.png');   // original JPEG
const OUTPUT = path.join(__dirname, 'assets', 'mascot.png');   // overwrite with clean PNG

let server;

const html = `<!DOCTYPE html><html><body>
<canvas id="c"></canvas>
<script>
fetch('/image')
  .then(r => r.blob())
  .then(blob => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    img.onload = () => {
      const c = document.getElementById('c');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, c.width, c.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] < 40 && d[i+1] < 40 && d[i+2] < 40) d[i+3] = 0;
      }
      ctx.putImageData(id, 0, 0);
      c.toBlob(blob2 => {
        blob2.arrayBuffer().then(buf => {
          fetch('/save', {
            method: 'POST',
            headers: {'Content-Type': 'image/png'},
            body: buf
          }).then(() => { document.title = 'DONE'; });
        });
      }, 'image/png');
    };
  });
</script></body></html>`;

server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
  } else if (req.url === '/image') {
    const data = fs.readFileSync(INPUT);
    res.writeHead(200, {'Content-Type': 'image/jpeg'});
    res.end(data);
  } else if (req.url === '/save' && req.method === 'POST') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      fs.writeFileSync(OUTPUT, buf);
      console.log('✅ Saved clean PNG →', OUTPUT, '(' + buf.length + ' bytes)');
      res.writeHead(200); res.end('ok');
      server.close();
      process.exit(0);
    });
  } else {
    res.writeHead(404); res.end();
  }
});

server.listen(7788, '127.0.0.1', () => {
  console.log('🔧 BG-removal server running at http://127.0.0.1:7788');
  console.log('   Open that URL in your browser, wait ~3s, then it saves automatically.');
});
