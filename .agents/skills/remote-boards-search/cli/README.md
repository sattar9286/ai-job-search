# remote-boards-search

Dependency-free Bun CLI for searching public remote-job listings from Remote OK,
Remotive, and We Work Remotely. No credentials or runtime packages are required.

```bash
bun run src/cli.ts search -q "linux engineer" --jobage 14 --limit 20 --format table
bun run src/cli.ts search --source remoteok,weworkremotely --format json
bun run src/cli.ts detail "https://remoteok.com/remote-jobs/..."
```

The search command combines available results and continues when one board fails.
Output is normalized for the repository's `/scrape` workflow. Public feeds may be
delayed or change shape; respect each site's current terms and rate limits.
