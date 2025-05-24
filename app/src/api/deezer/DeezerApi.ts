import { FormValues } from '@components/features/DeezerExport';
import { HttpMethod } from 'simple-http-request-builder';
import ApiHttpClient from '../ApiHttpClient';

export default class DeezerApi {
  constructor(private readonly httpClient: ApiHttpClient) {
  }

  exportByPlaylistId(data: FormValues) {
    return this
      .httpClient
      .restRequest(HttpMethod.POST, `/deezer/playlists/to-spotify`)
      .jsonBody({ playlistUrl: data.playlistUrl, name: data.playlistName })
      .execute();
  }

  exportByFile(data: FormValues) {
    return this
      .httpClient
      .multipartRequest<string>(HttpMethod.POST, '/deezer/file')
      .data([['file', data.file], ['name', data.playlistName]])
      .execute();
  }
}
