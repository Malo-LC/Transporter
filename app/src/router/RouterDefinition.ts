import { createRouter, defineRoute } from 'type-route';

export const LOGIN: 'login' = 'login'; // NOSONARR
export const ROUTE_HOME: 'home' = 'home'; // NOSONARR

export const { RouteProvider, useRoute, routes } = createRouter(
  {
    scrollToTop: true,
  },
  {
    [LOGIN]: defineRoute('/login'),
    [ROUTE_HOME]: defineRoute('/'),
  },
);

export type UseRoute = ReturnType<typeof useRoute>;

export type DeclaredRoutePaths = keyof typeof routes;
