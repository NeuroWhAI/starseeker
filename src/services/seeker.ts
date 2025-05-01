import { config } from '@/config';
import { Database, type SearchResult } from '@/external/db';
import { OllamaClient } from '@/external/ollama';
import { logger } from '@/logger';
import chalk from 'chalk';

export class Seeker {
  private readonly db: Database = Database.getInstance();

  async search(query: string, k?: number): Promise<void> {
    if (!config.embedModel) {
      throw new Error('Ollama embed model is not set. Please set it in the config.');
    }

    const ollama = new OllamaClient({
      embedModel: config.embedModel,
      host: config.ollamaHost,
      apiKey: config.ollamaApiKey,
    });

    const embedding = await ollama.embed(query);
    let items = await this.db.search(embedding, k ?? 5);

    items = items.filter((item) => item.score > 0.1);

    if (items.length === 0) {
      logger.info('No results found.');
      return;
    }

    logger.info('Search results:\n');

    for (const item of items) {
      const { text } = item as SearchResult;
      const splitIdx = text.indexOf(':');
      const repo = splitIdx < 0 ? text : text.substring(0, splitIdx);
      const description = splitIdx < 0 ? '' : text.substring(splitIdx + 1).trim();
      const url = `https://github.com/${chalk.bgBlack.yellowBright(repo)}`;
      logger.log(` - ${url}\n   ${description}\n`);
    }
  }
}
