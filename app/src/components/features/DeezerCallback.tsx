import DeezerApi from '@api/deezer/DeezerApi';
import Panel from '@components/theme/panel/Panel';
import useMessages from '@i18n/hooks/messagesHook';
import useLoader, { type LoaderState } from '@lib/plume-http-react-hook-loader/promiseLoaderHook';
import useNotification from '@lib/plume-notification/NotificationHook';
import { useOnComponentMounted } from '@lib/react-hooks-alias/ReactHooksAlias';
import { getGlobalInstance } from 'plume-ts-di';
import type { HttpError } from 'simple-http-rest-client';
import { ROUTE_HOME, routes } from '../../router/RouterDefinition';

type Props = {
  code: string | undefined;
  error: string | undefined;
};

export default function DeezerCallback({ code, error }: Readonly<Props>) {
  const deezerApi: DeezerApi = getGlobalInstance(DeezerApi);

  const { notifyHttpError, notifySuccess, notifyError } = useNotification();
  const { messages } = useMessages();
  const loader: LoaderState = useLoader();

  const handleCallback = () => {
    if (error) {
      notifyError(messages.deezer.error(error));
      routes[ROUTE_HOME]().push();
      return;
    }

    if (code) {
      loader.monitor(
        deezerApi
          .sendCallback(code)
          .then(() => {
            notifySuccess(messages.deezer.authSuccess);
            routes[ROUTE_HOME]().push();
          })
          .catch((err: HttpError) => {
            notifyHttpError(err);
            routes[ROUTE_HOME]().push();
          }),
      );
    } else {
      notifyError(messages.deezer.noCode);
      routes[ROUTE_HOME]().push();
    }
  };

  useOnComponentMounted(handleCallback);

  return (
    <Panel>
      <p>{messages.deezer.callback}</p>
    </Panel>
  );
}
