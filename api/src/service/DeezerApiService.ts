import ky, { type KyInstance } from 'ky';
import { DEEZER_CLIENT_ID, DEEZER_CLIENT_SECRET, DEEZER_REDIRECT_URI } from '../config';
import type { DeezerTracks, DeezerUser } from '../types/DeezerTypes';

type Token = {
  accessToken: string;
  expiresAt: number;
};

class DeezerApiService {
  private readonly baseUrl: string = 'https://api.deezer.com/';
  private readonly redirectUri: string = DEEZER_REDIRECT_URI;
  private readonly client: KyInstance;
  private readonly accessTokens: Map<string, Token> = new Map();

  constructor() {
    this.client = ky.create({
      prefix: this.baseUrl,
      searchParams: {
        output: 'json',
        limit: 2000,
      },
    });
  }

  public async fetchPlaylist(userId: string, playlistId: string): Promise<DeezerTracks> {
    const client = this.getClientForUser(userId);
    return await client.get<DeezerTracks>(`playlist/${playlistId}/tracks`).json();
  }

  public hasAccessToken(userId: string): boolean {
    const token = this.accessTokens.get(userId);
    if (!token) {
      return false;
    }
    // expiresAt === 0 means offline_access (no expiration)
    if (token.expiresAt !== 0 && token.expiresAt < Date.now()) {
      this.accessTokens.delete(userId);
      return false;
    }
    return true;
  }

  private getClientForUser(userId: string): KyInstance {
    const token = this.accessTokens.get(userId);

    if (!token) {
      throw new Error('Access token not found for this user.');
    }

    if (token.expiresAt !== 0 && token.expiresAt < Date.now()) {
      this.accessTokens.delete(userId);
      throw new Error('Access token expired for this user.');
    }

    return this.client.extend({
      searchParams: {
        access_token: token.accessToken,
      },
    });
  }

  public computeLoginOauthUrl(): string {
    const perms = 'basic_access,email,offline_access,manage_library';

    const params = new URLSearchParams({
      app_id: DEEZER_CLIENT_ID,
      redirect_uri: this.redirectUri,
      perms,
    });

    return `https://connect.deezer.com/oauth/auth.php?${params.toString()}`;
  }

  public async fetchAndSetAccessToken(code: string): Promise<string> {
    const tokenResponseText = await ky
      .get('https://connect.deezer.com/oauth/access_token.php', {
        searchParams: {
          app_id: DEEZER_CLIENT_ID,
          secret: DEEZER_CLIENT_SECRET,
          code,
        },
      })
      .text();

    const tokenParams = new URLSearchParams(tokenResponseText);
    const accessToken = tokenParams.get('access_token');
    const expiresRaw = tokenParams.get('expires');

    if (!accessToken) {
      throw new Error(`Failed to get Deezer access token: ${tokenResponseText}`);
    }

    const expiresInSeconds = expiresRaw ? parseInt(expiresRaw, 10) : 0;
    const expiresAt = expiresInSeconds === 0 ? 0 : Date.now() + expiresInSeconds * 1000;

    const user = await this.client
      .get('user/me', {
        searchParams: {
          access_token: accessToken,
        },
      })
      .json<DeezerUser>();

    const userId = String(user.id);

    this.accessTokens.set(userId, {
      accessToken,
      expiresAt,
    });

    return userId;
  }
}

const deezerApiService = new DeezerApiService();
export default deezerApiService;
