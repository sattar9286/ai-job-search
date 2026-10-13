---
name: reed-search
version: 1.0.0
description: >
  Search live UK job listings on Reed.co.uk, or fetch a Reed job's full description,
  expiry date and eligibility flags. Use for jobs in the United Kingdom (England, Scotland,
  Wales, Northern Ireland), including London, Cambridge, Bristol, Manchester and Edinburgh.
  Trigger phrases: reed, reed.co.uk, UK jobs, jobs in the UK, jobs in London, jobs in
  Cambridge, UK embedded jobs, UK DevOps jobs, British job search, look up this reed job.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/reed-search/cli/src/cli.ts *)
---

# Reed Search Skill

Search live UK job listings from Reed.co.uk's public pages. No authentication, zero runtime
dependencies.

> ⚠️ **Personal use only.** This reads Reed's public pages. Keep volume low, do not use it
> commercially or for bulk data collection, and run it on your own responsibility. Reed also
> offers an official API that needs a free key; this skill does not use it. Requests stay
> inside `robots.txt`: `/jobs/` pages with only the `pageno` and `dateCreatedOffSet`
> parameters (the disallowed `/api/` and `sortBy` are never used).

## Commands

### search

```bash
bun run .agents/skills/reed-search/cli/src/cli.ts search -q "<keywords>" [flags]
```

- `--query` / `-q <text>` — **required.** Job title or skill; becomes the path
  (`"embedded linux"` → `/jobs/embedded-linux-jobs`; `"c++"` works).
- `--location` / `-l <text>` — UK town, city or county (`/jobs/<q>-jobs-in-<location>`).
- `--jobage <days>` — posted within N days. Uses Reed's server buckets (1, 3, 7, 14 days) and
  then filters exactly on the posting date; over 14 days is filtered client-side only.
- `--page <n>` — 1-indexed page, 25 results per page.
- `--limit` / `-n <n>` — cap results emitted.
- `--format json|table|plain` — default `json`.

### detail

```bash
bun run .agents/skills/reed-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Accepts a numeric Reed job ID or a `reed.co.uk/jobs/<slug>/<id>` URL. Returns the full
description, posted and expiry dates, live status, eligibility flags, contract type, salary
and whether an agency posted it.

## Examples

```bash
bun run .agents/skills/reed-search/cli/src/cli.ts search -q "yocto" --format table
bun run .agents/skills/reed-search/cli/src/cli.ts search -q "embedded linux" --jobage 14 --format table
bun run .agents/skills/reed-search/cli/src/cli.ts search -q "build engineer" -l "Cambridge" --jobage 14
bun run .agents/skills/reed-search/cli/src/cli.ts search -q "devops" -l "Bristol" --jobage 7 --page 2
bun run .agents/skills/reed-search/cli/src/cli.ts search -q "c++" -l "London" --jobage 7 --format table
bun run .agents/skills/reed-search/cli/src/cli.ts detail 57340750 --format plain
```

## Output

| Field | Search | Detail | Notes |
|-------|--------|--------|-------|
| `id` | ✓ | ✓ | Reed job ID |
| `title`, `company`, `location` | ✓ | ✓ | company is often a recruitment agency |
| `date` | ✓ | ✓ | `YYYY-MM-DD` display date |
| `deadline` | ✓ | ✓ | listing expiry date |
| `url` | ✓ | ✓ | |
| `salary` | ✓ | ✓ | |
| `workingOption` | ✓ | | `onSite`, `hybrid`, `remote` |
| `eligibleUkOnly` | ✓ | | Reed's "UK applicants only" flag |
| `snippet` | ✓ | | short description excerpt |
| `isLive` | | ✓ | |
| `requiresUkWorkEligibility`, `eligibilityRequirement` | | ✓ | Reed's eligibility screening flags |
| `isAgency`, `contractType`, `remote` | | ✓ | |
| `description` | | ✓ | plain text |

Search JSON: `{ "meta": { "count", "page", "total" }, "results": [...] }`. Errors go to stderr
as `{ "error", "code" }` with exit code 1.

## Notes

- **Eligibility flags are incomplete.** `eligibleUkOnly` and `requiresUkWorkEligibility`
  reflect Reed's screening settings, not the ad text. A posting that says "must be a British
  national" in its description has been observed with both flags `false`. Always read the
  description for the Eligibility Gate (citizenship, right to work, security clearance), which
  is common in UK defence and government roles.
- **Agency-heavy.** Many listings come from recruitment agencies, which often post the same role
  several times. Expect duplicates across agencies.
- **Keyword matching is Reed's own** and loose: `embedded linux` in Cambridge also returns
  electronics roles. Pre-filter by title before fetching details.
