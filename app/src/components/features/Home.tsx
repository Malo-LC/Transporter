import { SpotifyAuth } from '@api/spotify/data/SpotifyTypes';
import SpotifyApi from '@api/spotify/SpotifyApi';
import useMessages, { Messages } from '@i18n/hooks/messagesHook';
import useLoader, { LoaderState } from '@lib/plume-http-react-hook-loader/promiseLoaderHook';
import useNotification from '@lib/plume-notification/NotificationHook';
import { useOnComponentMounted } from '@lib/react-hooks-alias/ReactHooksAlias';
import { CircularProgress } from '@mui/material';
import { getGlobalInstance } from 'plume-ts-di';
import { useState } from 'react';
import { HttpError } from 'simple-http-rest-client';
import usePlumeTheme, { PlumeAdminThemeComponents } from '../hooks/ThemeHook';
import { DeezerExport } from './deezer-export/DeezerExport';
import scss from './home.module.scss';

export default function Home() {
  const spotifyApi: SpotifyApi = getGlobalInstance(SpotifyApi);

  const { messages }: Messages = useMessages();
  const { notifyHttpError } = useNotification();
  const loader: LoaderState = useLoader();
  const { panel: Panel, panelTitle: PanelTitle, actionButton: Button }: PlumeAdminThemeComponents = usePlumeTheme();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const loginToSpotify = async () => {
    spotifyApi.login()
      .then((url: string) => {
        window.location.href = url;
      })
      .catch(notifyHttpError);
  };

  const fetchMe = () => {
    loader.monitor(
      spotifyApi.fetchMe()
        .then((response: SpotifyAuth) => {
          setIsAuthenticated(response.isAuthenticated);
          setUserId(response.userId);
        })
        .catch((error: HttpError) => {
          notifyHttpError(error);
          setIsAuthenticated(false);
        }),
    );
  };

  useOnComponentMounted(fetchMe);

  return (
    <Panel>
      <PanelTitle>{messages.home.title}</PanelTitle>
      <div className={scss.home}>
        {
          loader.isLoading
            ? (
              <CircularProgress />
            )
            : (
              <div>
                {
                  isAuthenticated
                    ? (
                      <p>{messages.spotify.connectedAs(userId)}</p>
                    )
                    : (
                      <Button onClick={loginToSpotify}>
                        {messages.home.loginToSpotify}
                      </Button>
                    )
                }
              </div>
            )
        }
        {
          isAuthenticated
          && (
            <DeezerExport />
          )
        }
      </div>
    </Panel>
  );
}
