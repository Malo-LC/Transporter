import DeezerApi from '@api/deezer/DeezerApi';
import SpotifyApi from '@api/spotify/SpotifyApi';
import { Injector } from 'plume-ts-di';
import ApiHttpClient from './ApiHttpClient';

export default function installApiModule(injector: Injector) {
  injector.registerSingleton(ApiHttpClient);
  injector.registerSingleton(SpotifyApi);
  injector.registerSingleton(DeezerApi);
}
