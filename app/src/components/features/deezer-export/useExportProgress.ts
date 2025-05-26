import DeezerApi from '@api/deezer/DeezerApi'; // Assuming DeezerApi is exported from this path
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
  message?: string, // For messages like "WebSocket connection established"
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
        console.log(`Closing WebSocket connection: ${reason}`);
        wsRef.current.close(code, reason);
        wsRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    // Cleanup WebSocket connection when hook is unmounted (e.g., component unmounts)
    return () => {
      closeWebSocket(1000, 'Component unmounted');
    };
  }, [closeWebSocket]);

  const startWebSocketConnection: (taskId: string) => void = useCallback((taskId: string) => {
    // Close any existing WebSocket connection before starting a new one
    closeWebSocket(1000, 'New transfer initiated');
    setTransferProgress(null); // Clear previous progress

    setTransferProgress({
      status: 'pending',
      percentage: 0,
      currentSong: 0,
      totalSongs: 0,
    });

    const ws: WebSocket = deezerApi.getExportProgressWebSocket(taskId);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocket] Connection opened for task:', taskId);
      setTransferProgress((prev: ProgressData | null) => ({
        ...(prev as ProgressData), // Cast prev because it might be null initially but we are setting it
        message: 'WebSocket connection established, awaiting progress...',
        status: 'pending', // Ensure status is pending
      }));
    };

    ws.onmessage = (event: MessageEvent<string>) => {
      try {
        const progressData: ProgressData = JSON.parse(event.data);
        console.log('[WebSocket] Received message:', progressData);
        setTransferProgress(progressData);

        if (progressData.status === 'completed') {
          if (progressData.spotifyPlaylistId) {
            notifySuccess(`${messages.deezer.success} New playlist ID: ${progressData.spotifyPlaylistId}`);
          } else {
            notifySuccess(messages.deezer.success);
          }
          closeWebSocket(1000, 'Transfer completed by server');
        } else if (progressData.status === 'error') {
          notifyError('messages.deezer.transferError'); // Use a generic or specific error message key
          closeWebSocket(1000, 'Transfer failed by server');
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message data:', error);
        notifyError('messages.deezer.transferError'); // Or a more specific parsing error message
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
      notifyError('messages.deezer.transferError');
      setTransferProgress({
        status: 'error',
        percentage: 0,
        currentSong: 0,
        totalSongs: 0,
      });
      closeWebSocket(1000, 'WebSocket error'); // Ensure WebSocket is closed on error
    };

    ws.onclose = (event: CloseEvent) => {
      console.log(`[WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
      // Ensure wsRef.current is nulled out only if it's the same WebSocket instance
      // This check is important if a new connection was rapidly started causing an old onclose to fire
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      // Optionally, update progress state if the closure was unexpected
      // and not already handled by 'completed' or 'error' status.
      // For example, if status is still 'pending' or 'transferring', it might indicate an abrupt closure.
      setTransferProgress((prev: ProgressData | null) => {
        if (prev && prev.status !== 'completed' && prev.status !== 'error') {
          return {
            ...prev, status: 'error', message: `Connection closed unexpectedly: ${event.reason || 'Unknown reason'}`,
          };
        }
        return prev;
      });
    };
  }, [deezerApi, notifySuccess, notifyError, messages, closeWebSocket]);

  return {
    transferProgress,
    startWebSocketConnection,
    closeWebSocket, // Expose closeWebSocket if manual closure is needed from component
  };
}
