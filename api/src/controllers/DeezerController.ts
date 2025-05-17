import { Hono } from 'hono';
import { DeezerApiService } from '../service/DeezerApiService';
import { DeezerFileService } from '../service/DeezerFileService';

const deezerController = new Hono();
const deezerApiService = new DeezerApiService();

deezerController.get('/playlists/:playlistId', async (c) => {
  const playlistId = c.req.param('playlistId');

  const deezerTracks = await deezerApiService.fetchPlaylist(playlistId);

  if (!deezerTracks.data) {
    return c.json({ message: 'No data found' }, 404);
  }

  console.info('Fetched deezer playlist ', playlistId, ' with ', deezerTracks.data.length, ' tracks');

  return c.json(deezerTracks);
});

deezerController.post('/file', async (c) => {
  const file = await (await c.req.blob()).text();

  const playlist = DeezerFileService.parseCsv(file);

  if (!playlist) {
    return c.json({ message: 'No data found' }, 404);
  }

  console.info('Fetched deezer playlist ', playlist.playlistName, ' with ', playlist.tracks.length, ' tracks');

  return c.json(playlist);
});

export default deezerController;