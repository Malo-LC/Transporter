import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { PORT } from './config';
import deezerController from './controllers/DeezerController';

const app = new Hono();

app.get('/', (c) => c.text('Hono!'));

app.route('/deezer', deezerController);

console.log(`Server is running on port ${PORT}`);

serve({
  fetch: app.fetch,
  port: PORT,
});