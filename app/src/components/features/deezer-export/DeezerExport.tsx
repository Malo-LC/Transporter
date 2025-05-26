import { DeezerStartExport } from '@api/deezer/data/DeezerApiTypes';
import DeezerApi from '@api/deezer/DeezerApi';
import TransferProgressDisplay from '@components/features/deezer-export/TransferProgressDisplay';
import { ActionButton } from '@components/theme/action/Actions';
import InputText from '@components/theme/form/fields/InputText';
import useMessages, { Messages } from '@i18n/hooks/messagesHook';
import useLoader, { LoaderState } from '@lib/plume-http-react-hook-loader/promiseLoaderHook';
import useNotification from '@lib/plume-notification/NotificationHook';
import { Checkbox } from '@mui/material';
import { getGlobalInstance } from 'plume-ts-di';
import { useForm, UseFormReturn } from 'react-hook-form';
import { FormContainer } from 'react-hook-form-mui';
import CustomFileInput from '../../theme/form/fields/CustomFileInput';
import scss from './deezer-export.module.scss';
import { useExportProgress } from './useExportProgress';

export type FormValues = {
  file: File | undefined,
  playlistUrl: string,
  playlistName: string,
  isLikes: boolean,
  description?: string,
  isPublic?: boolean,
};

// ProgressData type is now imported from useExportProgress

export function DeezerExport() {
  const deezerApi: DeezerApi = getGlobalInstance(DeezerApi);

  const { messages }: Messages = useMessages();
  const { notifyHttpError, notifyError } = useNotification();
  const loader: LoaderState = useLoader();

  const formContext: UseFormReturn<FormValues> = useForm<FormValues>();

  const {
    transferProgress,
    startWebSocketConnection,
    closeWebSocket,
  } = useExportProgress();

  const onSubmit = (data: FormValues) => {
    const { file, playlistUrl } = data;

    // Ensure that the WebSocket is closed before starting a new transfer
    closeWebSocket();

    if (file) {
      loader.monitor(
        deezerApi
          .exportByFile(data)
          .then((response: DeezerStartExport) => {
            startWebSocketConnection(response.taskId);
          })
          .catch(notifyHttpError),
      );
    } else if (playlistUrl) {
      loader.monitor(
        deezerApi
          .exportByPlaylistId(data)
          .then((response: DeezerStartExport) => {
            startWebSocketConnection(response.taskId);
          })
          .catch(notifyHttpError),
      );
    } else {
      notifyError(messages.deezer.chooseExportMethod);
    }
  };

  return (
    <div className={scss.deezerExport}>
      <h2>{messages.deezer.title}</h2>
      <div>{messages.deezer.chooseExportMethod}</div>
      <div>{messages.deezer.description}</div>
      <a href={messages.deezer.exportSite} target="_blank" rel="noopener noreferrer">
        {messages.deezer.exportSite}
      </a>
      <FormContainer formContext={formContext} onSuccess={onSubmit}>
        <CustomFileInput
          setValue={(value: File | undefined) => formContext.setValue('file', value)}
          value={formContext.watch('file')}
        />
        <div className={scss.deezerExportUrl}>{messages.deezer.exportByUrl}</div>
        <InputText
          name="playlistUrl"
          label={messages.deezer.playlistUrl}
          disabled={!!formContext.watch('file')}
        />
        <InputText
          name="playlistName"
          label={messages.deezer.playlistName}
          rules={{
            required: messages.error.field.required,
          }}
        />
        <div>
          <label htmlFor="isLikesCheckbox">{messages.deezer.isLikes}</label>
          <Checkbox
            name="isLikes"
            id="isLikesCheckbox"
          />
        </div>
        <ActionButton
          disabled={
            loader.isLoading
            || (transferProgress?.status === 'pending' || transferProgress?.status === 'transferring')
          }
        >
          {
            loader.isLoading || (transferProgress?.status === 'pending' || transferProgress?.status === 'transferring')
              ? messages.deezer.exporting // Make sure this key exists
              : messages.deezer.export
          }
        </ActionButton>
        <TransferProgressDisplay
          transferProgress={transferProgress}
          isLikes={formContext.watch('isLikes')}
        />
      </FormContainer>
    </div>
  );
}
