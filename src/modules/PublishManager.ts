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

const execCommandWithEnv = (
  command: string,
  args: string[],
  env: Record<string, string | undefined>
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
    });

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

    // Create temporary .npmrc file
    const npmrcPath = path.join(process.cwd(), '.npmrc');
    const existingNpmrc = await fs.pathExists(npmrcPath);
    let originalNpmrcContent = '';
    
    if (existingNpmrc) {
      originalNpmrcContent = await fs.readFile(npmrcPath, 'utf-8');
    }

    try {
      // Generate .npmrc content
      const registryUrl = new URL(config.registry);
      const npmrcContent = [
        `registry=${config.registry}`,
        config.authToken ? `//${registryUrl.host}/:_authToken=${config.authToken}` : null,
      ].filter(Boolean).join('\n');

      // Write temporary .npmrc
      await fs.writeFile(npmrcPath, npmrcContent, 'utf-8');

      console.log(
        chalk.blue(
          `📦 Publishing ${packageInfo.name}@${version} to ${config.registry}...`
        )
      );

      // Publish to npm using .npmrc file
      await execCommand('npm', ['publish', '--access', 'public']);
    } finally {
      // Clean up .npmrc file
      try {
        if (existingNpmrc) {
          // Restore original .npmrc
          await fs.writeFile(npmrcPath, originalNpmrcContent, 'utf-8');
        } else {
          // Remove temporary .npmrc
          await fs.remove(npmrcPath);
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Could not clean up .npmrc file'));
      }
    }
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
