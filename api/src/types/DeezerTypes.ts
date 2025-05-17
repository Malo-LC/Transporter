export type DeezerToken = {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token: string;
}

export type DeezerTrack = {
  id: number;
  readable: boolean;
  title: string;
  title_short: string;
  title_version: string;
  isrc: string;
  duration: number
  rank: number
  explicit_lyrics: boolean;
  explicit_content_lyrics: number;
  explicit_content_cover: number;
  md5_image: string;
  time_add: boolean;
  type: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
};

export type DeezerAlbum = {
  id: number;
  title: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  md5_image: string;
  tracklist: string;
  type: string;
};

export type DeezerAlbumDetailed = DeezerAlbum & {
  genre_id: number;
  genres: DeezerGenres;
  label: string;
  nb_tracks: number;
  duration: number;
  fans: number;
  release_date: string;
  record_type: string;
  artist: DeezerArtist;
  contributors: DeezerArtist[];
  available: boolean;
  tracks: DeezerTracks;
  error?: boolean;
};

export type DeezerArtist = {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  tracklist: string;
  type: string;
};

export type DeezerArtistDetailed = DeezerArtist & {
  nb_album: number;
  nb_fan: number;
  radio: boolean;
};

export type DeezerTrackDetailed = DeezerTrack & {
  link: string;
  track_position: number;
  disk_number: number;
  release_date: string;
  preview: string;
  bpm: number;
  gain: number;
  contributors: DeezerArtist[];
};

export type DeezerTracks = {
  data: DeezerTrack[];
  total: number;
  checksum: string;
  next: string;
};

export type DeezerGenres = {
  data: DeezerGenre[];
};

export type DeezerGenre = {
  id: number;
  name: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  type: string;
};