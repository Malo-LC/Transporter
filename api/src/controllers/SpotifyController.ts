import { Hono } from 'hono';
import { setSignedCookie } from 'hono/cookie';
import { COOKIE_MAX_AGE, SECRET_COOKIE_KEY } from '../config';
import spotifyApiService from '../service/SpotifyApiService';
import { SearchTrackRequest } from '../types/SpotifyTypes';

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

  if (!code) {
    return c.json({ message: 'No code provided' }, 400);
  }

  const userId = await spotifyApiService.fetchAndSetAccessToken(code);

  await setSignedCookie(
    c,
    'userId',
    userId,
    SECRET_COOKIE_KEY, {
      httpOnly: true,
      path: '/',
      secure: true,
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
    });

  return c.redirect('/');
});

spotifyController.get('/login', async (c) => {
  const url = spotifyApiService.computeLoginOauthUrl();
  return c.redirect(url);
});

export default spotifyController;