import ky, { KyInstance } from 'ky';
import { DeezerTracks } from '../types/DeezerTypes';

class DeezerApiService {
  private readonly client: KyInstance;

  constructor() {
    this.client = ky.create({
      prefixUrl: 'https://api.deezer.com/',
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

const deezerApiService = new DeezerApiService();
export default deezerApiService;
