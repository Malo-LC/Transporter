import DeezerApi from '@api/deezer/DeezerApi';
import { ActionButton } from '@components/theme/action/Actions';
import InputText from '@components/theme/form/fields/InputText';
import useMessages, { Messages } from '@i18n/hooks/messagesHook';
import classNames from '@lib/class-names/ClassNames';
import useLoader, { LoaderState } from '@lib/plume-http-react-hook-loader/promiseLoaderHook';
import useNotification from '@lib/plume-notification/NotificationHook';
import ClearIcon from '@mui/icons-material/Clear';
import { Checkbox } from '@mui/material';
import { getGlobalInstance } from 'plume-ts-di';
import { ChangeEvent, MouseEvent } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { FormContainer } from 'react-hook-form-mui';
import scss from './deezer-export.module.scss';

export type FormValues = {
  file: File | undefined,
  playlistUrl: string,
  playlistName: string,
  isLikes: boolean,
};

export default function DeezerExport() {
  const deezerApi: DeezerApi = getGlobalInstance(DeezerApi);

  const { messages }: Messages = useMessages();
  const { notifyHttpError, notifyError, notifySuccess } = useNotification();
  const loader: LoaderState = useLoader();

  const formContext: UseFormReturn<FormValues> = useForm<FormValues>();

  const onSubmit = (data: FormValues) => {
    const { file, playlistUrl } = data;
    if (file) {
      loader.monitor(
        deezerApi
          .exportByFile(data)
          // TODO: recupérer l'ID de la playlist créée et l'afficher
          .then(() => {
            notifySuccess(messages.deezer.success);
          })
          .catch(notifyHttpError),
      );
    } else if (playlistUrl) {
      loader.monitor(
        deezerApi
          .exportByPlaylistId(data)
          // TODO: recupérer l'ID de la playlist créée et l'afficher
          .then(() => {
            notifySuccess(messages.deezer.success);
          })
          .catch(notifyHttpError),
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
          {messages.deezer.export}
        </ActionButton>
      </FormContainer>
    </div>
  );
}
