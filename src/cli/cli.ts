import { confirm, input, select } from '@inquirer/prompts';
import axios from 'axios';
import { color } from 'console-log-colors';
import { createWriteStream } from 'fs-extra';
import { exec } from 'node:child_process';
import { getApiUrl } from '~/api';
import { deleteDir, deleteFile, pathExists, unzipFile } from '~/file';
import {
  getToken,
  isValidToken,
  removeToken,
  requestToken,
  setToken,
} from '~/token';
import { exit, getOra } from '~/utils';

const outputDir = process.env.SHIPKIT_OUTPUT_DIR ?? '.';

export const cli = async () => {
  const ora = await getOra();

  welcome();

  try {
    let token = await getToken();

    const isStoredTokenValid = await isValidToken(token);

    if (!isStoredTokenValid) {
      token = await requestToken();
    } else {
      const useStoredToken = await confirm({
        message: 'Use stored ShipKit token?',
      });

      if (!useStoredToken) {
        token = await requestToken();

        await removeToken();
      }
    }

    if (!token) return;

    await setToken(token);

    const name = await input({
      message: "What's the name of your project?",
      default: 'my-project',
    });

    const to = `${outputDir}/${name}`;
    const toZip = `${to}.zip`;

    if (pathExists(to)) {
      console.log('');
      console.log(color.redBright('Folder already exists'));

      exit();
    }

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

    let framework = 'react';

    if (baseFramework === 'astro') {
      framework = await select({
        message: 'Select a framework',
        choices: [
          {
            name: 'Preact',
            value: 'preact',
          },
          {
            name: 'React',
            value: 'react',
          },
          {
            name: 'Solid',
            value: 'solid',
          },
          {
            name: 'Svelte',
            value: 'svelte',
          },
          {
            name: 'Vue',
            value: 'vue',
          },
        ],
      });
    }

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

    const databases: Record<string, { name: string; value: string }[]> = {
      drizzle: [
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
        {
          name: 'SQLite',
          value: 'sqlite',
        },
        {
          name: 'Turso',
          value: 'turso',
        },
      ],
      prisma: [
        {
          name: 'MySQL',
          value: 'mysql',
        },
        {
          name: 'PostgreSQL',
          value: 'postgresql',
        },
        {
          name: 'SQLite',
          value: 'sqlite',
        },
      ],
    };

    const database = await select({
      message: 'Select a database',
      choices: databases[orm]!,
    });

    const auth = await select({
      message: 'Select an auth provider',
      choices: [
        {
          name: 'Lucia',
          value: 'lucia',
        },
        {
          name: 'Supabase',
          value: 'supabase',
        },
        {
          name: 'Clerk',
          value: 'clerk',
          ...(framework !== 'react' && {
            disabled: '(React only)',
          }),
        },
      ],
    });

    const output = await select({
      message: 'Select output',
      choices: [
        {
          name: 'Node',
          value: 'node',
        },
        {
          name: 'Netlify',
          value: 'netlify',
        },
        {
          name: 'Vercel',
          value: 'vercel',
        },
      ],
    });

    const choices = {
      baseFramework,
      framework,
      orm,
      database,
      auth,
      output,
    };

    const spinner = ora('Downloading kit...').start();

    const timeout = setTimeout(() => {
      exit();
    }, 5000);

    await downloadFile({
      token,
      data: choices,
      outputPath: toZip,
    });

    clearTimeout(timeout);

    await deleteDir(to);
    spinner.text = 'Extracting kit...';
    await unzipFile(toZip, to);
    spinner.text = 'Cleaning kit...';
    await deleteFile(toZip);
    spinner.stop();

    console.log('');
    console.log(color.greenBright('Build something amazing!'));
  } catch (error: any) {}
};

async function downloadFile({
  token,
  data,
  outputPath,
}: {
  token: string;
  data: unknown;
  outputPath: string;
}): Promise<void> {
  const writer = createWriteStream(outputPath);
  const url = getApiUrl('/download');
  const response = await axios({
    url,
    data,
    method: 'POST',
    responseType: 'stream',
    headers: {
      'shipkit-token': token,
    },
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

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
    console.log('');
    console.log(color.cyanBright(`Installing dependencies with ${manager}`));
    console.log('');

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

export const welcome = () => {
  console.log(color.gray('-------------------------'));
  console.log(color.greenBright('Welcome to ShipKit!'));
  // console.log('');
  // console.log(color.gray('Get started:'));
  // console.log('https://shipkit.app/docs');
  console.log('');
  // console.log(color.gray('-------------------------'));
  console.log(color.gray('Created by: Marcel Thomas'));
  console.log(color.gray('-------------------------'));
  console.log('');
};
