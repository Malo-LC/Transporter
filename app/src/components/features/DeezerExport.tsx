import DeezerApi from '@api/deezer/DeezerApi';
import { ActionButton } from '@components/theme/action/Actions';
import InputText from '@components/theme/form/fields/InputText';
import useMessages, { Messages } from '@i18n/hooks/messagesHook';
import useLoader, { LoaderState } from '@lib/plume-http-react-hook-loader/promiseLoaderHook';
import useNotification from '@lib/plume-notification/NotificationHook';
import { getGlobalInstance } from 'plume-ts-di';
import { ChangeEvent } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { FormContainer } from 'react-hook-form-mui';

type FormValues = {
  file: File | undefined,
  playlistUrl: string,
  playlistName: string,
};

export default function DeezerExport() {
  const deezerApi: DeezerApi = getGlobalInstance(DeezerApi);

  const { messages }: Messages = useMessages();
  const { notifyHttpError } = useNotification();
  const loader: LoaderState = useLoader();

  const formContext: UseFormReturn<FormValues> = useForm<FormValues>();

  const onSubmit = (data: FormValues) => {
    console.log(data);
    const { file, playlistUrl } = data;
    if (file) {
      loader.monitor(
        deezerApi
          .exportByFile(file)
          .catch(notifyHttpError),
      );
    } else if (playlistUrl) {
      loader.monitor(
        deezerApi
          .exportByPlaylistId(playlistUrl)
          .catch(notifyHttpError),
      );
    }
  };

  return (
    <div>
      <FormContainer formContext={formContext} onSuccess={onSubmit}>
        <input
          type="file"
          accept="text/csv"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const file: File | undefined = e.target.files?.[0] ?? undefined;
            formContext.setValue('file', file);
          }}

        />
        <InputText name="playlistUrl" label={messages.deezer.playlistUrl} />
        <InputText
          name="playlistName"
          label={messages.deezer.playlistName}
          rules={{
            required: 'Please enter a playlist name',
          }}
        />
        <ActionButton>
          {messages.deezer.export}
        </ActionButton>
      </FormContainer>
    </div>
  );
}
