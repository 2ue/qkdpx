import { PublishOptions } from '../types/index.js';
import { Listr } from 'listr2';
import { ChangeDetector } from '../modules/ChangeDetector.js';
import { CommitManager } from '../modules/CommitManager.js';
import { VersionManager } from '../modules/VersionManager.js';
import { PublishManager } from '../modules/PublishManager.js';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

export async function publishCommand(options: PublishOptions) {
  const spinner = ora('Initializing qkdpx...').start();

  // Create shared instances to avoid recreating
  const changeDetector = new ChangeDetector();
  const commitManager = new CommitManager();
  const versionManager = new VersionManager();
  const publishManager = new PublishManager();

  let packageInfo: any;
  let originalVersion: string = '';
  let newVersion: string = '';

  try {
    // Step 1: Detect changes and get package info
    spinner.text = 'Detecting changes...';
    const gitStatus = await changeDetector.checkGitStatus();
    packageInfo = await changeDetector.getPackageInfo();
    originalVersion = packageInfo.version;
    spinner.succeed('🔍 Changes detected');

    // Step 2: Handle commits if needed
    if (gitStatus.hasUncommitted) {
      spinner.text = 'Handling uncommitted changes...';
      await commitManager.handleCommits(gitStatus);
      spinner.succeed('📝 Commits managed');
    } else {
      console.log('📝 No uncommitted changes found');
    }

    // Step 3: Select version and update package.json (don't commit yet)
    spinner.stop();
    newVersion = await versionManager.selectAndUpdateVersion(
      packageInfo,
      options.version
    );
    console.log(chalk.green(`🏷️ Version prepared: ${newVersion}`));

    // Step 4: Final confirmation (interactive) - only if not skipping
    if (!options.skipConfirm) {
      const { confirmed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Ready to publish ${chalk.blue(packageInfo.name)}@${chalk.green(newVersion)}?`,
          default: true,
        },
      ]);

      if (!confirmed) {
        console.log(chalk.yellow('⚠️  Publishing cancelled by user'));
        // Revert version changes
        if (newVersion !== originalVersion) {
          await versionManager.revertVersionChange(
            packageInfo,
            originalVersion
          );
        }
        process.exit(0);
      }
    }

    // Step 5: Build and Publish (but don't commit yet)
    const buildAndPublishTasks = new Listr([
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

    await buildAndPublishTasks.run();

    // Step 6: After successful publish, commit version and create tag
    if (!options.dryRun) {
      console.log(chalk.green('✅ Package published successfully!'));

      // Now commit version change and create tag
      await commitManager.commitVersionAfterPublish(
        newVersion,
        originalVersion
      );

      // Optional: Push to remote
      await commitManager.pushToRemote();
    } else {
      console.log(
        chalk.blue('🎯 Dry run completed - no actual publishing performed')
      );
      // Revert version changes for dry run
      if (newVersion !== originalVersion) {
        await versionManager.revertVersionChange(packageInfo, originalVersion);
      }
    }
  } catch (error) {
    spinner.stop();

    // If we updated the version but publishing failed, revert the version change
    if (newVersion && originalVersion && newVersion !== originalVersion) {
      console.log(chalk.yellow('⚠️ Reverting version changes...'));
      try {
        await versionManager.revertVersionChange(packageInfo, originalVersion);
        console.log(chalk.green('🔄 Version reverted successfully'));
      } catch (revertError) {
        console.log(chalk.red('❌ Failed to revert version changes'));
      }
    }

    console.error(
      chalk.red('❌ Publishing failed:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
