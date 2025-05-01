import { createHash } from 'node:crypto';
import { config } from '@/config';
import { Database } from '@/external/db';
import { GitHubClient } from '@/external/github';
import { OllamaClient } from '@/external/ollama';
import { logger } from '@/logger';
import { ServiceError } from './error';

export class Indexer {
  private readonly db: Database = Database.getInstance();

  async index(): Promise<void> {
    if (!config.pat) {
      throw new ServiceError('GitHub PAT is not set. Please set it in the config.');
    }
    if (!config.embedModel) {
      throw new ServiceError('Ollama embed model is not set. Please set it in the config.');
    }

    const github = new GitHubClient(config.pat);
    const ollama = new OllamaClient({
      embedModel: config.embedModel,
      host: config.ollamaHost,
      apiKey: config.ollamaApiKey,
    });

    logger.info('Indexing starred repositories...');

    let count = 0;
    for await (const repo of github.listStarredRepos()) {
      const { full_name, description } = repo;
      if (description) {
        const hash = createHash('sha256').update(description).digest('hex');
        if ((await this.db.countByHash(hash)) === 0) {
          logger.log(` - ${full_name}`);

          const document = `${full_name}:\n${description}`;
          const embedding = await ollama.embed(document);

          await this.db.add(full_name, embedding, document, hash);
        } else {
          logger.log(` - ${full_name} (already indexed)`);
        }

        count += 1;
      } else {
        logger.warn(`No description for repository: ${full_name}`);
      }
    }

    logger.info(`Indexed ${count} repositories.`);
  }
}
