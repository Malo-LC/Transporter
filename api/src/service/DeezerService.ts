import spotifyApiService from './SpotifyApiService';
import spotifyService from './SpotifyService';
import { TrackData } from '../types/DeezerTypes';

class DeezerService {
  /**
   * Transfer tracks to Spotify playlist or liked songs
   */
  public async transferTracksToSpotify(
    tracks: TrackData[],
    spotifyPlaylistId: string,
    isLikes: boolean = false
  ): Promise<string[]> {
    const spotifyUris: string[] = [];
    const missingTracks: string[] = [];
    const BATCH_SIZE = 90; // Spotify API limit is 100, so we use 90 for safety

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      let spotifyTrackId: string | null = null;

      // Attempt to search for the track on Spotify
      let searchResult = await spotifyApiService.searchTrack(track.trackName, track.artistName);

      // If not found, retry by removing parenthesized content from the track title
      if (!searchResult?.tracks?.items?.length) {
        const cleanTrackName = track.trackName.replace(/\s*\(.*?\)\s*/g, '').trim();
        searchResult = await spotifyApiService.searchTrack(cleanTrackName, track.artistName);
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
        await spotifyService.addTracksToSpotify(spotifyPlaylistId, spotifyUris, isLikes);
        spotifyUris.length = 0; // Clear the array
      }

      // Log progress
      if ((i + 1) % 10 === 0 || (i + 1) === tracks.length) {
        console.info(`Processed ${((i + 1) / tracks.length * 100).toFixed(2)}% of tracks.`);
      }
    }

    // Add any remaining tracks
    if (spotifyUris.length > 0) {
      await spotifyService.addTracksToSpotify(spotifyPlaylistId, spotifyUris, isLikes);
    }

    return missingTracks;
  }
}

const deezerService = new DeezerService();
export default deezerService; 