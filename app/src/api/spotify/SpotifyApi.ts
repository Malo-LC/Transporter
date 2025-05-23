import { SpotifyAuth } from '@api/spotify/data/SpotifyTypes';
import { HttpMethod } from 'simple-http-request-builder';
import ApiHttpClient from '../ApiHttpClient';

export default class SpotifyApi {
  constructor(private readonly httpClient: ApiHttpClient) {
  }

  login() {
    return this
      .httpClient
      .restRequest<string>(HttpMethod.GET, '/spotify/login')
      .execute();
  }

  fetchMe() {
    return this
      .httpClient
      .restRequest<SpotifyAuth>(HttpMethod.GET, '/spotify/me')
      .execute();
  }

  sendCallback(code: string) {
    return this
      .httpClient
      .restRequest<string>(HttpMethod.GET, '/spotify/callback')
      .queryParams([['code', code]])
      .execute();
  }
}
