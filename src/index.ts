import { select } from '@inquirer/prompts';
import axios from 'axios';
import 'dotenv/config';
import { createReadStream, createWriteStream, ensureDir } from 'fs-extra';
import { exec } from 'node:child_process';
import unzipper from 'unzipper';
import { deleteDir, deleteFile } from '~/file';

const baseUrl = process.env.SHIPKIT_BASE_URL ?? 'https://shipkit.app';

export const start = async () => {
  try {
    const baseFramework = await select({
      message: 'Select a base framework',
      choices: [
        {
          name: 'Astro',
          value: 'astro',
        },
        {
          name: 'Next.js',
          value: 'next',
        },
      ],
    });

    const framework = await select({
      message: 'Select a framework',
      choices: [
        {
          name: 'React',
          value: 'react',
        },
      ],
    });

    const orm = await select({
      message: 'Select an ORM',
      choices: [
        {
          name: 'Drizzle',
          value: 'drizzle',
        },
        {
          name: 'Prisma',
          value: 'prisma',
        },
      ],
    });

    const database = await select({
      message: 'Select a database',
      choices: [
        {
          name: 'MySQL',
          value: 'mysql',
        },
        {
          name: 'Neon (PostgreSQL)',
          value: 'neon',
        },
        {
          name: 'PostgreSQL',
          value: 'postgresql',
        },
      ],
    });

    const auth = await select({
      message: 'Select an auth provider',
      choices: [
        {
          name: 'Lucia',
          value: 'lucia',
        },
      ],
    });

    const manager = await select({
      message: 'Select a package manager',
      choices: [
        {
          name: 'bun',
          value: 'bun',
        },
        {
          name: 'npm',
          value: 'npm',
        },
        {
          name: 'pnpm',
          value: 'pnpm',
        },
        {
          name: 'yarn',
          value: 'yarn',
        },
      ],
    });

    const choices = {
      baseFramework,
      framework,
      orm,
      database,
      auth,
    };

    const url = `${baseUrl}/api/build`;

    await downloadFile({
      url,
      token: '394965bd_cad7_4c47_af78_5ae9126f3333',
      data: choices,
      outputPath: '../output.zip',
    });

    await deleteDir('../output');
    await unzipFile('../output.zip', '../output');

    await deleteFile('../output.zip');

    await install({
      path: '../output',
      manager,
    });

    console.log('DONE');
  } catch (error: any) {}
};

async function downloadFile({
  url,
  token,
  data,
  outputPath,
}: {
  url: string;
  token: string;
  data: unknown;
  outputPath: string;
}): Promise<void> {
  const writer = createWriteStream(outputPath);

  const response = await axios({
    url,
    data,
    method: 'POST',
    responseType: 'stream',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

export const unzipFile = async (
  zipFilePath: string,
  outputDir: string
): Promise<void> => {
  await ensureDir(outputDir);

  return new Promise((resolve, reject) => {
    createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: outputDir }))
      .on('close', resolve)
      .on('error', reject);
  });
};

export const install = async ({
  path,
  manager,
}: {
  path: string;
  manager: string;
}) => {
  const managers: Record<string, string> = {
    npm: 'npm install',
    pnpm: 'pnpm install',
    bun: 'bun install',
    yarn: 'yarn',
  };

  return new Promise<void>((resolve, reject) => {
    const child = exec(`cd ${path} && ${managers[manager]}`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });

    child.stdout?.on('data', (data) => {
      console.log(data);
    });

    child.stderr?.on('data', (data) => {
      console.error(data);
    });
  });
};
