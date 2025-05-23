import { HttpMethod } from 'simple-http-request-builder';
import ApiHttpClient from '../ApiHttpClient';

export default class DeezerApi {
  constructor(private readonly httpClient: ApiHttpClient) {
  }

  exportByPlaylistId(playlistId: string) {
    return this
      .httpClient
      .restRequest<string>(HttpMethod.GET, `/deezer/playlists/${playlistId}/to-spotify`)
      .queryParams([['playlistId', playlistId]])
      .execute();
  }

  exportByFile(file: File) {
    return this
      .httpClient
      .multipartRequest<string>(HttpMethod.POST, '/deezer/file')
      .file(file)
      .execute();
  }
}
