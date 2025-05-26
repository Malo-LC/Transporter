import { Hono } from 'hono';
import { getSignedCookie } from 'hono/cookie';
import { SECRET_COOKIE_KEY } from '../config';
import { DeezerApiService } from '../service/DeezerApiService';
import { DeezerFileService } from '../service/DeezerFileService';
import deezerService from '../service/DeezerService';
import spotifyApiService from '../service/SpotifyApiService';
import spotifyService from '../service/SpotifyService';
import { CreateSpotifyPlaylistBody, TrackData } from '../types/DeezerTypes';

type Context = {
  userId: string | undefined;
}

const deezerController = new Hono<{ Variables: Context }>();
const deezerApiService = new DeezerApiService();

deezerController.use('*', async (c, next) => {
  const userId = await getSignedCookie(c, SECRET_COOKIE_KEY, 'userId');
  if (!userId) {
    return c.json({ message: 'User ID is missing' }, 401);
  }
  c.set('userId', userId);
  await next();
});

deezerController.post('/playlists/to-spotify', async (c) => {
  const t0 = performance.now();

  const userId = c.get('userId');
  const {
    name, description, public: isPublic, isLikes = false, playlistUrl
  } = await c.req.json<CreateSpotifyPlaylistBody>();
  const regex = /(?:playlist\/|)(\d+)(?:[/?]|$)/m; // Regex to match Deezer playlist ID in the URL
  const match = playlistUrl?.match(regex);
  const playlistId = match ? match[1] : null;

  if (!playlistId) {
    return c.json({ message: 'Invalid Deezer playlist URL' }, 400);
  }

  if (!name && !isLikes) {
    return c.json({ message: 'No playlist name provided' }, 400);
  }

  if (!userId) {
    return c.json({ message: 'User ID is missing' }, 401);
  }

  if (!spotifyApiService.hasAccessToken(userId)) {
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
  const spotifyPlaylistId = await spotifyService.createOrGetSpotifyPlaylist(userId, name, isLikes, description, isPublic);

  if (!spotifyPlaylistId) {
    return c.json({ message: 'Failed to create or find Spotify playlist' }, 500);
  }

  // Transfer tracks to Spotify
  const missingTracks = await deezerService.transferTracksToSpotify(userId, deezerTracks, spotifyPlaylistId, isLikes);

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
  const userId = c.get('userId');
  const body = await c.req.parseBody();

  const name = body.name as string | undefined;
  const isLikes = body.isLikes ?? false;
  const file = body.file as File | undefined;

  if (!file) {
    return c.json({ message: 'No file provided' }, 400);
  }

  if (!name && !isLikes) {
    return c.json({ message: 'No playlist name provided' }, 400);
  }

  if (!userId) {
    return c.json({ message: 'User ID is missing' }, 401);
  }

  if (!spotifyApiService.hasAccessToken(userId)) {
    return c.json({ message: 'Spotify access token is missing' }, 401);
  }

  const playlist = DeezerFileService.parseCsv(await file.text());

  if (!playlist) {
    return c.json({ message: 'No data found' }, 404);
  }

  console.info('Fetched deezer playlist ', playlist.playlistName, ' with ', playlist.tracks.length, ' tracks');

  // Create or get Spotify playlist
  const spotifyPlaylistId = await spotifyService.createOrGetSpotifyPlaylist(userId, name, !!isLikes);

  if (!spotifyPlaylistId) {
    return c.json({ message: 'Failed to create or find Spotify playlist' }, 500);
  }

  // Transfer tracks to Spotify
  const missingTracks = await deezerService.transferTracksToSpotify(userId, playlist.tracks, spotifyPlaylistId, !!isLikes);

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