import useMessages, { Messages } from '@i18n/hooks/messagesHook';
import usePlumeTheme, { PlumeAdminThemeComponents } from '../hooks/ThemeHook';

export default function Home() {
  const { messages }: Messages = useMessages();
  const { panel: Panel, panelTitle: PanelTitle }: PlumeAdminThemeComponents = usePlumeTheme();

  return (
    <Panel>
      <PanelTitle>{messages.home.title}</PanelTitle>
    </Panel>
  );
}
