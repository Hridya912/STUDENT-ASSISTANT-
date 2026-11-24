/**
 * Zero-dependency Local Development Server
 * Serves static files (HTML, CSS, JS) and handles /api/chat requests
 * using the api/chat.js Vercel Function handler.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Simple .env.local parser (if present)
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const idx = trimmed.indexOf('=');
            if (idx !== -1) {
              const key = trimmed.slice(0, idx).trim();
              const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
              if (!process.env[key]) {
                process.env[key] = val;
              }
            }
          }
        }
        console.log(`Loaded environment from ${envFile}`);
        break;
      } catch (err) {
        console.warn(`Could not read ${envFile}:`, err.message);
      }
    }
  }
}

loadEnv();

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Handle /api/chat route
  if (pathname === '/api/chat' || pathname === '/api/chat.js') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      // Mock Express/Vercel response methods
      let statusCode = 200;
      const headers = {};

      const mockRes = {
        setHeader(key, val) {
          headers[key] = val;
          return mockRes;
        },
        status(code) {
          statusCode = code;
          return mockRes;
        },
        json(data) {
          headers['Content-Type'] = 'application/json';
          res.writeHead(statusCode, headers);
          res.end(JSON.stringify(data));
          return mockRes;
        },
        send(data) {
          res.writeHead(statusCode, headers);
          res.end(data);
          return mockRes;
        }
      };

      let parsedBody = null;
      if (bodyData) {
        try {
          parsedBody = JSON.parse(bodyData);
        } catch {
          parsedBody = bodyData;
        }
      }

      req.body = parsedBody;

      try {
        const { default: handler } = await import('./api/chat.js?update=' + Date.now());
        await handler(req, mockRes);
      } catch (err) {
        console.error('Server error handling API request:', err);
        mockRes.status(500).json({ error: 'Internal server error' });
      }
    });

    return;
  }

  // Handle Static Files (Simulating CDN static asset delivery)
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Security check: keep within __dirname
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      // CDN cache header simulation for static assets
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=60'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Grok Student Assistant local server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔑 XAI_API_KEY: ${process.env.XAI_API_KEY ? 'Configured ✅' : 'Missing ⚠️ (Add to .env.local)'}`);
  console.log(`======================================================\n`);
});
