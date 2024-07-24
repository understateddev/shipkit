const baseUrl = process.env.SHIPKIT_BASE_URL ?? 'https://shipkit.app';

export const getApiUrl = (path: string) => {
  const url = `${baseUrl}${path}`;

  return url;
};
