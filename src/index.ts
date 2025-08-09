import { Command } from 'commander';
import { publishCommand } from './commands/publish.js';
import { initCommand } from './commands/init.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('qkdpx')
  .description('A fast and modern CLI tool for npm package publishing')
  .version('0.1.0');

program
  .command('publish')
  .description('Publish package to npm with automated workflow')
  .option('-v, --version <type>', 'version bump type (patch|minor|major)')
  .option('--skip-confirm', 'skip confirmation prompts')
  .option('--dry-run', 'perform a dry run without making changes')
  .action(publishCommand);

program
  .command('init')
  .description('Initialize qkdpx configuration file')
  .option('--global', 'initialize global configuration')
  .option('--show', 'show current configuration')
  .action(initCommand);

program.parse();