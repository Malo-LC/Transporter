import ky, { type KyInstance } from 'ky';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '../config';
import { AddItemsToPlaylistResponse, SpotifyPlaylist, SpotifyRefreshToken, SpotifySearchResponse, SpotifyUser } from '../types/SpotifyTypes';

export class SpotifyApiService {
  private readonly baseUrl: string = 'https://api.spotify.com/v1/';
  private readonly redirectUri: string = 'http://127.0.0.1:3000/spotify/callback';
  private readonly client: KyInstance;
  private accessToken: string | undefined;

  constructor() {
    this.client = ky.create({
      prefixUrl: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      hooks: {
        beforeRequest: [
          (request) => {
            if (this.accessToken) {
              request.headers.set('Authorization', `Bearer ${this.accessToken}`);
            }
          }
        ],
      }
    });
  }

  private async getCurrentUserId(): Promise<string> {
    const user = await this.client.get('me').json<SpotifyUser>();
    return user.id;
  }

  public async createPlaylist(
    name: string,
    description: string = '',
    isPublic: boolean = true,
  ): Promise<SpotifyPlaylist> {
    const userId = await this.getCurrentUserId();

    const playlistData = {
      name,
      description,
      public: isPublic,
    };

    return await this.client
      .post(`users/${userId}/playlists`, { json: playlistData })
      .json<SpotifyPlaylist>();
  }

  public async addSongsToPlaylist(
    playlistId: string,
    trackUris: string[], // Tableau d'URI de pistes Spotify, ex: "spotify:track:xxxx"
  ): Promise<AddItemsToPlaylistResponse> {
    if (!playlistId) {
      throw new Error('L\'ID de la playlist est requis.');
    }
    if (!trackUris || trackUris.length === 0) {
      throw new Error('Aucun URI de piste fourni pour ajouter à la playlist.');
    }

    // L'API Spotify a une limite (généralement 100) pour le nombre de pistes par requête
    if (trackUris.length > 100) {
      console.warn('Tentative d\'ajout de plus de 100 pistes à la fois. L\'API Spotify pourrait rejeter la requête ou ne traiter que les 100 premières. Envisagez de diviser la requête.');
      // Pour une implémentation robuste, vous devriez gérer la pagination ici.
    }

    const data = {
      uris: trackUris,
    };

    return await this.client
      .post(`playlists/${playlistId}/tracks`, { json: data })
      .json<AddItemsToPlaylistResponse>();
  }

  public async searchTrack(
    songName: string,
    artistName: string,
    albumName: string,
  ): Promise<SpotifySearchResponse> {
    let query = `track:${songName.trim()}`;
    if (artistName) {
      query += ` artist:${artistName.trim()}`;
    }
    if (albumName) {
      query += ` album:${albumName.trim()}`;
    }

    const searchParams = new URLSearchParams({
      q: query,
      type: 'track',
      market: 'FR',
      limit: '1',
    });

    return await this.client
      .get('search', { searchParams })
      .json<SpotifySearchResponse>();
  }

  public computeLoginOauthUrl(): string {
    const scope = 'playlist-modify-public playlist-modify-private user-read-private user-read-email';
    const state = this.generateRandomString(16);
    const responseType = 'code';

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      redirect_uri: this.redirectUri,
      scope,
      response_type: responseType,
      state: state,
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  public async fetchAccessToken(code: string, _state: string) {
    const response = await ky.post<SpotifyRefreshToken>('https://accounts.spotify.com/api/token', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
      },
      searchParams: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }
    }).json();
    this.accessToken = response.access_token;
    return response;
  }

  // TODO: move to utils
  private generateRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}
