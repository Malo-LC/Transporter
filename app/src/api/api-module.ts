import DeezerApi from '@api/deezer/DeezerApi';
import SessionApi from '@api/session/SessionApi';
import SpotifyApi from '@api/spotify/SpotifyApi';
import PlumeAdminHttpClient from '@lib/plume-admin-api/PlumeHttpClient';
import { Injector } from 'plume-ts-di';
import ApiHttpClient from './ApiHttpClient';
import ApiHttpClientAuthenticated from './ApiHttpClientAuthenticated';

export default function installApiModule(injector: Injector) {
  injector.registerSingleton(ApiHttpClient);
  injector.registerSingleton(ApiHttpClientAuthenticated);
  injector.registerSingleton(ApiHttpClientAuthenticated, PlumeAdminHttpClient);
  injector.registerSingleton(SessionApi);
  injector.registerSingleton(SpotifyApi);
  injector.registerSingleton(DeezerApi);
}
