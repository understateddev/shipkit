import axios from 'axios';
import { getApiUrl } from '~/api';

export const isValidToken = async (token: string) => {
  try {
    const url = getApiUrl('/api/token/check');
    const { data } = await axios.post<{ valid: boolean }>(url, {
      token,
    });

    return data.valid;
  } catch (error) {
    return false;
  }
};
