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
    const message = `chore: bump version to ${version}`;
    await GitHelper.add('package.json');
    await GitHelper.commit(message);
    await GitHelper.tag(`v${version}`);
  }
}
