const PORT: number = parseInt(process.env.PORT ?? '3000');
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? '';

export { PORT, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET };