const baseUrl =
  process.env.UNDERSTATED_BASE_URL ?? 'https://api.understated.dev';

export const getApiUrl = (path: string) => {
  const url = `${baseUrl}${path}`;

  return url;
};
