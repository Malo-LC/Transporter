import { TrackData } from '../types/DeezerTypes';
import spotifyApiService from './SpotifyApiService';
import deezerTaskProgressService from '../service/DeezerTaskProgressService';
import deezerService from './DeezerService';

class SpotifyService {
  /**
   * Helper function to add tracks to Spotify, either to a playlist or liked songs.
   * @param userId The ID of the Spotify user.
   * @param playlistId The ID of the Spotify playlist or 'Liked Tracks' identifier.
   * @param uris An array of Spotify track URIs or IDs.
   * @param isLikes True if adding to liked songs, false if to a specific playlist.
   */
  public async addTracksToSpotify(userId: string, playlistId: string, uris: string[], isLikes: boolean) {
    if (isLikes) {
      await spotifyApiService.addItemsToLikedTracks(userId, uris);
    } else {
      await spotifyApiService.addSongsToPlaylist(userId, playlistId, uris);
    }
    console.info(`Added ${uris.length} tracks to Spotify playlist ${isLikes ? 'Liked Songs' : playlistId}.`);
  }

  /**
   * Create Spotify playlist or use liked songs
   */
  public async createOrGetSpotifyPlaylist(
    userId: string,
    name: string | undefined,
    isLikes: boolean,
    description?: string,
    isPublic?: boolean
  ): Promise<string | null> {
    if (isLikes) {
      return 'Liked Tracks'; // Special identifier for liked tracks
    } else if (name) {
      const newSpotifyPlaylist = await spotifyApiService.createPlaylist(userId, name, description, isPublic);
      console.info(`Created Spotify playlist "${newSpotifyPlaylist.id}".`);
      return newSpotifyPlaylist.id;
    }
    return null;
  }

  public async processPlaylistTransfer(
    taskId: string,
    userId: string,
    name: string | undefined,
    isLikes: boolean,
    description: string | undefined,
    isPublic: boolean,
    deezerTracks: TrackData[],
    t0: number
  ) {
    try {
      deezerTaskProgressService.updateTaskProgress(taskId, {
        totalSongs: deezerTracks.length,
      });

      const spotifyPlaylistId = await this.createOrGetSpotifyPlaylist(userId, name, isLikes, description, isPublic);

      if (!spotifyPlaylistId) {
        deezerTaskProgressService.updateTaskProgress(taskId, { status: 'error' });
        return;
      }
      deezerTaskProgressService.updateTaskProgress(taskId, { spotifyPlaylistId });

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
      console.error(`Error during playlist processing for task ${taskId}:`, error);
      deezerTaskProgressService.updateTaskProgress(taskId, {
        status: 'error',
      });
    } finally {
      setTimeout(() => {
        deezerTaskProgressService.deleteTask(taskId);
      }, 5 * 60 * 1000);
    }
  }

}

const spotifyService = new SpotifyService();

export default spotifyService;