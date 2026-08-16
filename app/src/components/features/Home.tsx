import type { DeezerAuth } from '@api/deezer/data/DeezerApiTypes';
import DeezerApi from '@api/deezer/DeezerApi';
import type { SpotifyAuth } from '@api/spotify/data/SpotifyTypes';
import SpotifyApi from '@api/spotify/SpotifyApi';
import useMessages, { type Messages } from '@i18n/hooks/messagesHook';
import useLoader, { type LoaderState } from '@lib/plume-http-react-hook-loader/promiseLoaderHook';
import useNotification from '@lib/plume-notification/NotificationHook';
import { useOnComponentMounted } from '@lib/react-hooks-alias/ReactHooksAlias';
import { CircularProgress } from '@mui/material';
import { getGlobalInstance } from 'plume-ts-di';
import { useState } from 'react';
import type { HttpError } from 'simple-http-rest-client';
import usePlumeTheme, { type PlumeAdminThemeComponents } from '../hooks/ThemeHook';
import { DeezerExport } from './deezer-export/DeezerExport';
import scss from './home.module.scss';

export default function Home() {
  const spotifyApi: SpotifyApi = getGlobalInstance(SpotifyApi);
  const deezerApi: DeezerApi = getGlobalInstance(DeezerApi);

  const { messages }: Messages = useMessages();
  const { notifyHttpError } = useNotification();
  const loader: LoaderState = useLoader();
  const { panel: Panel, actionButton: Button }: PlumeAdminThemeComponents = usePlumeTheme();

  const [isSpotifyAuthenticated, setIsSpotifyAuthenticated] = useState<boolean>(false);
  const [spotifyUserId, setSpotifyUserId] = useState<string | undefined>(undefined);
  const [isDeezerAuthenticated, setIsDeezerAuthenticated] = useState<boolean>(false);
  const [deezerUserId, setDeezerUserId] = useState<string | undefined>(undefined);

  const loginToSpotify = async () => {
    spotifyApi
      .login()
      .then((url: string) => {
        window.location.href = url;
      })
      .catch(notifyHttpError);
  };

  const loginToDeezer = async () => {
    deezerApi
      .login()
      .then((url: string) => {
        window.location.href = url;
      })
      .catch(notifyHttpError);
  };

  const fetchAuthStatus = () => {
    loader.monitor(
      Promise.all([spotifyApi.fetchMe(), deezerApi.fetchMe()])
        .then(([spotifyResponse, deezerResponse]: [SpotifyAuth, DeezerAuth]) => {
          setIsSpotifyAuthenticated(spotifyResponse.isAuthenticated);
          setSpotifyUserId(spotifyResponse.userId);
          setIsDeezerAuthenticated(deezerResponse.isAuthenticated);
          setDeezerUserId(deezerResponse.userId);
        })
        .catch((error: HttpError) => {
          notifyHttpError(error);
          setIsSpotifyAuthenticated(false);
          setIsDeezerAuthenticated(false);
        }),
    );
  };

  useOnComponentMounted(fetchAuthStatus);

  const canExport = isSpotifyAuthenticated && isDeezerAuthenticated;

  return (
    <Panel>
      <div className={scss.home}>
        {loader.isLoading ? (
          <CircularProgress />
        ) : (
          <>
            <h1>{messages.home.title}</h1>
            <div>{messages.home.description}</div>
            {isSpotifyAuthenticated ? (
              <p className={scss.homeConnected}>{messages.spotify.connectedAs(spotifyUserId)}</p>
            ) : (
              <Button onClick={loginToSpotify}>{messages.home.loginToSpotify}</Button>
            )}
            {isDeezerAuthenticated ? (
              <p className={scss.homeConnected}>{messages.deezer.connectedAs(deezerUserId)}</p>
            ) : (
              <Button onClick={loginToDeezer}>{messages.home.loginToDeezer}</Button>
            )}
          </>
        )}
        {canExport && <DeezerExport />}
      </div>
    </Panel>
  );
}
