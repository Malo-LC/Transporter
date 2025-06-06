import InputPassword from '@components/theme/form/fields/InputPassword';
import List from '@components/theme/list/List';
import ListHead from '@components/theme/list/ListHead';
import ListItem from '@components/theme/list/ListItem';
import ConfirmationPopIn from '@components/theme/popin/ConfirmationPopIn';
import { ActionButtonProps, ActionContainerProps, ActionLinkProps } from '@lib/plume-admin-theme/action/ActionProps';
import { FormFieldProps } from '@lib/plume-admin-theme/form/FormFieldProps';
import { InputPasswordProps, InputSelectProps, InputTextProps } from '@lib/plume-admin-theme/form/FormInputProps';
import { FormContainerProps } from '@lib/plume-admin-theme/form/FormProps';
import { ListHeadProps, ListItemProps, ListProps } from '@lib/plume-admin-theme/list/ListProps';
import { PanelProps } from '@lib/plume-admin-theme/panel/PanelProps';
import PlumeAdminTheme from '@lib/plume-admin-theme/PlumeAdminTheme';
import { ConfirmationPopInProps, PopinProps } from '@lib/plume-admin-theme/popin/PopinProps';
import { ReactNode } from 'react';
import { FieldValues } from 'react-hook-form';
import { ActionButton, ActionLink, ActionsContainer } from './action/Actions';
import FormField from './form/fields/FormField';
import InputSelect from './form/fields/InputSelect';
import InputText from './form/fields/InputText';
import FormContainer from './form/FormContainer';
import Panel from './panel/Panel';
import Popin from './popin/Popin';

export default class AdminTheme implements PlumeAdminTheme {
  // actions

  actionsContainer: (props: ActionContainerProps) => ReactNode = ActionsContainer;

  actionButton: (props: ActionButtonProps) => ReactNode = ActionButton;

  actionLink: (props: ActionLinkProps) => ReactNode = ActionLink;

  // layout

  panel: (props: PanelProps) => ReactNode = Panel;

  // lists

  listHead: (props: ListHeadProps) => ReactNode = ListHead;

  list: (props: ListProps) => ReactNode = List;

  listItem: (props: ListItemProps) => ReactNode = ListItem;

  // popin

  popin: (props: PopinProps) => ReactNode = Popin;

  confirmationPopIn: (props: ConfirmationPopInProps) => ReactNode = ConfirmationPopIn;

  // form
  formContainer: <TFieldValues extends FieldValues = FieldValues>(
    props: FormContainerProps<TFieldValues>,
  ) => ReactNode = FormContainer;

  formField: (props: FormFieldProps) => ReactNode = FormField;

  inputText: (props: InputTextProps) => ReactNode = InputText;

  inputSelect: (props: InputSelectProps) => ReactNode = InputSelect;

  inputPassword: (props: InputPasswordProps) => ReactNode = InputPassword;
}
