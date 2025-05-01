import { Command } from 'commander';
import { config } from './config';
import { logger } from './logger';

const program = new Command()
  .name('starseeker')
  .description('CLI tool to search starred GitHub repositories in natural language');

const configCmd = program.command('config');
const configSetCmd = configCmd.command('set');
const configGetCmd = configCmd.command('get');

configSetCmd
  .command('pat')
  .description('Set the GitHub Personal Access Token (PAT)')
  .argument('<pat>', 'GitHub Personal Access Token')
  .action((pat: string) => {
    config.pat = pat;
    logger.info('GitHub Personal Access Token set successfully.');
  });
configGetCmd
  .command('pat')
  .description('Get the GitHub Personal Access Token (PAT)')
  .action(() => {
    const pat = config.pat;
    if (pat) {
      logger.info(`GitHub Personal Access Token: ${pat}`);
    } else {
      logger.warn('GitHub Personal Access Token not set.');
    }
  });

program.parse(process.argv);
