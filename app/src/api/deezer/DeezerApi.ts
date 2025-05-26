import { DeezerStartExport } from '@api/deezer/data/DeezerApiTypes';
import { FormValues } from '@components/features/DeezerExport';
import { HttpMethod } from 'simple-http-request-builder';
import { HttpPromise } from 'simple-http-rest-client';
import ApiHttpClient from '../ApiHttpClient';

export default class DeezerApi {
  constructor(private readonly httpClient: ApiHttpClient) {
  }

  exportByPlaylistId(data: FormValues): HttpPromise<DeezerStartExport> {
    // This now initiates the task and gets the taskId
    return this
      .httpClient
      .restRequest<DeezerStartExport>(HttpMethod.POST, `/deezer/start-playlist-export`)
      .jsonBody({
        playlistUrl: data.playlistUrl, name: data.playlistName,
        // description: data.description,
        // public: data.isPublic,
        isLikes: data.isLikes,
      }) // Ensure all fields are sent
      .execute();
  }

  getExportProgressWebSocket(taskId: string): WebSocket {
    const protocol: string = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host: string = 'localhost:3000';
    return new WebSocket(`${protocol}//${host}/ws/export-progress/${taskId}`);
  }

  // --- End Modified for WebSocket ---

  exportByFile(data: FormValues) {
    return this
      .httpClient
      .multipartRequest<string>(HttpMethod.POST, '/deezer/file')
      .data([['file', data.file], ['name', data.playlistName]])
      .execute();
  }
}
