import { Hono } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import { COOKIE_MAX_AGE, NODE_ENV, SECRET_COOKIE_KEY } from '../config';
import spotifyApiService from '../service/SpotifyApiService';

type Context = {
  userId: string | undefined;
}

const spotifyController = new Hono<{ Variables: Context }>();

spotifyController.use('/me', async (c, next) => {
  const userId = await getSignedCookie(c, SECRET_COOKIE_KEY, 'userId');

  console.log('User ID from cookie:', userId);

  c.set('userId', userId || undefined); // NOSONARR
  await next();
});

spotifyController.get('/me', (c) => {
  const userId = c.get('userId');

  console.log('User ID:', userId);

  if (!userId) {
    deleteCookie(c, 'userId');
    return c.json({
      isAuthenticated: false,
    });
  }

  const isAuthenticated = spotifyApiService.hasAccessToken(userId);

  if (!isAuthenticated) {
    deleteCookie(c, 'userId');
  }

  return c.json({
    isAuthenticated,
    userId,
  });
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
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: COOKIE_MAX_AGE,
    });

  return c.json('Spotify authentication successful', 200);
});

spotifyController.get('/login', async (c) => {
  const url = spotifyApiService.computeLoginOauthUrl();
  return c.json(url);
});

export default spotifyController;