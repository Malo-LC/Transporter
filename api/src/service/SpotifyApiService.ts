import ky, { type KyInstance } from 'ky';
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } from '../config';
import {
  AddItemsToPlaylistResponse,
  SpotifyPlaylist,
  SpotifyRefreshToken,
  SpotifySearchResponse,
  SpotifyUser
} from '../types/SpotifyTypes';

type Token = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class SpotifyApiService {
  private readonly baseUrl: string = 'https://api.spotify.com/v1/';
  private readonly redirectUri: string = SPOTIFY_REDIRECT_URI;
  private readonly client: KyInstance;
  private readonly accessTokens: Map<string, Token> = new Map();

  constructor() {
    this.client = ky.create({
      prefixUrl: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  public async createPlaylist(
    userId: string,
    name: string,
    description: string = '',
    isPublic: boolean = true,
  ): Promise<SpotifyPlaylist> {
    const client = await this.getClientForUser(userId);

    const playlistData = {
      name,
      description,
      public: isPublic,
    };

    return client
      .post(`users/${userId}/playlists`, { json: playlistData })
      .json<SpotifyPlaylist>();
  }

  public async addSongsToPlaylist(
    userId: string,
    playlistId: string,
    trackUris: string[],
  ): Promise<AddItemsToPlaylistResponse> {
    const client = await this.getClientForUser(userId);

    if (!trackUris || trackUris.length === 0) {
      throw new Error('Aucun URI de piste fourni pour ajouter à la playlist.');
    }

    if (trackUris.length > 100) {
      throw new Error('Tentative d\'ajout de plus de 100 pistes à la fois. L\'API Spotify pourrait rejeter la requête ou ne traiter que les 100 premières. Envisagez de diviser la requête.');
    }

    const data = {
      uris: trackUris,
    };

    return client
      .post(`playlists/${playlistId}/tracks`, { json: data })
      .json<AddItemsToPlaylistResponse>();
  }

  public async searchTrack(
    userId: string,
    songName: string,
    artistName: string,
    albumName?: string,
  ): Promise<SpotifySearchResponse> {
    const client = await this.getClientForUser(userId);
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
      limit: '1',
    });

    return client
      .get('search', { searchParams })
      .json<SpotifySearchResponse>();
  }

  public async addItemsToLikedTracks(
    userId: string,
    trackUris: string[],
  ): Promise<AddItemsToPlaylistResponse> {
    const client = await this.getClientForUser(userId);

    if (!trackUris || trackUris.length === 0) {
      throw new Error('Aucun URI de piste fourni pour ajouter à la playlist.');
    }

    if (trackUris.length > 50) {
      throw new Error('Tentative d\'ajout de plus de 50 pistes à la fois. L\'API Spotify pourrait rejeter la requête ou ne traiter que les 50 premières. Envisagez de diviser la requête.');
    }

    const data = {
      ids: trackUris,
    };

    return client
      .put('me/tracks', { json: data })
      .json<AddItemsToPlaylistResponse>();
  }

  // Token management

  public hasAccessToken(userId: string): boolean {
    return this.accessTokens.has(userId);
  }

  private async getClientForUser(userId: string): Promise<KyInstance> {
    const token = this.accessTokens.get(userId);

    if (!token) {
      throw new Error('Access token not found for this user.');
    }

    if (token.expiresAt < Date.now()) {
      const newToken = await this.refreshAccessToken(token.refreshToken);
      this.accessTokens.set(userId, newToken);
      return this.getClientForUser(userId);
    }

    return this.client.extend({
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
      },
    });
  }

  public computeLoginOauthUrl(): string {
    const scope = 'playlist-modify-public playlist-modify-private user-read-private user-read-email user-library-modify';
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

  public async fetchAndSetAccessToken(code: string): Promise<string> {
    const basicAuth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const tokenResponse = await ky.post<SpotifyRefreshToken>('https://accounts.spotify.com/api/token', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`,
      },
      searchParams: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
      }
    }).json();

    // Temporarily use the new token to fetch user ID
    const tempClient = this.client.extend({
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token}`,
      },
    });

    const user = await tempClient.get('me').json<SpotifyUser>();

    this.accessTokens.set(user.id, {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    });

    return user.id;
  }

  public async refreshAccessToken(refreshToken: string): Promise<Token> {
    const tokenResponse = await ky.post<SpotifyRefreshToken>('https://accounts.spotify.com/api/token', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      searchParams: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID,
      }
    }).json();

    return {
      accessToken: tokenResponse.access_token,
      expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      refreshToken: tokenResponse.refresh_token,
    };
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

const spotifyApiService = new SpotifyApiService();

export default spotifyApiService;
