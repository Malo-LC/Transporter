export type ErrorFunction = (...args: string[]) => string;

export type Translations = {
  app: {
    name: string,
  },
  // actions
  action: {
    back: string,
    cancel: string,
    save: string,
    delete: string,
    close: string,
    search: string,
    add: string,
    authenticate: string,
    disconnect: string,
    display_more: string,
    keep_editing: string,
    close_without_saving: string,
  },
  // common labels
  label: {
    more_options: string,
    confirm_delete: string,
    creation_date: string,
    loading: string,
    empty: string,
  },
  // common messages
  message: {
    changes_saved: string,
    unsaved_data: string,
  },
  // navigation
  nav: {
    home: string,
    users: string,
    user_list: string,
  },
  // home
  home: {
    description: string,
    loginToSpotify: string,
    title: string,
  },
  deezer: {
    chooseExportMethod: string,
    description: string,
    export: string,
    exportByFile: string,
    exportByUrl: string,
    exportSite: string,
    exporting: string,
    isLikes: string,
    missingTracks: string,
    openPlaylist: string,
    playlistName: string,
    playlistUrl: string,
    playlistUrlInvalid: string,
    success: string,
    title: string,
    transferError: string,
  },
  spotify: {
    callback: string,
    noCode: string,
    success: string,
    error: (error: string) => string,
    connectedAs: (userId: string | undefined) => string,
  },
  login: {
    title: string,
  },
  // users
  users: {
    userName: string,
    password: string,
    email: string,
    firstName: string,
    lastName: string,
    role: string,
    messages: {
      confirm_delete: (userName: string) => string,
    },
  },
  // pages users
  user: {
    title_list: string,
    title_create: string,
    title_edit: string,
    created: (date: string) => string,
    found: (count: number) => string,
    add_user: string,
    password_confirm: string,
    error_passwords_different: string,
  },
  // filters
  filters: {
    title: string,
    reset: string,
    user_role: {
      title: string,
    },
  },
  // sorts
  sorts: {
    user: {
      user_name_asc: string,
      user_name_desc: string,
      creation_date_asc: string,
      creation_date_desc: string,
    },
  },
  // errors
  error: {
    field: {
      required: string,
      email_wrong_format: string,
      password_same_value: string,
      empty_field: string,
    },
    security: {
      fingerprint_missing: string,
    },
  },
  'http-errors': {
    INTERNAL_ERROR: string,
    NETWORK_ERROR: string,
    TIMEOUT_ERROR: string,
    FORBIDDEN_ERROR: string,
    WRONG_LOGIN_OR_PASSWORD: string,
    TOO_MANY_WRONG_ATTEMPS: (seconds: string) => string,
    FIELD_REQUIRED: (fieldName: string) => string,
    MESSAGE: (message: string) => string,
    UNAUTHORIZED: string,
    BAD_REQUEST: string,
    NOT_FOUND: string,
    DEEZER_PLAYLIST_NOT_FOUND: string,
    DEEZER_PLAYLIST_PARSING_ERROR: string,
    DEEZER_PLAYLIST_URL_INVALID: string,
    DEEZER_PLAYLIST_NAME_MISSING: string,
    SPOTIFY_ACCESS_TOKEN_MISSING: string,
    SPOTIFY_PLAYLIST_CREATION_ERROR: string,
  },
};
