import { PublishOptions } from '../types/index.js';
import { Listr } from 'listr2';
import { ChangeDetector } from '../modules/ChangeDetector.js';
import { CommitManager } from '../modules/CommitManager.js';
import { VersionManager } from '../modules/VersionManager.js';
import { PublishManager } from '../modules/PublishManager.js';
import chalk from 'chalk';
import ora from 'ora';

export async function publishCommand(options: PublishOptions) {
  const spinner = ora('Initializing qkdpx...').start();

  // Create shared instances to avoid recreating
  const changeDetector = new ChangeDetector();
  const commitManager = new CommitManager();
  const versionManager = new VersionManager();
  const publishManager = new PublishManager();

  try {
    const tasks = new Listr([
      {
        title: '🔍 Detecting changes',
        task: async (ctx) => {
          ctx.gitStatus = await changeDetector.checkGitStatus();
          ctx.packageInfo = await changeDetector.getPackageInfo();
        },
      },
      {
        title: '📝 Managing commits',
        task: async (ctx) => {
          await commitManager.handleCommits(ctx.gitStatus);
        },
        skip: (ctx) => !ctx.gitStatus.hasUncommitted,
      },
      {
        title: '🏷️ Bumping version',
        task: async (ctx) => {
          ctx.newVersion = await versionManager.bumpVersion(
            ctx.packageInfo,
            options.version
          );
        },
      },
      {
        title: '🔨 Building project',
        task: async () => {
          await publishManager.runBuildIfExists();
        },
      },
      {
        title: '📦 Publishing package',
        task: async (ctx) => {
          await publishManager.publish(ctx.packageInfo, ctx.newVersion);
        },
        skip: () => !!options.dryRun,
      },
    ]);

    spinner.stop();
    await tasks.run();

    console.log(chalk.green('✅ Package published successfully!'));
  } catch (error) {
    spinner.stop();
    console.error(
      chalk.red('❌ Publishing failed:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
