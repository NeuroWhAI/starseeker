import { Octokit } from '@octokit/core';

export class GitHubClient {
  constructor(token: string) {
    this.github = new Octokit({ auth: token });
  }

  private readonly github: Octokit;

  async *listStarredRepos() {
    let page = 1;
    const perPage = 30;

    while (true) {
      const res = await this.github.request('GET /user/starred', {
        'X-GitHub-Api-Version': '2022-11-28',
        per_page: perPage,
        page: page,
      });

      if (res.status !== 200) {
        throw new Error(`Failed to fetch starred repositories: ${res.status}`);
      }

      for (const repo of res.data) {
        yield repo;
      }

      if (res.data.length < perPage) {
        break;
      }

      page += 1;
    }
  }
}
