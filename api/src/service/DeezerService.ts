import { TrackData } from '../types/DeezerTypes';
import spotifyApiService from './SpotifyApiService';
import spotifyService from './SpotifyService';

class DeezerService {
  /**
   * Transfer tracks to Spotify playlist or liked songs
   */
  public async transferTracksToSpotify(
    userId: string,
    tracks: TrackData[],
    spotifyPlaylistId: string,
    isLikes: boolean = false,
    callBackProgress?: (progress: number, songName: string) => void
  ): Promise<string[]> {
    const spotifyUris: string[] = [];
    const missingTracks: string[] = [];
    const BATCH_SIZE = 90; // Spotify API limit is 100, so we use 90 for safety

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      let spotifyTrackId: string | null = null;

      // Attempt to search for the track on Spotify
      let searchResult = await spotifyApiService.searchTrack(userId, track.trackName, track.artistName);

      // If not found, retry by removing parenthesized content from the track title
      if (!searchResult?.tracks?.items?.length) {
        const cleanTrackName = track.trackName.replace(/\s*\(.*?\)\s*/g, '').trim();
        searchResult = await spotifyApiService.searchTrack(userId, cleanTrackName, track.artistName);
      }

      if (searchResult?.tracks?.items?.length) {
        spotifyTrackId = isLikes ? searchResult.tracks.items[0].id : searchResult.tracks.items[0].uri;
        spotifyUris.push(spotifyTrackId);
      } else {
        console.warn(`Track not found on Spotify: ${track.trackName} - ${track.artistName}.`);
        missingTracks.push(`${track.trackName} - ${track.artistName}`);
      }

      // Add tracks to Spotify in batches
      if (spotifyUris.length >= BATCH_SIZE) {
        await spotifyService.addTracksToSpotify(userId, spotifyPlaylistId, spotifyUris, isLikes);
        spotifyUris.length = 0; // Clear the array
      }

      // Log progress
      callBackProgress?.(i, `${track.trackName} - ${track.artistName}`);
    }

    // Add any remaining tracks
    if (spotifyUris.length > 0) {
      await spotifyService.addTracksToSpotify(userId, spotifyPlaylistId, spotifyUris, isLikes);
    }

    return missingTracks;
  }
}

const deezerService = new DeezerService();
export default deezerService; 