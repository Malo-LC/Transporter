import useMessages, { Messages } from '@i18n/hooks/messagesHook';
import classNames from '@lib/class-names/ClassNames';
import ClearIcon from '@mui/icons-material/Clear';
import { ChangeEvent, MouseEvent } from 'react';
import scss from './custom-file-input.module.scss';

type CustomFileInputProps = {
  value: File | undefined,
  setValue: (value: File | undefined) => void,
};

export default function CustomFileInput(
  {
    value,
    setValue,
  }: Readonly<CustomFileInputProps>,
) {
  const { messages }: Messages = useMessages();

  return (
    <label
      className={classNames(
        scss.customFileUpload,
        value ? scss.customFileUploadSelected : '',
      )}
      htmlFor="file"
    >
      <span>
        {
          value
            ? value?.name
            : messages.deezer.exportByFile
        }
      </span>
      <input
        type="file"
        id="file"
        accept="text/csv"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const file: File | undefined = e.target.files?.[0] ?? undefined;
          setValue(file);
        }}
      />
      {
        value && (
          <ClearIcon
            onClick={(e: MouseEvent<SVGSVGElement>) => {
              setValue(undefined);
              e.stopPropagation();
              e.preventDefault();
            }}
            className={scss.customFileUploadClear}
          />
        )
      }
    </label>
  );
}
