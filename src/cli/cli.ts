import { confirm, input, password, select } from '@inquirer/prompts';
import axios from 'axios';
import { color } from 'console-log-colors';
import 'dotenv/config';
import { createWriteStream } from 'fs-extra';
import { exec } from 'node:child_process';
import { getApiUrl } from '~/api';
import { deleteDir, deleteFile, pathExists, unzipFile } from '~/file';
import { isValidToken } from '~/token';
import { exit } from '~/utils';

const outputDir = process.env.SHIPKIT_OUTPUT_DIR ?? '.';

export const cli = async () => {
  const ora = (await import('ora')).default;

  welcome();

  try {
    const token = await password({
      message: 'Enter your ShipKit token',
    });

    const tokenSpinner = ora('Checking token...').start();

    const isValid = await isValidToken(token);

    tokenSpinner.stop();

    if (!isValid) {
      console.log('');
      console.log(color.redBright('Invalid token'));

      exit();
    }

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

    // dev
    // const manager = 'bun';

    // const choices = {
    //   baseFramework,
    //   framework: 'react',
    //   orm: 'prisma',
    //   database: 'mysql',
    //   auth: 'lucia',
    // };

    const spinner = ora('Downloading kit...').start();

    await downloadFile({
      token,
      data: choices,
      outputPath: toZip,
    });

    await deleteDir(to);
    spinner.text = 'Extracting kit...';
    await unzipFile(toZip, to);
    spinner.text = 'Cleaning kit...';
    await deleteFile(toZip);

    spinner.stop();

    const shouldInstall = await confirm({ message: 'Install dependencies?' });

    if (shouldInstall) {
      await install({
        path: to,
        manager,
      });
    }

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
  const url = getApiUrl('/api/build');
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
