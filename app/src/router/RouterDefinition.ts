import { createRouter, defineRoute, param } from 'type-route';

export const SPOTIFY_CALLBACK: 'spotify' = 'spotify'; // NOSONARR
export const DEEZER_CALLBACK: 'deezer' = 'deezer'; // NOSONARR
export const ROUTE_HOME: 'home' = 'home'; // NOSONARR

export const { RouteProvider, useRoute, routes } = createRouter(
  {
    scrollToTop: true,
  },
  {
    [ROUTE_HOME]: defineRoute('/'),
    [SPOTIFY_CALLBACK]: defineRoute(
      {
        code: param.query.optional.string,
        error: param.query.optional.string,
      },
      () => '/spotify/callback',
    ),
    [DEEZER_CALLBACK]: defineRoute(
      {
        code: param.query.optional.string,
        error: param.query.optional.string,
      },
      () => '/deezer/callback',
    ),
  },
);

export type UseRoute = ReturnType<typeof useRoute>;

export type DeclaredRoutePaths = keyof typeof routes;
