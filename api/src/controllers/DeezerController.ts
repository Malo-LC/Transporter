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

// --- WebSocket Management Functions ---
// Exported to be called from index.ts
const registerWebSocketForTask = (taskId: string, ws: WebSocket) => {
  let task = taskProgressStore.get(taskId);

  if (!task) {
    console.warn(`[WebSocket] Task ${taskId} not found when registering client.`);

    task = {
      status: 'pending',
      percentage: 0,
      currentSong: 0,
      totalSongs: 0,
      webSocketClients: []
    };
    taskProgressStore.set(taskId, task);
  }
  task.webSocketClients.push(ws);

  // Send initial state immediately to new client if task already has progress
  if (task.status !== 'pending') {
    ws.send(JSON.stringify(task));
  }
};

const unregisterWebSocketForTask = (taskId: string, ws: WebSocket) => {
  const task = taskProgressStore.get(taskId);

  if (task) {
    task.webSocketClients = task.webSocketClients.filter(client => client !== ws);
  }
};

// --- Helper function to update task progress and notify WebSocket clients ---
const updateTaskProgress = (
  taskId: string,
  data: Partial<Omit<TaskProgress, 'webSocketClients'>>
) => {
  const task = taskProgressStore.get(taskId);

  if (task) {
    const updatedTask = { ...task, ...data };
    taskProgressStore.set(taskId, updatedTask);

    // Send update to all active WebSocket clients for this task
    task.webSocketClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) { // Only send if connection is open
        try {
          client.send(JSON.stringify(updatedTask));
          console.log(`[WebSocket] Sent update for task ${taskId} to client.`);
        } catch (sendError) {
          console.error(`[WebSocket] Error sending message to client for task ${taskId}:`, sendError);
        }
      }
    });

    // If task is completed or errors, close WebSocket connections for this task
    if (updatedTask.status === 'completed' || updatedTask.status === 'error') {
      task.webSocketClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.close(1000, 'Task completed'); // 1000: Normal Closure
        }
      });
      task.webSocketClients = []; // Clear clients after closing
    }
  }
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

  taskProgressStore.set(taskId, {
    status: 'pending',
    percentage: 0,
    currentSong: 0,
    totalSongs: 0,
    webSocketClients: [], // Initialize with empty client list
  });

  // Detach the background task for Node.js
  (async () => {
    try {
      const deezerPlaylistTracks: DeezerTracks = await deezerApiService.fetchPlaylist(playlistId);

      if (!deezerPlaylistTracks.data || deezerPlaylistTracks.data.length === 0) {
        updateTaskProgress(taskId, { status: 'error' });
        return;
      }

      const deezerTracks: TrackData[] = deezerPlaylistTracks.data.map((track) => ({
        trackName: track.title,
        artistName: track.artist.name,
        albumName: track.album.title,
      }));

      updateTaskProgress(taskId, {
        totalSongs: deezerTracks.length,
      });

      const spotifyPlaylistId = await spotifyService.createOrGetSpotifyPlaylist(userId, name, isLikes, description, isPublic);

      if (!spotifyPlaylistId) {
        updateTaskProgress(taskId, { status: 'error' });
        return;
      }
      updateTaskProgress(taskId, {
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
          updateTaskProgress(taskId, {
            status: 'transferring',
            currentSong: currentProgress,
            totalSongs: total,
            percentage: percentage,
            songName
          });
        }
      );

      console.info(`Successfully added all tracks to Spotify playlist "${spotifyPlaylistId}".`);

      updateTaskProgress(taskId, {
        status: 'completed',
        percentage: 100,
        spotifyPlaylistId: spotifyPlaylistId,
        timeTaken: (performance.now() - t0),
        missingTracks,
      });

    } catch (error) {
      console.error(`Error during playlist transfer for task ${taskId}:`, error);
      updateTaskProgress(taskId, {
        status: 'error',
      });
    } finally {
      setTimeout(() => {
        taskProgressStore.delete(taskId);
        console.log(`Task ${taskId} removed from store.`);
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

  const spotifyPlaylistId = await spotifyService.createOrGetSpotifyPlaylist(userId, name, !!isLikes);

  if (!spotifyPlaylistId) {
    return c.json({ message: 'Failed to create or find Spotify playlist' }, 500);
  }

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