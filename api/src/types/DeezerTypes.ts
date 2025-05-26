import { WebSocket } from 'ws';

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

export type DeezerTracks = {
  data: DeezerTrack[];
  total: number;
  checksum: string;
  next: string;
};

export type CreateSpotifyPlaylistBody = {
  playlistUrl: string;
  name?: string;
  description?: string;
  public?: boolean;
  isLikes?: boolean;
};

export type TrackData = {
  trackName: string;
  artistName: string;
  albumName: string;
}

export type CsvFileData = {
  tracks: TrackData[];
  playlistName: string;
}

export type TaskProgress = {
  status: 'pending' | 'transferring' | 'completed' | 'error';
  percentage: number;
  currentSong: number;
  totalSongs: number;
  spotifyPlaylistId?: string;
  missingTracks?: string[];
  timeTaken?: number;
  songName?: string;
  webSocketClients: WebSocket[];
};
