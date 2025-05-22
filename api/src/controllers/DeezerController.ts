import { Hono } from 'hono';
import { DeezerApiService } from '../service/DeezerApiService';
import { DeezerFileService } from '../service/DeezerFileService';
import spotifyApiService from '../service/SpotifyApiService';
import { CreateSpotifyPlaylistBody, TrackData } from '../types/DeezerTypes';
import deezerService from '../service/DeezerService';
import spotifyService from '../service/SpotifyService';

const deezerController = new Hono();
const deezerApiService = new DeezerApiService();

deezerController.post('/playlists/:playlistId/to-spotify', async (c) => {
  const t0 = performance.now();
  const playlistId = c.req.param('playlistId');
  const { name, description, public: isPublic, isLikes = false } = await c.req.json<CreateSpotifyPlaylistBody>();

  if (!name && !isLikes) {
    return c.json({ message: 'No playlist name provided' }, 400);
  }

  if (!spotifyApiService.hasAccessToken()) {
    return c.json({ message: 'Spotify access token is missing' }, 401);
  }

  const deezerPlaylistTracks = await deezerApiService.fetchPlaylist(playlistId);

  if (!deezerPlaylistTracks.data || deezerPlaylistTracks.data.length === 0) {
    return c.json({ message: 'No tracks found for this Deezer playlist' }, 404);
  }

  const deezerTracks: TrackData[] = deezerPlaylistTracks.data.map((track) => ({
    trackName: track.title,
    artistName: track.artist.name,
    albumName: track.album.title,
  }));

  console.info(`Fetched Deezer playlist "${playlistId}" with ${deezerTracks.length} tracks.`);

  // Create or get Spotify playlist
  const spotifyPlaylistId = await spotifyService.createOrGetSpotifyPlaylist(name, isLikes, description, isPublic);

  if (!spotifyPlaylistId) {
    return c.json({ message: 'Failed to create or find Spotify playlist' }, 500);
  }

  // Transfer tracks to Spotify
  const missingTracks = await deezerService.transferTracksToSpotify(deezerTracks, spotifyPlaylistId, isLikes);

  console.info(`Successfully added all tracks to Spotify playlist "${spotifyPlaylistId}".`);

  return c.json({
      message: 'Playlist transferred successfully',
      spotifyPlaylistId,
      time: ((performance.now() - t0) / 1000).toFixed(2) + ' seconds',
      missingTracks,
    },
    200
  );
});

deezerController.post('/file', async (c) => {
  const t0 = performance.now();
  const file = await (await c.req.blob()).text();

  const { name, isLikes } = c.req.query();

  if (!name && !isLikes) {
    return c.json({ message: 'No playlist name provided' }, 400);
  }

  if (!spotifyApiService.hasAccessToken()) {
    return c.json({ message: 'Spotify access token is missing' }, 401);
  }

  const playlist = DeezerFileService.parseCsv(file);

  if (!playlist) {
    return c.json({ message: 'No data found' }, 404);
  }

  console.info('Fetched deezer playlist ', playlist.playlistName, ' with ', playlist.tracks.length, ' tracks');

  // Create or get Spotify playlist
  const spotifyPlaylistId = await spotifyService.createOrGetSpotifyPlaylist(name, !!isLikes);

  if (!spotifyPlaylistId) {
    return c.json({ message: 'Failed to create or find Spotify playlist' }, 500);
  }

  // Transfer tracks to Spotify
  const missingTracks = await deezerService.transferTracksToSpotify(playlist.tracks, spotifyPlaylistId, !!isLikes);

  console.info(`Successfully added all tracks to Spotify playlist "${spotifyPlaylistId}".`);

  return c.json({
      message: 'Playlist transferred successfully',
      spotifyPlaylistId,
      time: ((performance.now() - t0) / 1000).toFixed(2) + ' seconds',
      missingTracks,
    },
    200
  );
});

export default deezerController;