import { join } from 'node:path';
import { config } from '@/config';
import { LocalIndex } from 'vectra';

export interface SearchResult {
  score: number;
  text: string;
}

export class Database {
  private static instance: Database | null = null;
  private db: LocalIndex;

  private constructor(path: string) {
    this.db = new LocalIndex(path);
  }

  static getInstance(): Database {
    if (!Database.instance) {
      const dbPath = join(config.dir, 'db');
      Database.instance = new Database(dbPath);
    }
    return Database.instance;
  }

  async countByHash(hash: string): Promise<number> {
    if (!(await this.db.isIndexCreated())) {
      return 0;
    }

    const items = await this.db.listItemsByMetadata({ hash });
    return items.length;
  }

  async add(id: string, vector: number[], text: string, hash: string) {
    if (!(await this.db.isIndexCreated())) {
      await this.db.createIndex();
    }

    const items = await this.db.listItemsByMetadata({ id });
    if (items.length > 0) {
      await this.db.upsertItem({
        id: items[0].id,
        vector,
        metadata: { id, text, hash },
      });
    } else {
      await this.db.insertItem({
        vector,
        metadata: { id, text, hash },
      });
    }
  }

  async search(vector: number[], k: number): Promise<SearchResult[]> {
    if (!(await this.db.isIndexCreated())) {
      return [];
    }

    const res = await this.db.queryItems(vector, k);
    return res.map((r) => ({
      score: r.score,
      text: r.item.metadata.text as string,
    }));
  }
}
