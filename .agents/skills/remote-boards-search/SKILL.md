---
name: remote-boards-search
version: 1.0.0
description: >
  Search remote software and engineering jobs across Remote OK, Remotive, and
  We Work Remotely using their public job feeds/APIs, or fetch a job's detail page.
  Trigger phrases: remote worldwide jobs, remote software jobs, remote engineering
  vacancies, search remote jobs across boards.
context: fork
enabled: true  # set to false to keep installed but skip during /scrape
allowed-tools: Bash(bun run .agents/skills/remote-boards-search/cli/src/cli.ts *)
---

# Remote Boards Search

Search three independent remote-job sources through one dependency-free CLI:
Remote OK (public JSON feed), Remotive (public API), and We Work Remotely (public RSS).
The CLI emits the same normalized result shape expected by `/scrape`, so it is
discovered automatically alongside LinkedIn and freehire.

## Data-source notes

- **Remote OK:** public feed; the service requests a descriptive User-Agent. Keep
  requests low-volume and follow the site's current terms and access rules.
- **Remotive:** public remote-jobs API. Its API documentation asks users to respect
  caching and rate limits; results can be delayed and are not a guarantee of an active vacancy.
- **We Work Remotely:** public RSS feed for remote programming jobs. Coverage is
  category-limited by the feed URL and may omit non-programming roles.
- All sources are best-effort and can change their response formats. The CLI reports
  per-source failures on stderr and continues with other sources.

## Commands

```bash
bun run .agents/skills/remote-boards-search/cli/src/cli.ts search -q "embedded linux" --jobage 14 --limit 20 --format json
bun run .agents/skills/remote-boards-search/cli/src/cli.ts search -q "devops" --source remotive,remoteok --format table
bun run .agents/skills/remote-boards-search/cli/src/cli.ts detail "https://example.com/job-url" --format json
```

Flags:
- `--query` / `-q`: keyword filter; optional.
- `--jobage <days>`: keep jobs published within the last N days when a source provides dates.
- `--limit` / `-n`: maximum combined results (default 25).
- `--page <n>`: page number, applied to the combined result set.
- `--source <names>`: comma-separated subset of `remoteok,remotive,weworkremotely`.
- `--format json|table|plain`: output format (default json).

JSON output: `{ "meta": { "count", "page", "total }, "results": [...] }`.
Each result contains `id`, `title`, `company`, `location`, `date`, `url`,
`description`, and `source`. Missing data is `null`, never guessed. The `source`
field identifies the underlying board. Detail accepts a full HTTP(S) job URL and
extracts readable page text on a best-effort basis.
