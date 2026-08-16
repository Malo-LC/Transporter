export type DeezerExportBody = {
  playlistUrl: string;
};

export type DeezerStartExport = {
  taskId: string;
};

export type DeezerAuth = {
  isAuthenticated: boolean;
  userId: string;
};
