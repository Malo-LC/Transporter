/* eslint-disable @stylistic/max-len */
import { viteHotContext } from '@i18n/translations/hmr-config';
import { observable, WritableObservable } from 'micro-observables';
import { Translations } from './Translations';
import translationHotReload from './translations-hmr';

const enMessages: Translations = {
  app: {
    name: 'Plume admin',
  },
  // actions
  action: {
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    close: 'Close',
    search: 'Search',
    add: 'Add',
    authenticate: 'Log in',
    disconnect: 'Log out',
    display_more: 'Display more',
    keep_editing: 'Keep editing',
    close_without_saving: 'Close without saving',
  },
  // common labels
  label: {
    more_options: 'More options',
    confirm_delete: 'Confirm deletion',
    creation_date: 'Creation date',
    loading: 'Loading...',
    empty: 'No element',
  },
  // common messages
  message: {
    changes_saved: 'Changes have been successfully saved',
    unsaved_data: 'There are unsaved changes. '
      + 'If you would like to save changes, press the "Keep editing" button',
  },
  // navigation
  nav: {
    home: 'Home',
    users: 'User management',
    user_list: 'Users',
  },
  // home
  home: {
    title: 'Home page',
    loginToSpotify: 'Log in to Spotify',
  },
  deezer: {
    chooseExportMethod: 'Please choose an export method',
    description: 'If your playlist contains more than 2000 tracks, you need to export it by file in CSV format using the following site:',
    export: 'Export',
    exportByFile: 'Export by file',
    exportByPlaylistId: 'Export by playlist ID',
    exportByUrl: 'Export by URL',
    exportSite: 'https://www.tunemymusic.com/en/transfer',
    isLikes: 'Should add to "Likes" playlist?',
    playlistName: 'Playlist name',
    playlistUrl: 'Deezer playlist URL',
    title: 'Deezer',
    success: 'Deezer export successful',
  },
  spotify: {
    error: (error: string) => `Spotify connection error: ${error}`,
    noCode: 'No code provided in the URL',
    callback: 'Spotify authentication in progress, please wait...',
    success: 'Spotify authentication successful',
    connectedAs: (userId: string | undefined) => `Connected as : ${userId}`,
  },
  login: {
    title: 'Please authenticate',
  },
  // users
  users: {
    userName: 'User name',
    password: 'Password',
    email: 'Email',
    firstName: 'First name',
    lastName: 'Last name',
    role: 'Role',
    messages: {
      confirm_delete: (userName: string) => `You are about to delete ${userName}. This action is irreversible.`,
    },
  },
  // pages users
  user: {
    title_list: 'Users list',
    title_create: 'User creation',
    title_edit: 'User modification',
    created: (date: string) => `Created on ${date}`,
    found: (count: number) => `${count} user${count > 1 ? 's' : ''} found`,
    add_user: 'Add user',
    password_confirm: 'Password confirmation',
    error_passwords_different: 'Password do not match its confirmation',
  },
  // filters
  filters: {
    title: 'Filters',
    reset: 'Reset filters',
    user_role: {
      title: 'Role',
    },
  },
  // sorts
  sorts: {
    user: {
      user_name_asc: 'Sort username (A to Z)',
      user_name_desc: 'Sort username (Z to A)',
      creation_date_asc: 'Sort creation date (oldest first)',
      creation_date_desc: 'Sort creation date (most recent first)',
    },
  },
  // errors
  error: {
    field: {
      required: 'Field is required',
      email_wrong_format: 'The input email address is invalid',
      password_same_value: 'Both passwords must be the same',
      empty_field: 'The field entered is empty',
    },
    security: {
      fingerprint_missing: 'The fingerprint cookie to secure the JWT token seems to be missing. This may be ok in development, but in production, this cookie must be activated',
    },
  },
  'http-errors': {
    INTERNAL_ERROR: 'An unexpected error occurred',
    NETWORK_ERROR: 'Network error, your internet connexion seems unavailable',
    TIMEOUT_ERROR: 'Network error (timeout), your internet connection or the remote server seem unavailable',
    FORBIDDEN_ERROR: 'It seems you do not have access to this resource or this action',
    WRONG_LOGIN_OR_PASSWORD: 'User name or password incorrect',
    TOO_MANY_WRONG_ATTEMPS: (seconds: string) => `Due to login attempt errors, your account is locked for ${seconds} seconds, please try again later`,
    FIELD_REQUIRED: (fieldName: string) => `Field '${fieldName}' is required`,
    MESSAGE: (message: string) => message,
  },
} as const;

const enMessagesObservable: WritableObservable<Translations> = observable(enMessages);

if (viteHotContext?.hot) {
  // Hot reloading, see translations-hmr.ts
  viteHotContext.hot.accept(translationHotReload(enMessagesObservable));
}

export default enMessagesObservable.readOnly();
