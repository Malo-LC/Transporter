const PORT: number = parseInt(process.env.PORT ?? '3000');
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? '';
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI ?? 'http://127.0.0.1:3000/spotify/callback';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SECRET_COOKIE_KEY = process.env.SECRET_COOKIE_KEY ?? 'secret';

export { PORT, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI, COOKIE_MAX_AGE, SECRET_COOKIE_KEY };
