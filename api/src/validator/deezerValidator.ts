import type { Context } from 'hono';
import { CreateSpotifyPlaylistBody } from '../types/DeezerTypes';
import spotifyApiService from '../service/SpotifyApiService';
import { ErrorCodesEnum } from '../types/GlobalTypes';

export async function validateDeezerPlaylistExport<T, U extends Context>(_value: T, c: U) {
  const userId: string = c.get('userId');

  const {
    name, description, public: isPublic = true, isLikes = false, playlistUrl,
  } = await c.req.json<CreateSpotifyPlaylistBody>();

  if (!playlistUrl) {
    return c.json({ errorCode: ErrorCodesEnum.BAD_REQUEST }, 400);
  }

  const regex = /(?:playlist\/|)(\d+)(?:[/?]|$)/m;
  const match = playlistUrl?.match(regex);
  const playlistId = match ? match[1] : null;

  if (!playlistId) {
    return c.json({ errorCode: ErrorCodesEnum.DEEZER_PLAYLIST_URL_INVALID }, 400);
  }

  if (!name && !isLikes) {
    return c.json({ errorCode: ErrorCodesEnum.DEEZER_PLAYLIST_NAME_MISSING }, 400);
  }

  if (!userId) {
    return c.json({ errorCode: ErrorCodesEnum.UNAUTHORIZED }, 401);
  }

  if (!spotifyApiService.hasAccessToken(userId)) {
    return c.json({ errorCode: ErrorCodesEnum.SPOTIFY_ACCESS_TOKEN_MISSING }, 401);
  }

  return {
    userId,
    name,
    description,
    isPublic,
    isLikes,
    playlistId,
  };
}

export async function validateDeezerFilePlaylistExport<T, U extends Context>(_value: T, c: U) {
  const userId: string = c.get('userId');
  const body = await c.req.parseBody();

  const name = body.name as string | undefined;
  const isLikesValue = body.isLikes;
  const isLikes = typeof isLikesValue === 'string' ? isLikesValue.toLowerCase() === 'true' : !!isLikesValue;
  const file = body.file as File | undefined;
  const description = body.description as string | undefined;
  const isPublic = typeof body.isPublic === 'string' ? body.isPublic.toLowerCase() === 'true' : !!body.isPublic;

  if (!file) {
    return c.json({ message: 'No file provided' }, 400);
  }

  if (!name && !isLikes) {
    return c.json({ message: 'No playlist name provided' }, 400);
  }

  if (!userId) {
    return c.json({ message: 'User ID is missing' }, 401);
  }

  if (!spotifyApiService.hasAccessToken(userId)) {
    return c.json({ message: 'Spotify access token is missing' }, 401);
  }

  return {
    userId,
    name,
    description,
    isPublic,
    isLikes,
    file,
  };
}
