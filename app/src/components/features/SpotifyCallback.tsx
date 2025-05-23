import SpotifyApi from '@api/spotify/SpotifyApi';
import { Panel } from '@components/theme/panel/Panel';
import useMessages from '@i18n/hooks/messagesHook';
import useLoader, { LoaderState } from '@lib/plume-http-react-hook-loader/promiseLoaderHook';
import useNotification from '@lib/plume-notification/NotificationHook';
import { useOnComponentMounted } from '@lib/react-hooks-alias/ReactHooksAlias';
import { getGlobalInstance } from 'plume-ts-di';
import { HttpError } from 'simple-http-rest-client';
import { ROUTE_HOME, routes } from '../../router/RouterDefinition';

type Props = {
  code: string | undefined,
  error: string | undefined,
};

export default function SpotifyCallback({ code, error }: Readonly<Props>) {
  const spotifyApi: SpotifyApi = getGlobalInstance(SpotifyApi);

  const { notifyHttpError, notifySuccess, notifyError } = useNotification();
  const { messages } = useMessages();
  const loader: LoaderState = useLoader();

  const handleCallback = () => {
    if (error) {
      notifyError(messages.spotify.error(error));
      routes[ROUTE_HOME]().push();
      return;
    }

    if (code) {
      loader.monitor(
        spotifyApi.sendCallback(code)
          .then(() => {
            notifySuccess(messages.spotify.success);
            routes[ROUTE_HOME]().push();
          })
          .catch((err: HttpError) => {
            notifyHttpError(err);
            routes[ROUTE_HOME]().push();
          }),
      );
    } else {
      notifyError(messages.spotify.noCode);
      routes[ROUTE_HOME]().push();
    }
  };

  useOnComponentMounted(handleCallback);

  return (
    <Panel>
      <p>
        {messages.spotify.callback}
      </p>
    </Panel>
  );
}
