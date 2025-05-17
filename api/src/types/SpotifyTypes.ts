export type SpotifyRefreshToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export type SpotifyUser = {
  id: string;
  display_name?: string;
}

export type SpotifyPlaylist = {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
  owner: SpotifyUser;
  tracks: {
    total: number;
  };
}

export type AddItemsToPlaylistResponse = {
  snapshot_id: string;
}

export type SpotifyTrack = {
  id: string;
  name: string;
  uri: string;
  artists: Array<{ name: string }>;
  album: { name: string };
  external_urls: {
    spotify: string;
  };
};

export type SpotifySearchResponse = {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
};

export type SearchTrackRequest = {
  songName: string,
  artistName: string,
  albumName: string,
}