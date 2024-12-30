import { password } from '@inquirer/prompts';
import axios from 'axios';
import { color } from 'console-log-colors';
import keytar from 'keytar';
import { getApiUrl } from '~/api';
import { exit, getOra } from '~/utils';

const key = process.env.UNDERSTATED_TOKEN_KEY ?? 'understated';

export const isValidToken = async (token: string | null) => {
  if (!token) return false;

  try {
    const url = getApiUrl('/token/check');
    const { data } = await axios.post<{ valid: boolean }>(url, {
      token,
    });

    return data.valid;
  } catch (error) {
    return false;
  }
};

export const requestToken = async () => {
  const ora = await getOra();

  const token = await password({
    message: 'Enter your Understated token',
  });

  const tokenSpinner = ora('Checking token...').start();
  const isValid = await isValidToken(token);

  tokenSpinner.stop();

  if (!isValid) {
    console.log('');
    console.log(color.redBright('Invalid token'));

    exit();

    return null;
  }

  return token;
};

export const setToken = async (token: string) => {
  await keytar.setPassword(key, 'token', token);
};

export const getToken = async () => {
  const token = await keytar.getPassword(key, 'token');

  return token;
};

export const removeToken = async () => {
  const result = await keytar.deletePassword(key, 'token');

  return result;
};
