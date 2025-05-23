import Layout from '@components/layout/Layout';
import { JSX } from 'react';
import useActiveAuthenticatedRouteComponent from './useActiveAuthenticatedRouteComponent';

export default function Router() {
  const activeAuthenticatedRouteComponent: JSX.Element | null = useActiveAuthenticatedRouteComponent();

  if (activeAuthenticatedRouteComponent) {
    return (
      <Layout>
        {activeAuthenticatedRouteComponent}
      </Layout>
    );
  }

  return <></>;
}
