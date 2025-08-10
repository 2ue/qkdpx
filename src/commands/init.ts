import inquirer from 'inquirer';
import { ConfigManager } from '../utils/ConfigManager.js';
import chalk from 'chalk';

export async function initCommand(options: {
  global?: boolean;
  show?: boolean;
}): Promise<void> {
  const configManager = new ConfigManager();

  // Show current configuration
  if (options.show) {
    await showConfig(configManager);
    return;
  }

  // Only support global config initialization
  await initGlobalConfig(configManager);
}

async function showConfig(configManager: ConfigManager): Promise<void> {
  console.log(chalk.blue('🔧 Current qkdpx configuration:'));
  console.log();

  const summary = await configManager.getConfigSummary();

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
}

async function initGlobalConfig(configManager: ConfigManager): Promise<void> {
  console.log(chalk.blue('🌍 Initializing qkdpx configuration...'));
  console.log(
    chalk.gray(
      'Config will be stored in: ' + configManager.getGlobalConfigPath()
    )
  );
  console.log();

  // Load existing configuration
  let existingConfig: { registry?: string; authToken?: string } = {};
  let hasExisting = false;

  if (await configManager.globalConfigExists()) {
    hasExisting = true;
    existingConfig = await configManager.loadGlobalConfig();

    console.log(chalk.blue('📋 Current configuration:'));
    console.log(
      `├── Registry: ${chalk.green(existingConfig.registry || 'https://registry.npmjs.org/')}`
    );
    if (existingConfig.authToken) {
      // Mask the token for display
      const masked =
        existingConfig.authToken.length > 6
          ? existingConfig.authToken.slice(0, 3) +
            '***' +
            existingConfig.authToken.slice(-3)
          : existingConfig.authToken;
      console.log(`└── Auth token: ${chalk.yellow(masked)}`);
    } else {
      console.log(`└── Auth token: ${chalk.red('not configured')}`);
    }
    console.log();
    console.log(
      chalk.gray(
        '💡 Press Enter to keep current values, or type new values to update.'
      )
    );
    console.log();
  }

  // Get registry and auth token with existing values as defaults
  const config = await inquirer.prompt([
    {
      type: 'input',
      name: 'registry',
      message: hasExisting
        ? `NPM Registry URL (current: ${existingConfig.registry || 'https://registry.npmjs.org/'}):`
        : 'NPM Registry URL:',
      default: existingConfig.registry || 'https://registry.npmjs.org/',
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
      message:
        hasExisting && existingConfig.authToken
          ? 'Auth Token (leave empty to keep current, type new to update):'
          : 'Auth Token (optional):',
      mask: '*',
    },
  ]);

  // If auth token is empty and we have an existing one, keep the existing
  if (!config.authToken && existingConfig.authToken) {
    config.authToken = existingConfig.authToken;
  }

  try {
    await configManager.saveGlobalConfig(config);
    console.log();
    if (hasExisting) {
      console.log(chalk.green('✅ Configuration updated successfully!'));
    } else {
      console.log(chalk.green('✅ Configuration created successfully!'));
    }
    console.log(
      chalk.gray(`   Location: ${configManager.getGlobalConfigPath()}`)
    );
    console.log();
  } catch (error) {
    console.error(
      chalk.red('❌ Failed to save configuration:'),
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}
