import { FormContainerProps } from '@lib/plume-admin-theme/form/FormProps';
import { ListHeadProps, ListItemProps, ListProps } from '@lib/plume-admin-theme/list/ListProps';
import { ReactNode } from 'react';
import { FieldValues } from 'react-hook-form';
import { ActionButtonProps, ActionContainerProps, ActionLinkProps } from './action/ActionProps';
import { FormFieldProps } from './form/FormFieldProps';
import { InputPasswordProps, InputSelectProps, InputTextProps } from './form/FormInputProps';
import { PanelProps } from './panel/PanelProps';
import { ConfirmationPopInProps, PopinProps } from './popin/PopinProps';

export default abstract class PlumeAdminTheme {
  // layout

  abstract panel: (props: PanelProps) => ReactNode;

  // lists

  abstract listHead: (props: ListHeadProps) => ReactNode;

  abstract list: (props: ListProps) => ReactNode;

  abstract listItem: (props: ListItemProps) => ReactNode;

  // actions
  abstract actionsContainer: (props: ActionContainerProps) => ReactNode;

  abstract actionLink: (props: ActionLinkProps) => ReactNode;

  abstract actionButton: (props: ActionButtonProps) => ReactNode;

  // popin
  abstract popin: (props: PopinProps) => ReactNode;

  abstract confirmationPopIn: (props: ConfirmationPopInProps) => ReactNode;

  // form

  abstract formContainer: <TFieldValues extends FieldValues = FieldValues>(
    props: FormContainerProps<TFieldValues>,
  ) => ReactNode;

  // form fields

  abstract formField: (props: FormFieldProps) => ReactNode;

  abstract inputText: (props: InputTextProps) => ReactNode;

  abstract inputSelect: (props: InputSelectProps) => ReactNode;

  abstract inputPassword: (props: InputPasswordProps) => ReactNode;
}
