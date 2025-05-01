import { dirname } from 'node:path';
import Conf from 'conf';

export class Config {
  private readonly config = new Conf({ projectName: 'starseeker' });

  get dir(): string {
    return dirname(this.config.path);
  }

  get pat(): string | undefined {
    return this.config.get('pat');
  }

  set pat(pat: string) {
    this.config.set('pat', pat);
  }

  get embedModel(): string | undefined {
    return this.config.get('embedModel');
  }

  set embedModel(model: string) {
    this.config.set('embedModel', model);
  }

  get ollamaHost(): string | undefined {
    return this.config.get('ollamaHost');
  }

  set ollamaHost(host: string) {
    this.config.set('ollamaHost', host);
  }

  get ollamaApiKey(): string | undefined {
    return this.config.get('ollamaApiKey');
  }

  set ollamaApiKey(apiKey: string) {
    this.config.set('ollamaApiKey', apiKey);
  }
}

export const config = new Config();
