import { Hono } from 'hono';
import { SearchTrackRequest } from '../types/SpotifyTypes';
import spotifyApiService from '../service/SpotifyApiService';

// For testing purposes
const spotifyController = new Hono();

spotifyController.post('/search/track', async (c) => {
  const body = await c.req.json<SearchTrackRequest>();

  const tracks = await spotifyApiService.searchTrack(
    body.songName,
    body.artistName,
    body.albumName
  );
  return c.json(tracks);
});

spotifyController.get('/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');

  if (!code || !state) {
    return c.json({ message: 'No code or state provided' }, 400);
  }

  const token = await spotifyApiService.fetchAccessToken(code, state);

  console.info('Added token');

  return c.json(token);
});

spotifyController.get('/login', async (c) => {
  const url = spotifyApiService.computeLoginOauthUrl();
  return c.redirect(url);
});

spotifyController.post('/playlist', async (c) => {
  const name = c.req.query("name");

  if (!name) {
    return c.json({ message: 'No name provided' }, 400);
  }

  const playlist = await spotifyApiService.createPlaylist(name);

  if (!playlist) {
    return c.json({ message: 'No data found' }, 404);
  }

  return c.json(playlist);
});

export default spotifyController;