import inquirer from 'inquirer';
import { ConfigManager } from '../utils/ConfigManager.js';
import chalk from 'chalk';

export async function initCommand(options: { global?: boolean; show?: boolean }): Promise<void> {
  const configManager = new ConfigManager();

  // Show current configuration
  if (options.show) {
    await showConfig(configManager);
    return;
  }

  // Initialize global or project config
  if (options.global) {
    await initGlobalConfig(configManager);
  } else {
    await initProjectConfig(configManager);
  }
}

async function showConfig(configManager: ConfigManager): Promise<void> {
  console.log(chalk.blue('🔧 Current qkdpx configuration:'));
  console.log();

  const summary = await configManager.getConfigSummary();

  console.log(`├── Registry: ${chalk.green(summary.registry.value)} ${chalk.gray(`(${summary.registry.source})`)}`);
  
  if (summary.authToken) {
    console.log(`└── Auth token: ${chalk.yellow(summary.authToken.value)} ${chalk.gray(`(${summary.authToken.source})`)}`);
  } else {
    console.log(`└── Auth token: ${chalk.red('not configured')}`);
  }
  
  console.log();
}

async function initGlobalConfig(configManager: ConfigManager): Promise<void> {
  console.log(chalk.blue('🌍 Initializing global qkdpx configuration...'));
  console.log(chalk.gray('Global config will be stored in: ' + configManager.getGlobalConfigPath()));
  console.log();

  // Check if global config already exists
  if (await configManager.globalConfigExists()) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Global configuration already exists. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('⚠️  Initialization cancelled.'));
      return;
    }
  }

  // Get registry and auth token
  const config = await inquirer.prompt([
    {
      type: 'input',
      name: 'registry',
      message: 'NPM Registry URL:',
      default: 'https://registry.npmjs.org/',
      validate: (input: string) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      },
    },
    {
      type: 'password',
      name: 'authToken',
      message: 'Auth Token (optional):',
      mask: '*',
    },
  ]);

  try {
    await configManager.saveGlobalConfig(config);
    console.log();
    console.log(chalk.green('✅ Global configuration saved successfully!'));
    console.log(chalk.gray(`   Location: ${configManager.getGlobalConfigPath()}`));
    console.log();
  } catch (error) {
    console.error(
      chalk.red('❌ Failed to save global configuration:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

async function initProjectConfig(configManager: ConfigManager): Promise<void> {
  console.log(chalk.blue('📁 Initializing project qkdpx configuration...'));
  console.log(chalk.gray('Project config will be stored in: ' + configManager.getProjectConfigPath()));
  console.log();

  // Check if project config already exists
  if (await configManager.projectConfigExists()) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Project configuration ${chalk.yellow('.qkdpxrc')} already exists. Overwrite?`,
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.yellow('⚠️  Initialization cancelled.'));
      return;
    }
  }

  // Only get registry for project config
  const config = await inquirer.prompt([
    {
      type: 'input',
      name: 'registry',
      message: 'NPM Registry URL:',
      default: 'https://registry.npmjs.org/',
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

  try {
    await configManager.saveProjectConfig(config);
    console.log();
    console.log(chalk.green('✅ Project configuration saved successfully!'));
    console.log(chalk.gray(`   Location: ${configManager.getProjectConfigPath()}`));
    console.log();
    console.log(chalk.blue('💡 To configure auth token, run:'));
    console.log(chalk.white('   qkdpx init --global'));
    console.log();
  } catch (error) {
    console.error(
      chalk.red('❌ Failed to save project configuration:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}