---
name: jobtiger-search
version: 1.0.0
description: >
  Search live job listings on JobTiger (jobtiger.bg), Bulgaria, or fetch a JobTiger job's full
  description. Use for jobs in Bulgaria (Sofia, Plovdiv, Varna, remote from Bulgaria).
  Trigger phrases: jobtiger, jobs in Bulgaria, jobs in Sofia, Bulgarian jobs, обяви за работа,
  работа София, търся работа, IT работа България.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/jobtiger-search/cli/src/cli.ts *)
---

# JobTiger Search Skill

Search live job listings from JobTiger's public pages (Bulgaria). No authentication, zero
runtime dependencies.

> ⚠️ **Personal use only.** This reads JobTiger's public pages. Keep volume low and do not
> use it commercially or for bulk collection. `robots.txt` allows `/obiavi-za-rabota/`
> (search and job pages).

## Commands

### search

```bash
bun run .agents/skills/jobtiger-search/cli/src/cli.ts search -q "<keywords>" [flags]
```

- `--query` / `-q <text>` — **required.** Keywords (English or Bulgarian).
- `--jobage <days>` — keep jobs posted within N days (client-side).
- `--page <n>` — only `1`. The page returns its first 12 results server-side and loads the rest
  by script, ignoring any page parameter.
- `--limit` / `-n <n>` — cap results emitted.
- `--format json|table|plain` — default `json`.

### detail

```bash
bun run .agents/skills/jobtiger-search/cli/src/cli.ts detail <job url> [--format json|plain]
```

Takes the `url` from search output. Returns company, location, posted date, deadline
(`validThrough`), employment type and the full description.

## Examples

```bash
bun run .agents/skills/jobtiger-search/cli/src/cli.ts search -q "embedded" --format table
bun run .agents/skills/jobtiger-search/cli/src/cli.ts search -q "devops" --jobage 14 --format table
bun run .agents/skills/jobtiger-search/cli/src/cli.ts search -q "linux" --format plain
bun run .agents/skills/jobtiger-search/cli/src/cli.ts detail "https://www.jobtiger.bg/obiavi-za-rabota/embedded-linux-software-engineer-328780-2" --format plain
```

## Output

| Field | Search | Detail |
|-------|--------|--------|
| `id`, `title`, `company`, `location`, `date`, `url` | ✓ | ✓ |
| `deadline`, `employmentType`, `description` | | ✓ |

Errors go to stderr as `{ "error", "code" }` with exit code 1.

## Notes

- **12 results per search.** Use specific keywords (`embedded`, `devops`, `linux`, `c++`).
- Many tech ads are written in English, but Bulgarian-only ads usually require Bulgarian, which
  fails the Language Gate. Check the description.
- Locations are in Cyrillic (`София` = Sofia). Recruitment agencies (e.g. Cross Source) post
  many of the embedded roles.
