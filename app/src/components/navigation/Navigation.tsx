import useMessages, { Messages } from '@i18n/hooks/messagesHook';
import classNames from '@lib/class-names/ClassNames';
import useToggle from '@lib/react-hook-toggle/ReactHookToggle';
import { Icon, List } from '@mui/material';
import plumeLogo from '../../../assets/icons/plume_logo.png';
import { ROUTE_HOME, routes } from '../../router/RouterDefinition';
import LinkListItem from './LinkListItem';

import scss from './navigation.module.scss';

export default function Navigation() {
  const { messages }: Messages = useMessages();

  const [isDrawerOpened, toggleDrawerOpening] = useToggle(true);

  return (
    <nav className={classNames(scss.mainNav, isDrawerOpened ? undefined : scss.mainNavClosed)}>
      <button type="button" className={scss.toggleNav} onClick={toggleDrawerOpening}>
        <Icon>
          {isDrawerOpened ? 'arrow_back_ios' : 'arrow_forward_ios'}
        </Icon>
      </button>

      <div className={scss.appInfo}>
        <img src={plumeLogo} className="logo" alt="logo" />
        <span className={scss.appName}>{messages.app.name}</span>
      </div>
      <List className={scss.navigation}>
        <LinkListItem
          icon="home"
          route={routes[ROUTE_HOME]}
          label={messages.nav.home}
          drawerOpen={isDrawerOpened}
        />
      </List>
    </nav>
  );
}
