import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { logger } from 'hono/logger';
import { NODE_ENV, PORT } from './config';
import deezerController from './controllers/DeezerController';
import spotifyController from './controllers/SpotifyController';

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

serve({
  fetch: app.fetch,
  port: PORT,
});