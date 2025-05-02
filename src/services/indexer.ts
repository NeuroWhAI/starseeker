import { createHash } from 'node:crypto';
import { config } from '@/config';
import { Database } from '@/external/db';
import { GitHubClient } from '@/external/github';
import { OllamaClient } from '@/external/ollama';
import { logger } from '@/logger';
import { ServiceError } from './error';

export class Indexer {
  private readonly db: Database = Database.getInstance();

  async index(batchSize: number): Promise<void> {
    if (batchSize <= 0) {
      throw new ServiceError('Batch size must be greater than 0.');
    }
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

    const batch: { repo: string; document: string; hash: string }[] = [];

    let count = 0;
    for await (const repo of github.listStarredRepos()) {
      const { full_name, description } = repo;
      if (description) {
        const hash = createHash('sha256').update(description).digest('hex');
        if ((await this.db.countByHash(hash)) === 0) {
          logger.log(` - ${full_name}`);

          batch.push({ repo: full_name, document: `${full_name}:\n${description}`, hash });

          if (batch.length >= batchSize) {
            const documents = batch.map((item) => item.document);
            const embeddings = await ollama.embedMany(documents);

            for (let i = 0; i < batch.length; i++) {
              const { repo, document, hash } = batch[i];
              await this.db.add(repo, embeddings[i], document, hash);
            }

            batch.length = 0;
          }
        } else {
          logger.log(` - ${full_name} (already indexed)`);
        }

        count += 1;
      } else {
        logger.warn(`No description for repository: ${full_name}`);
      }
    }

    if (batch.length > 0) {
      const documents = batch.map((item) => item.document);
      const embeddings = await ollama.embedMany(documents);

      for (let i = 0; i < batch.length; i++) {
        const { repo, document, hash } = batch[i];
        await this.db.add(repo, embeddings[i], document, hash);
      }
    }

    logger.info(`Indexed ${count} repositories.`);
  }
}
