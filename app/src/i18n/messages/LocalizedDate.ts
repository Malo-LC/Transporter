import 'dayjs/locale/fr';
import 'dayjs/locale/en';
import type { Locale } from '@lib/locale-resolver/LocaleResolver';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import type LocaleService from '../locale/LocaleService';

/**
 * Gère le chargement des traductions pour dayjs
 */
export default function initializeLocalizedDate(localeService: LocaleService) {
  dayjs.extend(localizedFormat);
  dayjs.locale(localeService.getCurrentLocale().get().code);
  localeService.getCurrentLocale().subscribe((locale: Locale) => dayjs.locale(locale.code));
}
