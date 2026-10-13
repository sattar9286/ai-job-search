---
name: stepstone-search
version: 1.0.0
description: >
  Search live job listings on StepStone Austria (stepstone.at) and StepStone Belgium
  (stepstone.be), or fetch a StepStone job ad's full description and deadline. Use for
  jobs in Austria, Belgium or Luxembourg (Belgian StepStone also lists Luxembourg roles).
  Trigger phrases: stepstone, stepstone jobs, jobs in Austria, jobs in Vienna, Wien Jobs,
  Stellenangebote Österreich, Jobs Graz, Jobs Linz, jobs in Belgium, jobs Brussels, jobs Gent,
  vacatures België, offres d'emploi Belgique, jobs Luxembourg, embedded jobs Austria,
  DevOps jobs Belgium.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/stepstone-search/cli/src/cli.ts *)
---

# StepStone Search Skill

Search live job listings from StepStone's public pages for **Austria** (`at`, default) and
**Belgium** (`be`, which also carries Luxembourg roles). No authentication, zero runtime
dependencies.

> ⚠️ **Personal use only.** This reads StepStone's public pages. Keep volume low (a handful
> of searches per run), do not use it commercially or for bulk data collection, and run it
> on your own responsibility. The CLI stays inside each market's `robots.txt`: search URLs
> carry no query string, and job-ad URLs are fetched without tracking parameters.

**Not covered:** StepStone Germany (`stepstone.de`) refuses every request from this
environment at its CDN, including `robots.txt` itself, so its rules cannot be checked and it
is not wired in. StepStone Netherlands returns an empty shell page. Use the WebSearch
fallback in `search-queries.md` for those.

## Commands

### search

```bash
bun run .agents/skills/stepstone-search/cli/src/cli.ts search -q "<keywords>" [flags]
```

- `--query` / `-q <text>` — **required.** Job title or skill. Becomes the URL path slug
  (`"embedded linux"` → `/jobs/embedded-linux`; `"c++"` works).
- `--location` / `-l <text>` — city, e.g. `"Wien"`, `"Graz"`, `"Gent"`, `"Brussels"`.
- `--market` / `-m <code>` — `at` (default) or `be`.
- `--jobage <days>` — keep jobs posted within N days. **Filtered client-side**: robots.txt
  disallows StepStone's age parameter.
- `--page <n>` — only `1` is accepted. robots.txt disallows paged search URLs, so each search
  returns at most one page (~25 results). Narrow with `--location` instead.
- `--limit` / `-n <n>` — cap results emitted.
- `--format json|table|plain` — default `json`.

### detail

```bash
bun run .agents/skills/stepstone-search/cli/src/cli.ts detail <job-ad url> [--format json|plain]
```

Takes the `url` from search output (a bare ID cannot be resolved because the ad URL needs its
title slug). Returns title, company, location, posted date, **deadline** (`validThrough`),
employment type, industry and the full description as readable text.

## Examples

```bash
bun run .agents/skills/stepstone-search/cli/src/cli.ts search -q "yocto" --format table
bun run .agents/skills/stepstone-search/cli/src/cli.ts search -q "embedded linux" -l "Wien" --jobage 14 --format table
bun run .agents/skills/stepstone-search/cli/src/cli.ts search -q "devops" -l "Graz" --limit 10
bun run .agents/skills/stepstone-search/cli/src/cli.ts search -q "embedded linux" -m be --jobage 14 --format table
bun run .agents/skills/stepstone-search/cli/src/cli.ts search -q "c++" -m be -l "Brussels" --format table
bun run .agents/skills/stepstone-search/cli/src/cli.ts detail "https://www.stepstone.at/stellenangebote--Embedded-Linux-Engineer-w-m-d-Wien-Mission-Embedded-GmbH--990013-inline.html" --format plain
```

## Output

| Field | Search | Detail | Notes |
|-------|--------|--------|-------|
| `id` | ✓ | ✓ | StepStone listing ID |
| `title` | ✓ | ✓ | |
| `company` | ✓ | ✓ | |
| `location` | ✓ | ✓ | detail adds the country code |
| `date` | ✓ | ✓ | `YYYY-MM-DD` posting date |
| `url` | ✓ | ✓ | tracking parameters removed |
| `snippet` | ✓ | | short matched-text excerpt |
| `validThrough` | ✓ | | listing end date |
| `deadline` | | ✓ | `validThrough` from the ad's JSON-LD |
| `description` | | ✓ | plain text, lists kept as `- ` lines |

Search JSON: `{ "meta": { "count", "page", "total", "market" }, "results": [...] }`.
Errors go to stderr as `{ "error", "code" }` with exit code 1.

## Notes

- **Ad language.** Austrian ads are mostly German and Belgian ads are Dutch, French or
  English. An ad *written* in German is not the same as a German requirement; check the
  description before applying the Language Gate.
- **Small markets.** A narrow keyword can return 0 to 2 results (`yocto` in Austria returns 2).
  Broader terms such as `embedded linux`, `devops` or `c++` give a fuller page.
- **`validThrough` is the listing's end date**, which is usually about 30 days after posting.
  Treat it as an upper bound rather than a hard application deadline.
- A search slug with no StepStone landing page returns a 404, which the CLI reports as zero
  results.
