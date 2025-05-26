import DeezerApi from '@api/deezer/DeezerApi';
import useMessages, { Messages } from '@i18n/hooks/messagesHook';
import useNotification from '@lib/plume-notification/NotificationHook';
import { getGlobalInstance } from 'plume-ts-di';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

export type ProgressData = {
  status: 'pending' | 'transferring' | 'completed' | 'error',
  percentage: number,
  currentSong: number,
  songName?: string,
  totalSongs: number,
  spotifyPlaylistId?: string,
  missingTracks?: string[],
  timeTaken?: string,
};

export function useExportProgress() {
  const deezerApi: DeezerApi = getGlobalInstance(DeezerApi);

  const { messages }: Messages = useMessages();
  const { notifyError, notifySuccess } = useNotification();
  const [transferProgress, setTransferProgress] = useState<ProgressData | null>(null);
  const wsRef: RefObject<WebSocket | null> = useRef<WebSocket | null>(null);

  const closeWebSocket: (code?: number, reason?: string) => void = useCallback(
    (code: number = 1000, reason: string = 'Client action') => {
      if (wsRef.current) {
        wsRef.current.close(code, reason);
        wsRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      closeWebSocket(1000, 'Component unmounted');
    };
  }, [closeWebSocket]);

  const startWebSocketConnection: (taskId: string) => void = useCallback((taskId: string) => {
    closeWebSocket(1000, 'New transfer initiated');
    setTransferProgress(null);

    setTransferProgress({
      status: 'pending',
      percentage: 0,
      currentSong: 0,
      totalSongs: 0,
    });

    const ws: WebSocket = deezerApi.getExportProgressWebSocket(taskId);
    wsRef.current = ws;

    ws.onopen = () => {
      setTransferProgress((prev: ProgressData | null) => ({
        ...(prev as ProgressData),
        status: 'pending',
      }));
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const progressData: ProgressData = JSON.parse(event.data);
        setTransferProgress(progressData);

        if (progressData.status === 'completed') {
          if (progressData.spotifyPlaylistId) {
            // TODO: Use a more specific error message if available
            notifySuccess(`${messages.deezer.success} New playlist ID: ${progressData.spotifyPlaylistId}`);
          } else {
            notifySuccess(messages.deezer.success);
          }
          closeWebSocket(1000, 'Transfer completed by server');
        } else if (progressData.status === 'error') {
          notifyError('messages.deezer.transferError'); // TODO: Use a more specific error message if available
          closeWebSocket(1000, 'Transfer failed by server');
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message data:', error);
        notifyError('messages.deezer.transferError'); // TODO: Use a more specific error message if available
        setTransferProgress({
          status: 'error',
          percentage: 0,
          currentSong: 0,
          totalSongs: 0,
        });
        closeWebSocket(1000, 'Data parsing error');
      }
    };

    ws.onerror = (errorEvent: Event) => {
      console.error('[WebSocket] Error:', errorEvent);
      notifyError('messages.deezer.transferError'); // TODO: Use a more specific error message if available
      setTransferProgress({
        status: 'error',
        percentage: 0,
        currentSong: 0,
        totalSongs: 0,
      });
      closeWebSocket(1000, 'WebSocket error');
    };

    ws.onclose = () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      setTransferProgress((prev: ProgressData | null) => {
        if (prev && prev.status !== 'completed' && prev.status !== 'error') {
          return {
            ...prev, status: 'error',
          };
        }
        return prev;
      });
    };
  }, [notifySuccess, notifyError, closeWebSocket]);

  return {
    transferProgress,
    startWebSocketConnection,
    closeWebSocket,
  };
}
