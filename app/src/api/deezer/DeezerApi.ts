import type { DeezerAuth, DeezerStartExport } from '@api/deezer/data/DeezerApiTypes';
import type { FormValues } from '@components/features/deezer-export/DeezerExport';
import { HttpMethod } from 'simple-http-request-builder';
import type { HttpPromise } from 'simple-http-rest-client';
import type ApiHttpClient from '../ApiHttpClient';

export default class DeezerApi {
  constructor(private readonly httpClient: ApiHttpClient) {}

  login() {
    return this.httpClient.restRequest<string>(HttpMethod.GET, '/deezer/login').execute();
  }

  fetchMe() {
    return this.httpClient.restRequest<DeezerAuth>(HttpMethod.GET, '/deezer/me').execute();
  }

  sendCallback(code: string) {
    return this.httpClient
      .restRequest<string>(HttpMethod.GET, '/deezer/callback')
      .queryParams([['code', code]])
      .execute();
  }

  exportByPlaylistId(data: FormValues): HttpPromise<DeezerStartExport> {
    // This now initiates the task and gets the taskId
    return this.httpClient
      .restRequest<DeezerStartExport>(HttpMethod.POST, `/deezer/start-playlist-export`)
      .jsonBody({
        playlistUrl: data.playlistUrl,
        name: data.playlistName,
        // description: data.description,
        // public: data.isPublic,
        isLikes: data.isLikes,
      }) // Ensure all fields are sent
      .execute();
  }

  getExportProgressWebSocket(taskId: string): WebSocket {
    const protocol: string = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host: string = `${window.location.host}/api`;
    return new WebSocket(`${protocol}//${host}/ws/export-progress/${taskId}`);
  }

  // --- End Modified for WebSocket ---

  exportByFile(data: FormValues): HttpPromise<DeezerStartExport> {
    return this.httpClient
      .multipartRequest<DeezerStartExport>(HttpMethod.POST, '/deezer/file')
      .data([
        ['file', data.file],
        ['name', data.playlistName],
      ])
      .execute();
  }
}
