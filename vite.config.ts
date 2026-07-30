import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function syncApiPlugin(): Plugin {
  const dataFilePath = path.resolve(__dirname, 'robocus_data_store.json');
  const clients = new Set<any>();

  return {
    name: 'sync-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';

        if (url === '/api/data' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          if (fs.existsSync(dataFilePath)) {
            res.end(fs.readFileSync(dataFilePath, 'utf-8'));
          } else {
            res.end(JSON.stringify(null));
          }
          return;
        }

        if (url === '/api/data' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              fs.writeFileSync(dataFilePath, body, 'utf-8');
              const parsedData = JSON.parse(body);
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(JSON.stringify({ success: true }));

              // Broadcast new data to all connected SSE clients instantly
              const eventPayload = `data: ${JSON.stringify({ type: 'DATA_UPDATED', data: parsedData })}\n\n`;
              clients.forEach((client) => {
                try {
                  client.write(eventPayload);
                } catch (err) {
                  clients.delete(client);
                }
              });
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to save data' }));
            }
          });
          return;
        }

        if (url === '/api/stream' && req.method === 'GET') {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.write(': keepalive\n\n');

          clients.add(res);

          req.on('close', () => {
            clients.delete(res);
          });
          return;
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), syncApiPlugin()],
  server: {
    host: true, // Listen on 0.0.0.0 for LAN and Ngrok tunnel access
    allowedHosts: true, // Allow ngrok-free.dev domains and external hosts
    watch: {
      ignored: ['**/robocus_data_store.json', '**/.git/**'],
    },
  },
});
