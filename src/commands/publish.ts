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
    // Step 1: Detect changes and get package info
    spinner.text = 'Detecting changes...';
    const gitStatus = await changeDetector.checkGitStatus();
    const packageInfo = await changeDetector.getPackageInfo();
    spinner.succeed('🔍 Changes detected');

    // Step 2: Handle commits if needed
    if (gitStatus.hasUncommitted) {
      spinner.text = 'Handling uncommitted changes...';
      await commitManager.handleCommits(gitStatus);
      spinner.succeed('📝 Commits managed');
    } else {
      console.log('📝 No uncommitted changes found');
    }

    // Step 3: Get version bump type (interactive)
    spinner.stop();
    const newVersion = await versionManager.bumpVersion(packageInfo, options.version);
    console.log(chalk.green(`🏷️ Version bumped to ${newVersion}`));

    // Step 4: Run remaining tasks with Listr2
    const finalTasks = new Listr([
      {
        title: '🔨 Building project',
        task: async () => {
          await publishManager.runBuildIfExists();
        },
      },
      {
        title: '📦 Publishing package',
        task: async () => {
          await publishManager.publish(packageInfo, newVersion);
        },
        skip: () => !!options.dryRun,
      },
    ]);

    await finalTasks.run();

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
