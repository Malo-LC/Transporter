import type { FormContainerProps } from '@lib/plume-admin-theme/form/FormProps';
import type { ListHeadProps, ListItemProps, ListProps } from '@lib/plume-admin-theme/list/ListProps';
import type { ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';
import type { ActionButtonProps, ActionContainerProps, ActionLinkProps } from './action/ActionProps';
import type { FormFieldProps } from './form/FormFieldProps';
import type { InputPasswordProps, InputSelectProps, InputTextProps } from './form/FormInputProps';
import type { PanelProps } from './panel/PanelProps';
import type { ConfirmationPopInProps, PopinProps } from './popin/PopinProps';

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

  abstract formContainer: <TFieldValues extends FieldValues = FieldValues>(props: FormContainerProps<TFieldValues>) => ReactNode;

  // form fields

  abstract formField: (props: FormFieldProps) => ReactNode;

  abstract inputText: (props: InputTextProps) => ReactNode;

  abstract inputSelect: (props: InputSelectProps) => ReactNode;

  abstract inputPassword: (props: InputPasswordProps) => ReactNode;
}
