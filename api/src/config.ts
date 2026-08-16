const PORT: number = parseInt(process.env.PORT ?? '3000', 10);
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? '';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SECRET_COOKIE_KEY = process.env.SECRET_COOKIE_KEY ?? 'OrjSYyWp6WB1NSlXzwjy';
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI ?? 'http://127.0.0.1:5173/spotify/callback';

export { COOKIE_MAX_AGE, FRONTEND_URL, NODE_ENV, PORT, SECRET_COOKIE_KEY, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI };
