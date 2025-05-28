import { Hono } from 'hono';
import { getSignedCookie } from 'hono/cookie';
import { WebSocket } from 'ws';
import { SECRET_COOKIE_KEY } from '../config';
import { DeezerApiService } from '../service/DeezerApiService';
import { DeezerFileService } from '../service/DeezerFileService';
import deezerService from '../service/DeezerService';
import spotifyApiService from '../service/SpotifyApiService';
import spotifyService from '../service/SpotifyService';
import { CreateSpotifyPlaylistBody, DeezerTracks, TaskProgress, TrackData } from '../types/DeezerTypes';
import deezerTaskProgressService from '../service/DeezerTaskProgressService';

type Context = {
  userId: string | undefined;
}

export type AugmentedDeezerController = Hono<{ Variables: Context }> & {
  registerWebSocketForTask(taskId: string, ws: WebSocket): void;
  unregisterWebSocketForTask(taskId: string | undefined, ws: WebSocket): void;
}

const deezerController: AugmentedDeezerController = new Hono<{ Variables: Context }>() as AugmentedDeezerController;
const deezerApiService = new DeezerApiService();

const taskProgressStore = new Map<string, TaskProgress>();

deezerController.use('*', async (c, next) => {
  const userId = await getSignedCookie(c, SECRET_COOKIE_KEY, 'userId');
  if (!userId) {
    return c.json({ message: 'User ID is missing' }, 401);
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

deezerController.post('/start-playlist-export', async (c) => {
  const t0 = performance.now();

  const userId = c.get('userId');
  const {
    name, description, public: isPublic, isLikes = false, playlistUrl
  } = await c.req.json<CreateSpotifyPlaylistBody>();

  const regex = /(?:playlist\/|)(\d+)(?:[/?]|$)/m;
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

  const taskId = `transfer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  deezerTaskProgressService.setTask(taskId, {
    status: 'pending',
    percentage: 0,
    currentSong: 0,
    totalSongs: 0,
    webSocketClients: [],
  });

  (async () => {
    try {
      const deezerPlaylistTracks: DeezerTracks = await deezerApiService.fetchPlaylist(playlistId);

      if (!deezerPlaylistTracks.data || deezerPlaylistTracks.data.length === 0) {
        deezerTaskProgressService.updateTaskProgress(taskId, { status: 'error' });
        return;
      }

      const deezerTracks: TrackData[] = deezerPlaylistTracks.data.map((track) => ({
        trackName: track.title,
        artistName: track.artist.name,
        albumName: track.album.title,
      }));

      deezerTaskProgressService.updateTaskProgress(taskId, {
        totalSongs: deezerTracks.length,
      });

      const spotifyPlaylistId = await spotifyService.createOrGetSpotifyPlaylist(userId, name, isLikes, description, isPublic);

      if (!spotifyPlaylistId) {
        deezerTaskProgressService.updateTaskProgress(taskId, { status: 'error' });
        return;
      }
      deezerTaskProgressService.updateTaskProgress(taskId, {
        spotifyPlaylistId,
      });

      const missingTracks = await deezerService.transferTracksToSpotify(
        userId,
        deezerTracks,
        spotifyPlaylistId,
        isLikes,
        (currentProgress: number, songName: string) => {
          const total = deezerTracks.length;
          const percentage = Math.round((currentProgress / total) * 100);
          deezerTaskProgressService.updateTaskProgress(taskId, {
            status: 'transferring',
            currentSong: currentProgress,
            totalSongs: total,
            percentage: percentage,
            songName
          });
        }
      );

      deezerTaskProgressService.updateTaskProgress(taskId, {
        status: 'completed',
        percentage: 100,
        spotifyPlaylistId: spotifyPlaylistId,
        timeTaken: (performance.now() - t0),
        missingTracks,
      });

    } catch (error) {
      console.error(`Error during playlist transfer for task ${taskId}:`, error);
      deezerTaskProgressService.updateTaskProgress(taskId, {
        status: 'error',
      });
    } finally {
      setTimeout(() => {
        deezerTaskProgressService.deleteTask(taskId);
      }, 5 * 60 * 1000);
    }
  })()
    .then(r => r);

  return c.json({ taskId }, 200);
});

deezerController.post('/file', async (c) => {
  const t0 = performance.now();
  const userId = c.get('userId');
  const body = await c.req.parseBody();

  const name = body.name as string | undefined;
  const isLikesValue = body.isLikes;
  const isLikes = typeof isLikesValue === 'string' ? isLikesValue.toLowerCase() === 'true' : !!isLikesValue;
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

  const taskId = `file-transfer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  deezerTaskProgressService.setTask(taskId, {
    status: 'pending',
    percentage: 0,
    currentSong: 0,
    totalSongs: 0,
    webSocketClients: [],
  });

  (async () => {
    try {
      const playlist = DeezerFileService.parseCsv(await file.text());

      if (!playlist || playlist.tracks.length === 0) {
        deezerTaskProgressService.updateTaskProgress(taskId, { status: 'error' });
        return;
      }

      console.info('Fetched deezer playlist ', playlist.playlistName, ' with ', playlist.tracks.length, ' tracks for task', taskId);
      deezerTaskProgressService.updateTaskProgress(taskId, {
        totalSongs: playlist.tracks.length,
      });

      const spotifyPlaylistId = await spotifyService.createOrGetSpotifyPlaylist(userId, name, !!isLikes);

      if (!spotifyPlaylistId) {
        deezerTaskProgressService.updateTaskProgress(taskId, { status: 'error' });
        return;
      }
      deezerTaskProgressService.updateTaskProgress(taskId, { spotifyPlaylistId });

      const missingTracks = await deezerService.transferTracksToSpotify(
        userId,
        playlist.tracks,
        spotifyPlaylistId,
        !!isLikes,
        (currentProgress: number, songName: string) => {
          const total = playlist.tracks.length;
          const percentage = Math.round((currentProgress / total) * 100);
          deezerTaskProgressService.updateTaskProgress(taskId, {
            status: 'transferring',
            currentSong: currentProgress,
            totalSongs: total,
            percentage: percentage,
            songName
          });
        }
      );

      console.info(`Successfully added all tracks to Spotify playlist "${spotifyPlaylistId}" for task ${taskId}.`);

      deezerTaskProgressService.updateTaskProgress(taskId, {
        status: 'completed',
        percentage: 100,
        spotifyPlaylistId: spotifyPlaylistId,
        timeTaken: (performance.now() - t0),
        missingTracks,
      });

    } catch (error) {
      console.error(`Error during file playlist processing for task ${taskId}:`, error);
      deezerTaskProgressService.updateTaskProgress(taskId, {
        status: 'error',
      });
    } finally {
      setTimeout(() => {
        deezerTaskProgressService.deleteTask(taskId);
        console.log(`Task ${taskId} (file processing) removed from store.`);
      }, 5 * 60 * 1000);
    }
  })().then(r => r);

  return c.json({ taskId }, 200);
});

export default deezerController;