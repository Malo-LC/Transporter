import spotifyApiService from './SpotifyApiService';

class SpotifyService {
  /**
   * Helper function to add tracks to Spotify, either to a playlist or liked songs.
   * @param playlistId The ID of the Spotify playlist or 'Liked Tracks' identifier.
   * @param uris An array of Spotify track URIs or IDs.
   * @param isLikes True if adding to liked songs, false if to a specific playlist.
   */
  public async addTracksToSpotify(playlistId: string, uris: string[], isLikes: boolean) {
    if (isLikes) {
      await spotifyApiService.addItemsToLikedTracks(uris);
    } else {
      await spotifyApiService.addSongsToPlaylist(playlistId, uris);
    }
    console.info(`Added ${uris.length} tracks to Spotify playlist ${isLikes ? 'Liked Songs' : playlistId}.`);
  }


  /**
   * Create Spotify playlist or use liked songs
   */
  public async createOrGetSpotifyPlaylist(
    name: string | undefined,
    isLikes: boolean,
    description?: string,
    isPublic?: boolean
  ): Promise<string | null> {
    if (isLikes) {
      return 'Liked Tracks'; // Special identifier for liked tracks
    } else if (name) {
      const newSpotifyPlaylist = await spotifyApiService.createPlaylist(name, description, isPublic);
      console.info(`Created Spotify playlist "${newSpotifyPlaylist.id}".`);
      return newSpotifyPlaylist.id;
    }
    return null;
  }
}

const spotifyService = new SpotifyService();

export default spotifyService;