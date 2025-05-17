import ky, { KyInstance } from 'ky';
import { DeezerTracks } from '../types/DeezerApiTypes';

export class DeezerApiService {
  private readonly url: string;
  private readonly client: KyInstance;

  constructor() {
    this.url = 'https://api.deezer.com/';
    this.client = ky.create({
      prefixUrl: this.url,
      searchParams: {
        output: 'json',
        limit: 2000,
      },
    });
  }

  public async fetchPlaylist(playlistId: string): Promise<DeezerTracks> {
    return await this.client.get<DeezerTracks>(`playlist/${playlistId}/tracks`).json();
  }
}


