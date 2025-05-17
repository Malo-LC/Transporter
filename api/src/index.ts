import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { PORT } from './config';
import deezerController from './controllers/DeezerController';
import spotifyController from './controllers/SpotifyController';

const app = new Hono();

app.get('/', (c) => c.text('Hono!'));

app.route('/deezer', deezerController);
app.route('/spotify', spotifyController);

console.log(`Server is running on port ${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});