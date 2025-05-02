import { Command } from 'commander';
import { config } from './config';
import { Database } from './external/db';
import { logger } from './logger';
import { ServiceError } from './services/error';
import { Indexer } from './services/indexer';
import { Init } from './services/init';
import { Seeker } from './services/seeker';

const program = new Command()
  .name('starseeker')
  .description('CLI tool to search starred GitHub repositories in natural language');

const configCmd = program.command('config').description('Configuration commands');
const configSetCmd = configCmd.command('set').description('Set configuration values');
const configGetCmd = configCmd.command('get').description('Get configuration values');

// PAT Config
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

// Ollama Config
const ollamaConfigSetCmd = configSetCmd.command('ollama').description('Set Ollama configuration');
const ollamaConfigGetCmd = configGetCmd.command('ollama').description('Get Ollama configuration');

// Ollama Host Config
ollamaConfigSetCmd
  .command('host')
  .description('Set the Ollama host')
  .argument('<host>', 'Ollama host URL')
  .action((host: string) => {
    config.ollamaHost = host;
    logger.info('Ollama host set successfully.');
  });
ollamaConfigGetCmd
  .command('host')
  .description('Get the Ollama host')
  .action(() => {
    const host = config.ollamaHost;
    if (host) {
      logger.info(`Ollama host: ${host}`);
    } else {
      logger.warn('Ollama host not set.');
    }
  });

// Ollama API Key Config
ollamaConfigSetCmd
  .command('key')
  .description('Set the Ollama API key')
  .argument('<key>', 'Ollama API key')
  .action((key: string) => {
    config.ollamaApiKey = key;
    logger.info('Ollama API key set successfully.');
  });
ollamaConfigGetCmd
  .command('key')
  .description('Get the Ollama API key')
  .action(() => {
    const key = config.ollamaApiKey;
    if (key) {
      logger.info(`Ollama API key: ${key}`);
    } else {
      logger.warn('Ollama API key not set.');
    }
  });

// Embedding Config
const embedConfigSetCmd = configSetCmd.command('embed').description('Set embedding configuration');
const embedConfigGetCmd = configGetCmd.command('embed').description('Get embedding configuration');

// Embedding Model Config
embedConfigSetCmd
  .command('model')
  .description('Set the embedding model')
  .argument('<model>', 'Embedding model name')
  .action((model: string) => {
    config.embedModel = model;
    logger.info('Embedding model set successfully.');
  });
embedConfigGetCmd
  .command('model')
  .description('Get the embedding model')
  .action(() => {
    const model = config.embedModel;
    if (model) {
      logger.info(`Embedding model: ${model}`);
    } else {
      logger.warn('Embedding model not set.');
    }
  });

// Database Command
const dbCmd = program.command('db').description('Database commands');

// Database Clear Command
dbCmd
  .command('clear')
  .description('Clear the database')
  .action(async () => {
    const db = Database.getInstance();
    try {
      await db.clear();
      logger.info('Database cleared successfully.');
    } catch (error) {
      if (error instanceof ServiceError) {
        logger.error(error.message);
      } else if (error instanceof Error) {
        logger.error('An error occurred:', error);
      } else {
        logger.error(`An unexpected error occurred: ${JSON.stringify(error)}`);
      }
    }
  });

// Init Command
program
  .command('init')
  .description('Initialize the configuration')
  .action(async () => {
    const init = new Init();
    try {
      await init.init();
    } catch (error) {
      if (error instanceof ServiceError) {
        logger.error(error.message);
      } else if (error instanceof Error) {
        logger.error('An error occurred:', error);
      } else {
        logger.error(`An unexpected error occurred: ${JSON.stringify(error)}`);
      }
    }
  });

// Indexer Command
program
  .command('index')
  .description('Index starred repositories')
  .option('-b, --batch <number>', 'Batch size for indexing', '4')
  .action(async (options) => {
    const indexer = new Indexer();
    try {
      const batchSize = options.batch ? Number.parseInt(options.batch, 10) : undefined;
      await indexer.index(batchSize || 4);
    } catch (error) {
      if (error instanceof ServiceError) {
        logger.error(error.message);
      } else if (error instanceof Error) {
        logger.error('An error occurred:', error);
      } else {
        logger.error(`An unexpected error occurred: ${JSON.stringify(error)}`);
      }
    }
  });

// Search Command
program
  .command('search')
  .description('Search indexed repositories')
  .argument('<query...>', 'Search query')
  .option('-k, --k <number>', 'Number of results to return', '5')
  .action(async (query: string[], options) => {
    const seeker = new Seeker();
    try {
      await seeker.search(query.join(' '), options.k ? Number.parseInt(options.k, 10) : undefined);
    } catch (error) {
      if (error instanceof ServiceError) {
        logger.error(error.message);
      } else if (error instanceof Error) {
        logger.error('An error occurred:', error);
      } else {
        logger.error(`An unexpected error occurred: ${JSON.stringify(error)}`);
      }
    }
  });

program.parse(process.argv);
