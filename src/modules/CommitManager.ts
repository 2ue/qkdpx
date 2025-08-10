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
      throw new Error('Publishing cancelled: uncommitted changes detected');
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

  async commitVersion(version: string): Promise<void> {
    const tagName = `v${version}`;
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
        throw new Error(`Publishing cancelled: tag ${tagName} already exists`);
      }

      // Delete existing tag
      console.log(chalk.blue(`🏷️ Removing existing tag ${tagName}...`));
      await GitHelper.deleteTag(tagName);
    }

    const message = `chore: bump version to ${version}`;
    await GitHelper.add('package.json');
    await GitHelper.commit(message);
    await GitHelper.tag(tagName);
  }

  async cleanupVersionTag(version: string): Promise<void> {
    try {
      await GitHelper.deleteTag(`v${version}`);
    } catch (error) {
      // Ignore errors if tag doesn't exist
    }
  }
}
