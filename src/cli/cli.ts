import { confirm, input, select } from '@inquirer/prompts';
import axios from 'axios';
import { color } from 'console-log-colors';
import 'dotenv/config';
import { createWriteStream } from 'fs-extra';
import { exec } from 'node:child_process';
import ora from 'ora';
import { deleteDir, deleteFile, pathExists, unzipFile } from '~/file';
import { exit } from '~/utils';

const baseUrl = process.env.SHIPKIT_BASE_URL ?? 'https://shipkit.app';
const outputDir = process.env.SHIPKIT_OUTPUT_DIR ?? '.';

export const cli = async () => {
  welcome();

  try {
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
      token: '394965bd_cad7_4c47_af78_5ae9126f3333',
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
  const url = `${baseUrl}/api/build`;
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
