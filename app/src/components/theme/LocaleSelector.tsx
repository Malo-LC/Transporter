import { Locale } from '@lib/locale-resolver/LocaleResolver';
import { MenuItem } from '@mui/material';
import DropdownMenu, { useOnClickSubscriber } from './DropdownMenu';

type LocaleSelectorProps = {
  currentLocale: Locale,
  availableLocales: Locale[],
  onLocaleSelected: (locale: Locale) => void,
};

export default function LocaleSelector(
  { currentLocale, availableLocales, onLocaleSelected }: LocaleSelectorProps,
) {
  const { subscribeOnClick, wrapOnClick } = useOnClickSubscriber();

  return (
    <DropdownMenu
      label={currentLocale.code.toUpperCase()}
      id="lang-menu"
      subscribeOnClick={subscribeOnClick}
    >
      {
        availableLocales.map((availableLocale: Locale) => (
          <MenuItem
            key={availableLocale.code}
            onClick={wrapOnClick(() => onLocaleSelected(availableLocale))}
          >
            {availableLocale.name}
          </MenuItem>
        ))
      }
    </DropdownMenu>
  );
}
