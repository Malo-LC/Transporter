import { Hono } from 'hono';
import { DeezerApiService } from '../service/DeezerApiService';
import { DeezerFileService } from '../service/DeezerFileService';
import spotifyApiService from '../service/SpotifyApiService';

const deezerController = new Hono();
const deezerApiService = new DeezerApiService();

deezerController.get('/playlists/:playlistId/to-spotify', async (c) => {
  const playlistId = c.req.param('playlistId');
  const name = c.req.query("name");

  if (!name) {
    return c.json({ message: 'No playlist name provided' }, 400);
  }

  const deezerTracks = await deezerApiService.fetchPlaylist(playlistId);

  if (!deezerTracks.data) {
    return c.json({ message: 'No data found' }, 404);
  }

  console.info('Fetched deezer playlist ', playlistId, ' with ', deezerTracks.data.length, ' tracks');

  const newSpotifyPlaylist = await spotifyApiService.createPlaylist(name);

  if (!newSpotifyPlaylist?.id) {
    return c.json({ message: 'Error creating Spotify playlist', newSpotifyPlaylist }, 500);
  }
  console.info('Created Spotify playlist ', newSpotifyPlaylist.id);

  let spotifyUris: string[] = []

  for (let i = 0; i < deezerTracks.data.length; i++) {
    // 1: Search for the track on Spotify
    const track = deezerTracks.data[i];
    const searchResult = await spotifyApiService.searchTrack(
      track.title,
      track.artist.name
    );
    if (searchResult?.tracks?.items?.length) {
      const spotifyTrack = searchResult.tracks.items[0];
      spotifyUris.push(spotifyTrack.uri);
    } else {
      // Retry with removing things in ()
      const trackName = track.title.replace(/\s*\(.*?\)\s*/g, '').trim();
      const searchResult = await spotifyApiService.searchTrack(
        trackName,
        track.artist.name
      );
      if (searchResult?.tracks?.items?.length) {
        const spotifyTrack = searchResult.tracks.items[0];
        spotifyUris.push(spotifyTrack.uri);
      } else {
        console.warn('Track not found on Spotify ', track.title, ' by ', track.artist.name);
      }
    }
    // 2: Add the track to the Spotify playlist
    if (spotifyUris.length > 90) { // Spotify API limit is 100 tracks per request
      await spotifyApiService.addSongsToPlaylist(newSpotifyPlaylist.id, spotifyUris);
      console.info('Added ', spotifyUris.length, ' tracks to Spotify playlist ', newSpotifyPlaylist.id);
      spotifyUris = []; // Reset the array
    }
    // display progress
    if (i % 10 === 0) {
      console.info('Processed ', i / deezerTracks.data.length * 100, '% of the tracks');
    }
  }
  // Add remaining tracks
  if (spotifyUris.length > 0) {
    await spotifyApiService.addSongsToPlaylist(newSpotifyPlaylist.id, spotifyUris);
    console.info('Added ', spotifyUris.length, ' tracks to Spotify playlist ', newSpotifyPlaylist.id);
  }

  console.info('Added all tracks to Spotify playlist ', newSpotifyPlaylist.id);

  return c.json(deezerTracks);
});

deezerController.post('/file', async (c) => {
  const file = await (await c.req.blob()).text();

  const playlist = DeezerFileService.parseCsv(file);

  if (!playlist) {
    return c.json({ message: 'No data found' }, 404);
  }

  console.info('Fetched deezer playlist ', playlist.playlistName, ' with ', playlist.tracks.length, ' tracks');

  return c.json(playlist);
});

export default deezerController;