import { Hono } from 'hono';
import { SpotifyApiService } from '../service/SpotifyApiService';
import { SearchTrackRequest } from '../types/SpotifyTypes';

const spotifyController = new Hono();
const spotifyApiService = new SpotifyApiService();

// For testing purposes
spotifyController.post('/search/track', async (c) => {
  const body = await c.req.json<SearchTrackRequest>();
  const tracks = await spotifyApiService.searchTrack(
    body.songName,
    body.artistName,
    body.albumName
  );
  return c.json(tracks);
});

export default spotifyController;