import { config } from '@/config';
import { OllamaClient } from '@/external/ollama';
import { logger } from '@/logger';
import { input, select } from '@inquirer/prompts';

export class Init {
  async init(): Promise<void> {
    const pat = await input({ message: 'GitHub PAT', required: true });

    const ollamaHost = await input({ message: 'Ollama host', default: 'http://localhost:11434' });
    const ollamaApiKey = await input({ message: 'Ollama API key' });

    const ollama = new OllamaClient({
      host: ollamaHost,
      apiKey: ollamaApiKey,
    });

    if (!(await ollama.healthCheck())) {
      logger.error('Ollama is not running. Please check the host and API key.');
      return;
    }

    let embedModel: string | undefined;

    const models = await ollama.listModels();
    if (models.length > 0) {
      const selectedModel = await select({
        message: 'Select an embed model',
        choices: [
          {
            name: '(download another model)',
            value: '(none)',
          },
        ].concat(
          models.map((model) => ({
            name: model,
            value: model,
          })),
        ),
        default: '(none)',
      });
      if (selectedModel !== '(none)') {
        embedModel = selectedModel;
      }
    }

    if (!embedModel) {
      embedModel = await select({
        message: 'Select an embed model to install',
        choices: [
          {
            name: 'nomic-embed-text (137M)',
            value: 'nomic-embed-text',
            description: 'A high-performing open embedding model with a large token context window.',
          },
          {
            name: 'paraphrase-multilingual (278M)',
            value: 'paraphrase-multilingual',
            description: 'Sentence-transformers model that can be used for tasks like clustering or semantic search.',
          },
          {
            name: 'mxbai-embed-large (335M)',
            value: 'mxbai-embed-large',
            description: 'State-of-the-art large embedding model from mixedbread.ai',
          },
          {
            name: 'bge-m3 (567M)',
            value: 'bge-m3',
            description:
              'A new model from BAAI distinguished for its versatility in Multi-Functionality, Multi-Linguality, and Multi-Granularity.',
          },
        ],
        default: 'paraphrase-multilingual',
      });

      logger.info(`Downloading ${embedModel}...`);
      let prevProgress = 0;
      for await (const res of ollama.installModel(embedModel)) {
        if (res.completed) {
          const progress = Math.floor((res.completed / res.total) * 100);
          if (progress >= prevProgress + 5) {
            logger.log(`Ollama: ${res.status} (${progress}%)`);
            prevProgress = progress;
          }
        } else {
          logger.log(`Ollama: ${res.status}`);
        }
      }
      logger.info('Download complete!');
    }

    config.pat = pat;
    config.ollamaHost = ollamaHost;
    config.ollamaApiKey = ollamaApiKey;
    config.embedModel = embedModel;
    logger.info('Configuration complete!');
  }
}
