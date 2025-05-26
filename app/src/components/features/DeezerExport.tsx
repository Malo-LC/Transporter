import { DeezerStartExport } from '@api/deezer/data/DeezerApiTypes';
import DeezerApi from '@api/deezer/DeezerApi';
import { ActionButton } from '@components/theme/action/Actions';
import InputText from '@components/theme/form/fields/InputText';
import useMessages, { Messages } from '@i18n/hooks/messagesHook';
import classNames from '@lib/class-names/ClassNames';
import useLoader, { LoaderState } from '@lib/plume-http-react-hook-loader/promiseLoaderHook';
import useNotification from '@lib/plume-notification/NotificationHook';
import ClearIcon from '@mui/icons-material/Clear';
import { Checkbox, LinearProgress } from '@mui/material';
import { getGlobalInstance } from 'plume-ts-di';
import { ChangeEvent, MouseEvent, RefObject, useEffect, useRef, useState } from 'react'; // Import useEffect and useRef
import { useForm, UseFormReturn } from 'react-hook-form';
import { FormContainer } from 'react-hook-form-mui';
import scss from './deezer-export.module.scss';

export type FormValues = {
  file: File | undefined,
  playlistUrl: string,
  playlistName: string,
  isLikes: boolean,
  description?: string, // Add these if your form has them
  isPublic?: boolean, // Add these if your form has them
};

type ProgressData = {
  status: 'pending' | 'transferring' | 'completed' | 'error',
  percentage: number,
  currentSong: number,
  songName?: string,
  totalSongs: number,
  spotifyPlaylistId?: string,
  missingTracks?: string[], // Adjust type if you know missingTracks structure
  timeTaken?: string,
};

export function DeezerExport() {
  const deezerApi: DeezerApi = getGlobalInstance(DeezerApi);

  const { messages }: Messages = useMessages();
  const { notifyHttpError, notifyError, notifySuccess } = useNotification();
  const loader: LoaderState = useLoader();

  const formContext: UseFormReturn<FormValues> = useForm<FormValues>();

  const [transferProgress, setTransferProgress] = useState<ProgressData | null>(null);
  // Use useRef to hold the WebSocket instance to avoid re-creating it
  const wsRef: RefObject<WebSocket | null> = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Cleanup WebSocket connection when component unmounts
    return () => {
      if (wsRef.current) {
        console.log('Closing WebSocket connection on unmount.');
        wsRef.current.close(1000, 'Component unmounted'); // 1000: Normal Closure
        wsRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount and unmount

  const onSubmit = (data: FormValues) => {
    const { file, playlistUrl } = data;

    // Close any existing WebSocket connection before starting a new one
    if (wsRef.current) {
      wsRef.current.close(1000, 'New transfer initiated');
      wsRef.current = null;
    }
    setTransferProgress(null); // Clear previous progress

    if (file) {
      loader.monitor(
        deezerApi
          .exportByFile(data)
          .then(() => {
            notifySuccess(messages.deezer.success);
          })
          .catch(notifyHttpError),
      );
    } else if (playlistUrl) {
      loader.monitor(
        deezerApi
          .exportByPlaylistId(data) // This now gets the taskId
          .then((response: DeezerStartExport) => {
            const taskId: string = response.taskId;
            setTransferProgress({
              status: 'pending',
              percentage: 0,
              currentSong: 0,
              totalSongs: 0,
            });

            // --- WebSocket Connection ---
            const ws: WebSocket = deezerApi.getExportProgressWebSocket(taskId);
            wsRef.current = ws; // Store the WebSocket instance in the ref

            ws.onopen = () => {
              console.log('[WebSocket] Connection opened for task:', taskId);
              setTransferProgress((prev: ProgressData | null) => ({
                ...prev,
                message: 'WebSocket connection established, awaiting progress...',
              } as ProgressData));
            };

            ws.onmessage = (event: MessageEvent<string>) => {
              const progressData: ProgressData = JSON.parse(event.data);
              console.log('[WebSocket] Received message:', progressData);
              setTransferProgress(progressData);

              if (progressData.status === 'completed') {
                if (progressData.spotifyPlaylistId) {
                  notifySuccess(`${messages.deezer.success} New playlist ID: ${progressData.spotifyPlaylistId}`);
                }
                ws.close(1000, 'Transfer completed by server'); // Close after completion
              } else if (progressData.status === 'error') {
                ws.close(1000, 'Transfer failed by server'); // Close on error
              }
            };

            ws.onerror = (errorEvent: Event) => {
              console.error('[WebSocket] Error:', errorEvent);
              notifyError('messages.deezer.transferError');
              setTransferProgress({
                status: 'error',
                percentage: 0,
                currentSong: 0,
                totalSongs: 0,
              });
              ws.close(); // Close on error
            };

            ws.onclose = (event: CloseEvent) => {
              console.log(`[WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
              // Only clear wsRef if this was the current active WebSocket
              if (wsRef.current === ws) {
                wsRef.current = null;
              }
            };
            // --- End WebSocket Connection ---
          })
          .catch(notifyHttpError), // Catch errors from initiatePlaylistExport POST
      );
    } else {
      notifyError(messages.deezer.chooseExportMethod);
    }
  };

  return (
    <div className={scss.deezerExport}>
      <h2>
        {messages.deezer.title}
      </h2>
      <div>
        {messages.deezer.chooseExportMethod}
      </div>
      <div>
        {messages.deezer.description}
      </div>
      <a href={messages.deezer.exportSite} target="_blank" rel="noopener noreferrer">
        {messages.deezer.exportSite}
      </a>
      <FormContainer formContext={formContext} onSuccess={onSubmit}>
        <label
          className={classNames(
            scss.customFileUpload,
            formContext.watch('file') ? scss.customFileUploadSelected : '',
          )}
          htmlFor="file"
        >
          <span>
            {
              formContext.watch('file')
                ? formContext.watch('file')?.name
                : messages.deezer.exportByFile
            }
          </span>
          <input
            type="file"
            id="file"
            accept="text/csv"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const file: File | undefined = e.target.files?.[0] ?? undefined;
              formContext.setValue('file', file);
            }}
          />
          {
            formContext.watch('file')
            && (
              <ClearIcon
                onClick={(e: MouseEvent<SVGSVGElement>) => {
                  formContext.setValue('file', undefined);
                  e.stopPropagation();
                  e.preventDefault();
                }}
                className={scss.customFileUploadClear}
              />
            )
          }
        </label>
        <div className={scss.deezerExportUrl}>
          {messages.deezer.exportByUrl}
        </div>
        <InputText name="playlistUrl" label={messages.deezer.playlistUrl} />
        <InputText
          name="playlistName"
          label={messages.deezer.playlistName}
          rules={{
            required: 'Please enter a playlist name',
          }}
        />
        <div>
          <label>
            {messages.deezer.isLikes}
          </label>
          <Checkbox name="isLikes" />
        </div>
        <ActionButton disabled={loader.isLoading}>
          {loader.isLoading ? 'messages.deezer.exporting' : messages.deezer.export}
        </ActionButton>
        {
          transferProgress
          && (
            <div className={scss.transferProgress}>
              {
                transferProgress.status == 'transferring'
                && (
                  <>
                    <span>
                      {`${transferProgress.songName}`}
                    </span>
                    <LinearProgress
                      variant="determinate"
                      value={transferProgress.percentage}
                      sx={{ width: '100%', marginTop: '10px' }}
                    />
                    <span>
                      {`${transferProgress.currentSong} / ${transferProgress.totalSongs}`}
                    </span>
                  </>
                )
              }
              {
                transferProgress.status === 'completed'
                && (
                  <>
                    <span>{messages.deezer.success}</span>
                    {
                      (transferProgress.spotifyPlaylistId || formContext.watch('isLikes'))
                      && (
                        <a
                          href={
                            formContext.watch('isLikes')
                              ? `https://open.spotify.com/collection/tracks`
                              : `https://open.spotify.com/playlist/${transferProgress.spotifyPlaylistId}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {messages.deezer.openPlaylist}
                        </a>
                      )
                    }
                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={{ width: '100%', marginTop: '10px' }}
                    />
                  </>

                )
              }
              {
                transferProgress.status === 'error'
                && (
                  <p style={{ color: 'red' }}>Transfer failed.</p>
                )
              }
              {
                (transferProgress.missingTracks ?? []).length > 0
                && (
                  <div>
                    <h3>{messages.deezer.missingTracks}</h3>
                    <ul>
                      {
                        transferProgress.missingTracks?.map((track: string) => (
                          <li key={track}>{track}</li>
                        ))
                      }
                    </ul>
                  </div>
                )
              }
            </div>
          )
        }
      </FormContainer>
    </div>
  );
}
