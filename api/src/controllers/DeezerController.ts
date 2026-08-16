import { Hono } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import { validator } from 'hono/validator';
import type { WSContext } from 'hono/ws';
import {
  COOKIE_MAX_AGE,
  DEEZER_USER_ID_COOKIE,
  NODE_ENV,
  SECRET_COOKIE_KEY,
  SPOTIFY_USER_ID_COOKIE,
} from '../config';
import deezerApiService from '../service/DeezerApiService';
import { DeezerFileService } from '../service/DeezerFileService';
import deezerTaskProgressService from '../service/DeezerTaskProgressService';
import spotifyService from '../service/SpotifyService';
import type { DeezerTracks, TrackData } from '../types/DeezerTypes';
import { ErrorCodesEnum } from '../types/GlobalTypes';
import { validateDeezerFilePlaylistExport, validateDeezerPlaylistExport } from '../validator/deezerValidator';

type Context = {
  spotifyUserId: string | undefined;
  deezerUserId: string | undefined;
};

export type AugmentedDeezerController = Hono<{ Variables: Context }> & {
  registerWebSocketForTask(taskId: string, ws: WSContext): void;
  unregisterWebSocketForTask(taskId: string | undefined, ws: WSContext): void;
};

const deezerController: AugmentedDeezerController = new Hono<{ Variables: Context }>() as AugmentedDeezerController; // NOSONARR

const registerWebSocketForTask = (taskId: string, ws: WSContext) => {
  deezerTaskProgressService.registerWebSocketForTask(taskId, ws);
};

const unregisterWebSocketForTask = (taskId: string | undefined, ws: WSContext) => {
  deezerTaskProgressService.unregisterWebSocketForTask(taskId ?? '', ws);
};

// Expose these functions via the controller object for index.ts
Object.assign(deezerController, {
  registerWebSocketForTask,
  unregisterWebSocketForTask,
});

deezerController.use('/me', async (c, next) => {
  const deezerUserId = await getSignedCookie(c, SECRET_COOKIE_KEY, DEEZER_USER_ID_COOKIE);

  c.set('deezerUserId', deezerUserId || undefined); // NOSONARR
  await next();
});

deezerController.get('/me', (c) => {
  const deezerUserId = c.get('deezerUserId');

  if (!deezerUserId) {
    deleteCookie(c, DEEZER_USER_ID_COOKIE);
    return c.json({
      isAuthenticated: false,
    });
  }

  const isAuthenticated = deezerApiService.hasAccessToken(deezerUserId);

  if (!isAuthenticated) {
    deleteCookie(c, DEEZER_USER_ID_COOKIE);
  }

  return c.json({
    isAuthenticated,
    userId: deezerUserId,
  });
});

deezerController.get('/callback', async (c) => {
  const code = c.req.query('code');

  if (!code) {
    return c.json({ message: 'No code provided' }, 400);
  }

  const userId = await deezerApiService.fetchAndSetAccessToken(code);

  await setSignedCookie(c, DEEZER_USER_ID_COOKIE, userId, SECRET_COOKIE_KEY, {
    httpOnly: true,
    path: '/',
    secure: NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
  });

  return c.json('Deezer authentication successful', 200);
});

deezerController.get('/login', async (c) => {
  const url = deezerApiService.computeLoginOauthUrl();
  return c.json(url);
});

deezerController.use('/start-playlist-export', async (c, next) => {
  const spotifyUserId = await getSignedCookie(c, SECRET_COOKIE_KEY, SPOTIFY_USER_ID_COOKIE);
  const deezerUserId = await getSignedCookie(c, SECRET_COOKIE_KEY, DEEZER_USER_ID_COOKIE);

  if (!spotifyUserId) {
    return c.json({ errorCode: ErrorCodesEnum.UNAUTHORIZED }, 401);
  }

  c.set('spotifyUserId', spotifyUserId);
  c.set('deezerUserId', deezerUserId || undefined); // NOSONARR
  await next();
});

deezerController.use('/file', async (c, next) => {
  const spotifyUserId = await getSignedCookie(c, SECRET_COOKIE_KEY, SPOTIFY_USER_ID_COOKIE);

  if (!spotifyUserId) {
    return c.json({ errorCode: ErrorCodesEnum.UNAUTHORIZED }, 401);
  }

  c.set('spotifyUserId', spotifyUserId);
  await next();
});

deezerController.post('/start-playlist-export', validator('json', validateDeezerPlaylistExport), async (c) => {
  const t0 = performance.now();

  const { userId, deezerUserId, name, description, isPublic, isLikes, playlistId } = c.req.valid('json');

  const taskId = `transfer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  deezerTaskProgressService.setTask(taskId, {
    status: 'pending',
    percentage: 0,
    currentSong: 0,
    totalSongs: 0,
    webSocketClients: [],
  });
  const deezerPlaylistTracks: DeezerTracks = await deezerApiService.fetchPlaylist(deezerUserId, playlistId);

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
  })().then((r) => r);

  return c.json({ taskId }, 200);
});

deezerController.post('/file', validator('form', validateDeezerFilePlaylistExport), async (c) => {
  const t0 = performance.now();

  const { userId, name, isLikes, file, description, isPublic } = c.req.valid('form');

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
  })().then((r) => r);

  return c.json({ taskId }, 200);
});

export default deezerController;
