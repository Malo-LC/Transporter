import useFormErrorParser from '@components/theme/form/hooks/FormErrorParserHook';
import classNames from '@lib/class-names/ClassNames';
import { InputTextProps } from '@lib/plume-admin-theme/form/FormInputProps';
import { TextFieldElement } from 'react-hook-form-mui';
import scss from './form-input.module.scss';

export default function InputText(
  {
    type = 'text',
    label,
    name,
    rules,
    disabled,
    autoComplete,
    multiline,
    rows,
    errorMessageMapping,
    InputProps,
  }: Readonly<InputTextProps>,
) {
  const { parseError } = useFormErrorParser({ errorMapping: errorMessageMapping });

  return (
    <TextFieldElement
      className={classNames(scss.formControl)}
      label={label}
      type={type}
      name={name}
      variant="outlined"
      id={name}
      autoComplete={autoComplete}
      rules={rules}
      disabled={disabled ?? false}
      multiline={multiline}
      rows={rows}
      slotProps={{
        input: InputProps,
      }}
      parseError={parseError}
    />
  );
}
