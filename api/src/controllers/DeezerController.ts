import { Hono } from 'hono';
import { getSignedCookie } from 'hono/cookie';
import { validator } from 'hono/validator';
import { WebSocket } from 'ws';
import { SECRET_COOKIE_KEY } from '../config';
import { DeezerFileService } from '../service/DeezerFileService';
import { DeezerTracks, TrackData } from '../types/DeezerTypes';
import deezerTaskProgressService from '../service/DeezerTaskProgressService';
import { validateDeezerFilePlaylistExport, validateDeezerPlaylistExport } from '../validator/deezerValidator';
import deezerApiService from '../service/DeezerApiService';
import spotifyService from '../service/SpotifyService';
import { ErrorCodesEnum } from '../types/GlobalTypes';

type Context = {
  userId: string | undefined;
}

export type AugmentedDeezerController = Hono<{ Variables: Context }> & {
  registerWebSocketForTask(taskId: string, ws: WebSocket): void;
  unregisterWebSocketForTask(taskId: string | undefined, ws: WebSocket): void;
}

const deezerController: AugmentedDeezerController = new Hono<{ Variables: Context }>() as AugmentedDeezerController; // NOSONARR

deezerController.use('*', async (c, next) => {
  const userId = await getSignedCookie(c, SECRET_COOKIE_KEY, 'userId');
  if (!userId) {
    return c.json({ errorCode: ErrorCodesEnum.UNAUTHORIZED }, 401);
  }
  c.set('userId', userId);
  await next();
});

const registerWebSocketForTask = (taskId: string, ws: WebSocket) => {
  deezerTaskProgressService.registerWebSocketForTask(taskId, ws);
};

const unregisterWebSocketForTask = (taskId: string, ws: WebSocket) => {
  deezerTaskProgressService.unregisterWebSocketForTask(taskId, ws);
};

// Expose these functions via the controller object for index.ts
Object.assign(deezerController, {
  registerWebSocketForTask,
  unregisterWebSocketForTask,
});

deezerController.post('/start-playlist-export', validator('json', validateDeezerPlaylistExport), async (c) => {
  const t0 = performance.now();

  const {
    userId, name, description, isPublic, isLikes, playlistId
  } = c.req.valid('json');

  const taskId = `transfer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  deezerTaskProgressService.setTask(taskId, {
    status: 'pending',
    percentage: 0,
    currentSong: 0,
    totalSongs: 0,
    webSocketClients: [],
  });
  const deezerPlaylistTracks: DeezerTracks = await deezerApiService.fetchPlaylist(playlistId);

  if (!deezerPlaylistTracks.data || deezerPlaylistTracks.data.length === 0) {
    deezerTaskProgressService.updateTaskProgress(taskId, { status: 'error' });
    return c.json({ errorCode: ErrorCodesEnum.DEEZER_PLAYLIST_NOT_FOUND }, 500);
  }

  const deezerTracks: TrackData[] = deezerPlaylistTracks.data.map((track) => ({
    trackName: track.title,
    artistName: track.artist.name,
    albumName: track.album.title,
  }));

  console.info('Fetched deezer playlist with ', deezerTracks.length, ' tracks for task', taskId);

  (async () => {
    await spotifyService.processPlaylistTransfer(taskId, userId, name, isLikes, description, isPublic, deezerTracks, t0);
  })().then(r => r);

  return c.json({ taskId }, 200);
});

deezerController.post('/file', validator('form', validateDeezerFilePlaylistExport), async (c) => {
  const t0 = performance.now();

  const {
    userId, name, isLikes, file, description, isPublic
  } = c.req.valid('form');

  const taskId = `file-transfer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  deezerTaskProgressService.setTask(taskId, {
    status: 'pending',
    percentage: 0,
    currentSong: 0,
    totalSongs: 0,
    webSocketClients: [],
  });

  const playlist = DeezerFileService.parseCsv(await file.text());

  if (!playlist || playlist.tracks.length === 0) {
    deezerTaskProgressService.updateTaskProgress(taskId, { status: 'error' });
    return c.json({ errorCode: ErrorCodesEnum.DEEZER_PLAYLIST_PARSING_ERROR }, 500);
  }

  const deezerTracks: TrackData[] = playlist.tracks;

  console.info('Fetched deezer playlist ', playlist.playlistName, ' with ', playlist.tracks.length, ' tracks for task', taskId);

  (async () => {
    await spotifyService.processPlaylistTransfer(taskId, userId, name, isLikes, description, isPublic, deezerTracks, t0);
  })().then(r => r);

  return c.json({ taskId }, 200);
});

export default deezerController;