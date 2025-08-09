import inquirer from 'inquirer';
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
    console.log(`├── Registry: ${chalk.green(summary.registry.value)} ${chalk.gray(`(${summary.registry.source})`)}`);
    if (summary.authToken) {
      console.log(`└── Auth token: ${chalk.yellow(summary.authToken.value)} ${chalk.gray(`(${summary.authToken.source})`)}`);
    } else {
      console.log(`└── Auth token: ${chalk.red('not configured')}`);
    }
    console.log();

    // Check for existing .npmrc
    const npmrcPath = path.join(process.cwd(), '.npmrc');
    const hasNpmrc = await fs.pathExists(npmrcPath);

    if (!hasNpmrc && !config.authToken) {
      await this.configureRegistry();
    } else if (!hasNpmrc && config.authToken) {
      // Create temporary .npmrc with our config
      await this.createTempNpmrc(config);
    }

    // Run build if build script exists
    await this.runBuildIfExists();

    // Final confirmation
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Ready to publish ${chalk.blue(packageInfo.name)}@${chalk.green(version)}?`,
        default: true,
      },
    ]);

    if (!confirmed) {
      throw new Error('Publishing cancelled by user');
    }

    // Publish to npm
    await execCommand('npm', ['publish']);
  }

  private async createTempNpmrc(config: { registry: string; authToken?: string }): Promise<void> {
    const npmrcContent = [
      `registry=${config.registry}`,
      config.authToken ? `${this.getTokenLine(config.registry)}=${config.authToken}` : ''
    ].filter(Boolean).join('\n');

    await fs.writeFile(path.join(process.cwd(), '.npmrc'), npmrcContent);
    console.log(chalk.blue('📝 Created temporary .npmrc file'));
  }

  private async configureRegistry(): Promise<void> {
    const { registryChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'registryChoice',
        message: 'Select npm registry:',
        choices: [
          { name: 'NPM (https://registry.npmjs.org/)', value: 'npm' },
          { name: 'Custom registry', value: 'custom' },
        ],
      },
    ]);

    let registry = 'https://registry.npmjs.org/';

    if (registryChoice === 'custom') {
      const { customRegistry } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customRegistry',
          message: 'Enter registry URL:',
          validate: (input: string) => {
            try {
              new URL(input);
              return true;
            } catch {
              return 'Please enter a valid URL';
            }
          },
        },
      ]);
      registry = customRegistry;
    }

    const { authMethod } = await inquirer.prompt([
      {
        type: 'list',
        name: 'authMethod',
        message: 'Choose authentication method:',
        choices: [
          { name: 'Login with username/password', value: 'login' },
          { name: 'Use auth token', value: 'token' },
        ],
      },
    ]);

    if (authMethod === 'login') {
      console.log(chalk.blue('Please login to npm:'));
      await execCommand('npm', ['login', '--registry', registry]);
    } else {
      const { token } = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Enter your auth token:',
          validate: (input: string) => {
            if (!input.trim()) {
              return 'Token cannot be empty';
            }
            return true;
          },
        },
      ]);

      // Write .npmrc file
      const npmrcContent = `registry=${registry}\n${this.getTokenLine(registry)}=${token}\n`;
      await fs.writeFile(path.join(process.cwd(), '.npmrc'), npmrcContent);
    }
  }

  private getTokenLine(registry: string): string {
    try {
      const url = new URL(registry);
      return `${url.hostname}${url.pathname}:_authToken`;
    } catch {
      return '_authToken';
    }
  }

  private async runBuildIfExists(): Promise<void> {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = await fs.readJson(packagePath);

    if (packageJson.scripts?.build) {
      console.log(chalk.blue('🔨 Running build script...'));
      await execCommand('npm', ['run', 'build']);
    }
  }
}
