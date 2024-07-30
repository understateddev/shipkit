const baseUrl = process.env.SHIPKIT_BASE_URL ?? 'https://api.shipkit.app';

export const getApiUrl = (path: string) => {
  const url = `${baseUrl}${path}`;

  return url;
};
