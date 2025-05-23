import Home from '@components/features/Home';
import { JSX, useMemo } from 'react';
import { ROUTE_HOME, useRoute, UseRoute } from './RouterDefinition';

export default function useActiveAuthenticatedRouteComponent(): JSX.Element | null {
  const route: UseRoute = useRoute();

  return useMemo(() => {
    if (route.name === ROUTE_HOME) {
      return <Home />;
    }
    return null;
  }, [route.name]);
}
