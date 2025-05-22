import { CsvFileData, TrackData } from '../types/DeezerTypes';

export class DeezerFileService {
  public static parseCsv(csvContent: string): CsvFileData | null {
    const lines = csvContent.trim().split('\n');
    if (lines.length <= 1) {
      return null; // Retourne null si pas de données ou seulement l'en-tête
    }

    // Supposer que la première ligne est l'en-tête et l'ignorer
    const dataLines = lines.slice(1);

    if (dataLines.length === 0) {
      return null; // Retourne null s'il n'y a pas de lignes de données
    }

    let playlistName = dataLines[0].split(',')[3]?.trim().replaceAll('"', '') ?? '';

    const tracks: TrackData[] = [];

    for (const dataLine of dataLines) {
      const values = dataLine.split(',');

      if (values.length < 7) {
        console.warn(`Ligne CSV malformée ignorée : ${dataLine}`);
        continue; // Ignore cette ligne et passe à la suivante
      }

      const trackData: TrackData = {
        trackName: values[0]?.trim().replaceAll('"', '') ?? '',
        artistName: values[1]?.trim().replaceAll('"', '') ?? '',
        albumName: values[2]?.trim().replaceAll('"', '') ?? '',
      };

      // Ajouter la piste uniquement si elle a un nom
      if (trackData.trackName) {
        tracks.push(trackData);
      }
    }

    if (tracks.length === 0) {
      return null; // Si aucune piste valide n'a été analysée
    }

    return {
      tracks,
      playlistName,
    };
  }
}