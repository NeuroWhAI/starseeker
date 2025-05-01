import Conf from 'conf';

export class Config {
  private readonly config = new Conf({ projectName: 'starseeker' });

  get pat(): string | undefined {
    return this.config.get('pat');
  }

  set pat(pat: string) {
    this.config.set('pat', pat);
  }
}

export const config = new Config();
