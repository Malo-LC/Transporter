/* eslint-disable @stylistic/max-len */
import { viteHotContext } from '@i18n/translations/hmr-config';
import { observable, WritableObservable } from 'micro-observables';
import { Translations } from './Translations';
import translationHotReload from './translations-hmr';

const frMessages: Translations = {
  app: {
    name: 'Plume admin',
  },
  // actions
  action: {
    back: 'Retour',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    close: 'Fermer',
    search: 'Rechercher',
    add: 'Ajouter',
    authenticate: 'Me connecter',
    disconnect: 'Me déconnecter',
    display_more: 'Afficher plus',
    keep_editing: 'Rester sur la page',
    close_without_saving: 'Fermer sans sauvegarder',
  },
  // common labels
  label: {
    more_options: 'Plus d\'options',
    confirm_delete: 'Confirmation de suppression',
    creation_date: 'Date de création',
    empty: 'Aucun élément',
    loading: 'Chargement...',
  },
  // common messages
  message: {
    changes_saved: 'Les modifications ont bien été enregistrées',
    unsaved_data: 'Des modifications n\'ont pas été enregistrées. '
      + 'Si vous voulez enregistrer ces modifications, cliquez sur le bouton "Rester sur la page"',
  },
  // navigation
  nav: {
    home: 'Accueil',
    users: 'Gestion des utilisateurs',
    user_list: 'Utilisateurs',
  },
  // home
  home: {
    title: 'Page d\'accueil',
    loginToSpotify: 'Se connecter à Spotify',
  },
  deezer: {
    chooseExportMethod: 'Veuillez choisir une méthode d\'exportation',
    description: 'Si votre playlist contient plus de 2000 titres, il faut l\'exporter par fichier au format CSV grâce au site suivant :',
    export: 'Exporter',
    exportByFile: 'Exporter par fichier',
    exportByUrl: 'Sinon, vous pouvez entrer l\'url de votre playlist Deezer ci-dessous :',
    exportSite: 'https://www.tunemymusic.com/fr/transfer',
    exporting: 'Exportation en cours...',
    isLikes: 'Ajouter les titres à la playlist "J\'aime" ?',
    missingTracks: 'Titres manquants dans la playlist Spotify :',
    openPlaylist: 'Ouvrir la playlist Spotify',
    playlistName: 'Nom de la playlist',
    playlistUrl: 'URL de la playlist Deezer',
    success: 'Export Deezer vers Spotify réussi',
    title: 'Export Deezer vers Spotify',
  },
  spotify: {
    error: (error: string) => `Erreur de connexion à Spotify : ${error}`,
    success: 'Authentification Spotify réussie',
    noCode: 'Aucun code fourni dans l\'URL',
    callback: 'Authentification Spotify en cours, veuillez patienter...',
    connectedAs: (userId: string | undefined) => `Connecté en tant que : ${userId}`,
  },
  login: {
    title: 'Se connecter',
  },
  // users
  users: {
    userName: 'Nom d\'utilisateur',
    password: 'Mot de passe',
    email: 'E-mail',
    firstName: 'Prénom',
    lastName: 'Nom',
    role: 'Rôle',
    messages: {
      confirm_delete: (userName: string) => `Vous êtes sur le point de supprimer ${userName}. Cette action est irreversible.`,
    },
  },
  // pages users
  user: {
    title_list: 'Liste des utilisateurs',
    title_create: 'Création d\'un utilisateur',
    title_edit: 'Modification d\'un utilisateur',
    created: (date: string) => `Créé le ${date}`,
    found: (count: number) => `${count} utilisateur${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`,
    add_user: 'Ajouter un utilisateur',
    password_confirm: 'Confirmation du mot de passe',
    error_passwords_different: 'Le mot de passe et sa confirmation sont différents',
  },
  // filters
  filters: {
    title: 'Filtres',
    reset: 'Réinitialiser les filtres',
    user_role: {
      title: 'Rôle',
    },
  },
  // sorts
  sorts: {
    user: {
      user_name_asc: 'Trier par nom utilisateur (A - Z)',
      user_name_desc: 'Trier par nom utilisateur (Z - A)',
      creation_date_asc: 'Trier par date de création (ancienne à récente)',
      creation_date_desc: 'Trier par date de création (récente à ancienne)',
    },
  },
  // errors
  error: {
    field: {
      required: 'Le champ est requis',
      email_wrong_format: 'L\'adresse e-mail saisie semble être incorrecte',
      password_same_value: 'Veuillez saisir deux mots de passe identiques',
      empty_field: 'Le champ entré est vide',
    },
    security: {
      fingerprint_missing: 'Le fingerprint du cookie pour sécuriser le token JWT semble absent, cela peut être ok en développement, mais en production, ce cookie devra être activé',
    },
  },
  'http-errors': {
    INTERNAL_ERROR: 'Une erreur inattendue s\'est produite',
    NETWORK_ERROR: 'Erreur réseau, votre connexion internet semble indisponible',
    TIMEOUT_ERROR: 'Erreur réseau (timeout), votre connexion internet ou le serveur distant semble indisponible',
    FORBIDDEN_ERROR: 'Il semble que vous n\'avez pas accès à cette ressource ou à cette action',
    WRONG_LOGIN_OR_PASSWORD: 'Nom d\'utilisateur ou mot de passe incorrect',
    TOO_MANY_WRONG_ATTEMPS: (seconds: string) => `Suite à des erreurs dans la saisie de vos identifiants, votre compte est verrouillé pendant ${seconds} secondes, veuillez-vous reconnecter ultérieurement`,
    FIELD_REQUIRED: (fieldName: string) => `Le champ '${fieldName}' est requis`,
    MESSAGE: (message: string) => message,
  },
} as const;

const frMessagesObservable: WritableObservable<Translations> = observable(frMessages);

if (viteHotContext?.hot) {
  // Hot reloading, see translations-hmr.ts
  viteHotContext.hot.accept(translationHotReload(frMessagesObservable));
}

export default frMessagesObservable.readOnly();
