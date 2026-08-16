import DeezerCallback from '@components/features/DeezerCallback';
import Home from '@components/features/Home';
import SpotifyCallback from '@components/features/SpotifyCallback';
import { type JSX, useMemo } from 'react';
import { DEEZER_CALLBACK, ROUTE_HOME, SPOTIFY_CALLBACK, type UseRoute, useRoute } from './RouterDefinition';

export default function useActiveAuthenticatedRouteComponent(): JSX.Element | null {
  const route: UseRoute = useRoute();

  return useMemo(() => {
    if (route.name === ROUTE_HOME) {
      return <Home />;
    }
    if (route.name === SPOTIFY_CALLBACK) {
      return (
        <SpotifyCallback
          code={route.params.code}
          error={route.params.error}
        />
      );
    }
    if (route.name === DEEZER_CALLBACK) {
      return (
        <DeezerCallback
          code={route.params.code}
          error={route.params.error}
        />
      );
    }
    return null;
  }, [route.name]);
}
