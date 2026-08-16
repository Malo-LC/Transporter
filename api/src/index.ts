import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Hono } from 'hono';
import { serveStatic, upgradeWebSocket, websocket } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { NODE_ENV, PORT } from './config';
import deezerController from './controllers/DeezerController';
import spotifyController from './controllers/SpotifyController';

const isDevEnvironment = NODE_ENV === 'development';

const app = new Hono();

if (isDevEnvironment) {
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

app.route('/api/deezer', deezerController);
app.route('/api/spotify', spotifyController);

app.get(
  '/api/ws/export-progress/:taskId',
  upgradeWebSocket((c) => {
    const { taskId } = c.req.param();

    return {
      onOpen(_event, ws) {
        if (!taskId) {
          console.warn('[WebSocket] Client connected without taskId in URL. Closing connection.');
          ws.close(1008, 'No taskId provided');
          return;
        }
        deezerController.registerWebSocketForTask(taskId, ws);
      },
      onClose(_event, ws) {
        deezerController.unregisterWebSocketForTask(taskId, ws);
      },
      onError(_event, ws) {
        console.error(`[WebSocket] Error for taskId ${taskId}`);
        deezerController.unregisterWebSocketForTask(taskId, ws);
      },
    };
  }),
);

const distStaticRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'static');

const staticRoot = existsSync(distStaticRoot)
  ? distStaticRoot
  : existsSync(path.resolve(process.cwd(), 'static'))
    ? path.resolve(process.cwd(), 'static')
    : path.resolve(process.cwd(), 'dist/static');

if (!isDevEnvironment) {
  app.use(
    '/*',
    serveStatic({
      root: staticRoot,
    }),
  );

  app.get('*', async (c, next) => {
    // On ignore les routes API pour ne pas renvoyer de l'HTML sur une erreur 404 API
    if (c.req.path.startsWith('/api/')) {
      return next();
    }

    return c.html(await Bun.file(path.join(staticRoot, 'index.html')).text());
  });
}

console.log(`Server is running on port ${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
  websocket,
};
