import inquirer from 'inquirer';
import { GitHelper } from '../utils/GitHelper.js';
import { GitStatus } from '../types/index.js';
import chalk from 'chalk';

export class CommitManager {
  async handleCommits(gitStatus: GitStatus): Promise<void> {
    if (!gitStatus.hasUncommitted) {
      return;
    }

    console.log(chalk.yellow('⚠️  Uncommitted changes detected'));

    const { shouldCommit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldCommit',
        message: 'Do you want to commit the changes before publishing?',
        default: true,
      },
    ]);

    if (!shouldCommit) {
      console.log(
        chalk.yellow('⚠️  Skipping commit - continuing with publish')
      );
      return;
    }

    const { commitMessage } = await inquirer.prompt([
      {
        type: 'input',
        name: 'commitMessage',
        message: 'Enter commit message:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Commit message cannot be empty';
          }
          return true;
        },
      },
    ]);

    await GitHelper.add('.');
    await GitHelper.commit(commitMessage);
  }

  async commitVersionAfterPublish(
    version: string,
    originalVersion: string
  ): Promise<void> {
    const tagName = `v${version}`;

    // Only commit and tag if version was actually changed
    if (version === originalVersion) {
      console.log(chalk.blue('📝 No version change - skipping commit and tag'));
      return;
    }

    const tagExists = await GitHelper.tagExists(tagName);

    if (tagExists) {
      console.log(chalk.yellow(`⚠️ Tag ${tagName} already exists`));
      const { shouldOverwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldOverwrite',
          message: `Tag ${tagName} already exists. Do you want to overwrite it?`,
          default: false,
        },
      ]);

      if (!shouldOverwrite) {
        throw new Error(`Tag creation cancelled: ${tagName} already exists`);
      }

      // Delete existing tag
      console.log(chalk.blue(`🏷️ Removing existing tag ${tagName}...`));
      await GitHelper.deleteTag(tagName);
    }

    const message = `chore: bump version to ${version}`;
    console.log(chalk.blue(`📝 Committing version ${version}...`));
    await GitHelper.add('package.json');
    await GitHelper.commit(message);

    console.log(chalk.blue(`🏷️ Creating tag ${tagName}...`));
    await GitHelper.tag(tagName);
  }

  async pushToRemote(): Promise<void> {
    const { shouldPush } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldPush',
        message: 'Push commits and tags to remote repository?',
        default: false,
      },
    ]);

    if (shouldPush) {
      try {
        console.log(chalk.blue('📤 Pushing to remote...'));
        await GitHelper.push();
        await GitHelper.push({ tags: true });
        console.log(chalk.green('✅ Pushed to remote successfully'));
      } catch (error) {
        console.log(chalk.yellow('⚠️ Failed to push to remote:'));
        console.log(chalk.red(error instanceof Error ? error.message : String(error)));
        console.log(chalk.blue('💡 You can manually push later with: git push origin --tags'));
      }
    }
  }
}
