import AdmZip from 'adm-zip';
import axios from 'axios';
import { createWriteStream, existsSync, readFileSync } from 'fs-extra';
import {
  cp,
  mkdir,
  readFile as readFilePromise,
  unlink,
  writeFile as writeFilePromise,
} from 'fs/promises';
import https from 'https';
import os from 'os';
import path from 'path';
import { rimraf } from 'rimraf';

export const pathExists = (path: string) => {
  return existsSync(path);
};

export const getTempFilePath = (file: string) => {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, file);

  return filePath;
};

export const createDir = async (dir: string) => {
  try {
    await mkdir(dir);
  } catch (error) {}
};

export const downloadFile = ({
  url,
  outupt,
}: {
  url: string;
  outupt: string;
}): Promise<void> => {
  return new Promise((resolve) => {
    const file = createWriteStream(outupt);

    https.get(url, (response) => {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
  });
};

export const getRemoteFileContent = async (url: string) => {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  });

  return Buffer.from(response.data, 'binary');
};

export const getFileContent = (path: string) => {
  const content = readFileSync(path);

  return content;
};

export const deleteFile = async (path: string) => {
  try {
    return unlink(path);
  } catch (error) {
    // ignore
  }
};

export const deleteDir = async (path: string) => {
  try {
    return rimraf(path);
  } catch (error) {
    // ignore
  }
};

export const readFile = async (path: string) => {
  const content = await readFilePromise(path, 'utf8');

  if (path.endsWith('.json')) {
    return JSON.parse(content);
  }

  return content;
};

export const writeFile = async (path: string, content: any) => {
  await writeFilePromise(path, content);
};

export const copy = async (from: string, to: string) => {
  await cp(from, to, {
    recursive: true,
  });
};

export const unzipFile = async (
  zipFilePath: string,
  outputDir: string
): Promise<void> => {
  try {
    const zip = new AdmZip(zipFilePath);

    zip.extractAllTo(outputDir, true);
  } catch (error) {
    throw new Error('Failed to unzip file');
  }
};
