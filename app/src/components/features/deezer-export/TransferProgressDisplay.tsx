import useMessages, { Messages } from '@i18n/hooks/messagesHook';
import { LinearProgress } from '@mui/material';
import scss from './deezer-export.module.scss';
import { ProgressData } from './useExportProgress';

interface TransferProgressDisplayProps {
  transferProgress: ProgressData | null,
  isLikes: boolean,
}

export default function TransferProgressDisplay(
  {
    transferProgress,
    isLikes,
  }: Readonly<TransferProgressDisplayProps>,
) {
  const { messages }: Messages = useMessages();

  if (!transferProgress) {
    return null;
  }

  return (
    <div className={scss.transferProgress}>
      {
        transferProgress.status === 'transferring' && (
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
        transferProgress.status === 'completed' && (
          <>
            <span>{messages.deezer.success}</span>
            {
              (transferProgress.spotifyPlaylistId || isLikes) && (
                <a
                  href={
                    isLikes
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
        transferProgress.status === 'error' && (
          <p style={{ color: 'red' }}>
            Transfer failed.
          </p>
        )
      }
      {
        (transferProgress.missingTracks ?? []).length > 0 && (
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
  );
}
