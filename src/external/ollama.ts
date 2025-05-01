import { Ollama } from 'ollama';

export interface OllamaClientOptions {
  host?: string;
  apiKey?: string;
  embedModel: string;
}

export class OllamaClient {
  constructor(private readonly options: OllamaClientOptions) {
    this.ollama = new Ollama({
      host: options.host ? options.host : 'http://localhost:11434',
      headers: options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : undefined,
    });
  }

  private readonly ollama: Ollama;

  async embed(text: string): Promise<number[]> {
    const res = await this.ollama.embed({
      model: this.options.embedModel,
      input: text,
    });
    return res.embeddings[0];
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    const res = await this.ollama.embed({
      model: this.options.embedModel,
      input: texts,
    });
    return res.embeddings;
  }
}
