import { Listr } from 'listr2';
import { ChangeDetector } from '../modules/ChangeDetector.js';
import { CommitManager } from '../modules/CommitManager.js';
import { VersionManager } from '../modules/VersionManager.js';
import { GitHelper } from '../utils/GitHelper.js';
import type { PackageInfo } from '../types/index.js';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';

export async function releaseCommand(options: {
  version?: 'patch' | 'minor' | 'major';
  skipConfirm?: boolean;
  message?: string;
}): Promise<void> {
  const spinner = ora('🚀 Release Process').start();

  // Initialize managers
  const changeDetector = new ChangeDetector();
  const commitManager = new CommitManager();
  const versionManager = new VersionManager();

  let packageInfo: PackageInfo | undefined;
  let currentVersion = '';
  let newVersion = '';

  try {
    // 1. Check git repository and get package info
    spinner.text = 'Checking repository...';
    const gitStatus = await GitHelper.checkStatus();
    packageInfo = await changeDetector.getPackageInfo();
    currentVersion = packageInfo.version;
    spinner.succeed('Repository checked');

    // 2. Handle uncommitted changes
    if (gitStatus.hasUncommitted) {
      spinner.text = 'Handling uncommitted changes...';
      await commitManager.handleCommits(gitStatus);
      spinner.succeed('Changes committed');
    } else {
      console.log(chalk.green('✓ Working directory is clean'));
    }

    // 3. Ask if should bump version
    if (!options.skipConfirm) {
      const { shouldBumpVersion } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldBumpVersion',
          message: `Current version is ${chalk.cyan(currentVersion)}. Do you want to bump the version?`,
          default: true,
        },
      ]);

      if (!shouldBumpVersion) {
        newVersion = currentVersion;
        console.log(
          chalk.yellow('Version unchanged, will tag current version')
        );
      } else {
        // Select version type
        newVersion = await versionManager.selectAndUpdateVersion(
          packageInfo,
          options.version
        );
        console.log(chalk.green(`Version bumped to ${newVersion}`));
      }
    } else {
      // Auto bump version if specified
      if (options.version) {
        newVersion = await versionManager.selectAndUpdateVersion(
          packageInfo,
          options.version
        );
        console.log(chalk.green(`Version bumped to ${newVersion}`));
      } else {
        newVersion = currentVersion;
      }
    }

    // 4. Create and execute release workflow
    const releaseWorkflow = new Listr([
      {
        title: 'Commit version changes',
        task: async () => {
          if (newVersion !== currentVersion) {
            await GitHelper.add('package.json');
            await GitHelper.commit(`chore: bump version to ${newVersion}`);
          }
        },
        skip: () => newVersion === currentVersion,
      },
      {
        title: `Create and push tag v${newVersion}`,
        task: async () => {
          const tagName = `v${newVersion}`;

          // Check if tag already exists
          const tagExists = await GitHelper.tagExists(tagName);
          if (tagExists) {
            if (!options.skipConfirm) {
              const { overwrite } = await inquirer.prompt([
                {
                  type: 'confirm',
                  name: 'overwrite',
                  message: `Tag ${tagName} already exists. Overwrite?`,
                  default: false,
                },
              ]);

              if (!overwrite) {
                throw new Error(`Tag ${tagName} already exists`);
              }

              // Delete existing tag
              await GitHelper.deleteTag(tagName);
            } else {
              throw new Error(`Tag ${tagName} already exists`);
            }
          }

          // Create new tag
          await GitHelper.tag(tagName);

          // Push commits and tags
          await GitHelper.push({ tags: true });
        },
      },
    ]);

    await releaseWorkflow.run();

    // 5. Final confirmation
    if (!options.skipConfirm) {
      const { confirmRelease } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmRelease',
          message: `Release v${newVersion} has been pushed. GitHub Actions will now build and publish. Continue?`,
          default: true,
        },
      ]);

      if (!confirmRelease) {
        console.log(
          chalk.yellow('Release process completed but confirmation declined')
        );
        process.exit(0);
      }
    }

    console.log(
      chalk.green.bold(
        `🎉 Release v${newVersion} initiated! GitHub Actions will handle the build and publish process.`
      )
    );
    console.log(
      chalk.blue(
        '🔗 Check the GitHub Actions tab in your repository for build progress'
      )
    );
  } catch (error) {
    spinner.stop();

    // Error recovery - rollback version if changed
    if (
      packageInfo &&
      newVersion &&
      currentVersion &&
      newVersion !== currentVersion
    ) {
      console.log(chalk.red('Rolling back version changes...'));
      try {
        await versionManager.revertVersionChange(packageInfo, currentVersion);
        console.log(chalk.green('✓ Version rollback completed'));
      } catch (revertError) {
        console.log(chalk.red('⚠ Failed to rollback version changes'));
      }
    }

    console.error(
      chalk.red('Release failed:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
