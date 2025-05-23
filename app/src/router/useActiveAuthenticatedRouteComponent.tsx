import Home from '@components/features/Home';
import SpotifyCallback from '@components/features/SpotifyCallback';
import { JSX, useMemo } from 'react';
import { ROUTE_HOME, SPOTIFY_CALLBACK, useRoute, UseRoute } from './RouterDefinition';

export default function useActiveAuthenticatedRouteComponent(): JSX.Element | null {
  const route: UseRoute = useRoute();

  return useMemo(() => {
    if (route.name === ROUTE_HOME) {
      return <Home />;
    }
    if (route.name === SPOTIFY_CALLBACK) {
      return <SpotifyCallback code={route.params.code} error={route.params.error} />;
    }
    return null;
  }, [route.name]);
}
