import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { PackageInfo } from '../types/index.js';
import { ConfigManager } from '../utils/ConfigManager.js';
import chalk from 'chalk';

const execCommand = (command: string, args: string[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
};

export class PublishManager {
  private configManager = new ConfigManager();

  async publish(packageInfo: PackageInfo, version: string): Promise<void> {
    // Load current configuration
    const config = await this.configManager.loadConfig();
    const summary = await this.configManager.getConfigSummary();

    // Display configuration being used
    console.log(chalk.blue('🔧 Using configuration:'));
    console.log(
      `├── Registry: ${chalk.green(summary.registry.value)} ${chalk.gray(`(${summary.registry.source})`)}`
    );
    if (summary.authToken) {
      console.log(
        `└── Auth token: ${chalk.yellow(summary.authToken.value)} ${chalk.gray(`(${summary.authToken.source})`)}`
      );
    } else {
      console.log(`└── Auth token: ${chalk.red('not configured')}`);
    }
    console.log();

    console.log(
      chalk.blue(
        `📦 Publishing ${packageInfo.name}@${version} to ${config.registry}...`
      )
    );

    // Build npm publish command with CLI parameters
    const publishArgs = [
      'publish',
      `--registry=${config.registry}`,
      '--access=public',
    ];

    // Add auth token parameter if available
    if (config.authToken) {
      const registryUrl = new URL(config.registry);
      publishArgs.push(
        `--//${registryUrl.host}/:_authToken=${config.authToken}`
      );
    }

    // Publish to npm using command line parameters
    await execCommand('npm', publishArgs);
  }

  async runBuildIfExists(): Promise<void> {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = await fs.readJson(packagePath);

    if (packageJson.scripts?.build) {
      console.log(chalk.blue('🔨 Running build script...'));
      await execCommand('npm', ['run', 'build']);
    }
  }
}
