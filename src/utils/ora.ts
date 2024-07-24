import type { Options, Ora } from 'ora';

let ora: (options?: string | Options) => Ora;

export const getOra = async () => {
  if (ora) return ora;

  ora = (await import('ora')).default;

  return ora;
};
