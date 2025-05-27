import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { WebSocket, WebSocketServer } from 'ws';
import { NODE_ENV, PORT } from './config';
import deezerController from './controllers/DeezerController';
import spotifyController from './controllers/SpotifyController';
// --- End WebSocket Server Imports ---
const app = new Hono();

if (NODE_ENV === 'development') {
  console.log('Running in development mode');
  app.use(prettyJSON());
  app.use(logger());
}

app.use(secureHeaders());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173'],
    allowMethods: ['POST', 'GET', 'DELETE', 'PUT'],
    credentials: true,
    maxAge: 600,
  }),
);

app.get('/', (c) => c.text('Hono!'));

app.route('/api/deezer', deezerController);
app.route('/api/spotify', spotifyController);

console.log(`Server is running on port ${PORT}`);

const server = serve({
  fetch: app.fetch,
  port: PORT,
});

export const wss = new WebSocketServer({ noServer: true });

// --- WebSocket connection handling ---
wss.on('connection', (ws: WebSocket, req) => {
  const taskId = req.url?.split('/').pop();
  if (taskId) {
    // Attach the WebSocket to the specific task
    deezerController.registerWebSocketForTask(taskId, ws);
  } else {
    console.warn('[WebSocket] Client connected without taskId in URL. Closing connection.');
    ws.close(1008, 'No taskId provided'); // 1008: Policy Violation
  }

  ws.on('close', () => {
    deezerController.unregisterWebSocketForTask(taskId, ws);
  });

  ws.on('error', (error) => {
    console.error(`[WebSocket] Error for taskId ${taskId}:`, error);
    deezerController.unregisterWebSocketForTask(taskId, ws); // Ensure cleanup on error
  });
});

server.on('upgrade', (request, socket, head) => {
  if (request.url?.startsWith('/ws/export-progress/')) {

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});
