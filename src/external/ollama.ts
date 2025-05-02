import { Ollama } from 'ollama';

export interface OllamaClientOptions {
  host?: string;
  apiKey?: string;
  embedModel?: string;
}

export class OllamaClient {
  constructor(private readonly options: OllamaClientOptions) {
    this.ollama = new Ollama({
      host: options.host ? options.host : 'http://localhost:11434',
      headers: options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : undefined,
    });
  }

  private readonly ollama: Ollama;

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(this.options.host ?? 'http://localhost:11434', {
        method: 'GET',
        headers: this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : undefined,
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.text();
      return data.includes('Ollama is running');
    } catch (err) {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    const res = await this.ollama.list();
    return res.models.map((model) => model.name);
  }

  async *installModel(model: string) {
    yield* await this.ollama.pull({ model, stream: true });
  }

  async embed(text: string): Promise<number[]> {
    if (!this.options.embedModel) {
      throw new Error('Embed model is not set. Please set it in the options.');
    }

    const res = await this.ollama.embed({
      model: this.options.embedModel,
      input: text,
    });
    return res.embeddings[0];
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    if (!this.options.embedModel) {
      throw new Error('Embed model is not set. Please set it in the options.');
    }

    const res = await this.ollama.embed({
      model: this.options.embedModel,
      input: texts,
    });
    return res.embeddings;
  }
}
