---
name: hellowork-search
version: 1.0.0
description: >
  Search live job listings on Hellowork (hellowork.com), France, or fetch a Hellowork job's full
  description. Use for jobs in France. Trigger phrases: hellowork, regionsjob, jobs in France,
  French jobs, emploi, offres d'emploi, emploi DevOps, linux embarqué, ingénieur systèmes
  embarqués.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/hellowork-search/cli/src/cli.ts *)
---

# Hellowork Search Skill

Search live job listings from Hellowork's public landing pages (France). No authentication,
zero runtime dependencies.

> ⚠️ **Personal use only.** Keep volume low and do not use it commercially or for bulk
> collection. `robots.txt` disallows Hellowork's search page and every URL with a query string,
> so the CLI only reads the allowed job-title and keyword **landing pages** and the job pages.

## Commands

### search

```bash
bun run .agents/skills/hellowork-search/cli/src/cli.ts search -q "<keywords>" [flags]
```

- `--query` / `-q <text>` — **required.** A job title or keyword. The CLI tries the job-title
  page (`/fr-fr/emploi/metier_<slug>.html`) first, then the keyword page
  (`/fr-fr/emploi/mot-cle_<slug>.html`). If neither exists, the result is empty (`meta.source: null`).
  French terms match best: `devops`, `ingenieur devops`, `linux embarqué`, `systemes embarques`.
- `--jobage <days>` — keep jobs posted within N days (client-side, from "il y a N heures/jours").
- `--page <n>` — only `1`. Landing pages show about 20 jobs and cannot be paged within robots.txt.
- `--limit` / `-n <n>` — cap results emitted.
- `--format json|table|plain` — default `json`.

No location filter: location landing pages need a postal code and are not wired in.

### detail

```bash
bun run .agents/skills/hellowork-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Returns company, location, posted date, deadline (`validThrough`), employment type and the
full description.

## Examples

```bash
bun run .agents/skills/hellowork-search/cli/src/cli.ts search -q "devops" --jobage 14 --format table
bun run .agents/skills/hellowork-search/cli/src/cli.ts search -q "linux embarqué" --format table
bun run .agents/skills/hellowork-search/cli/src/cli.ts search -q "ingenieur devops" --format plain
bun run .agents/skills/hellowork-search/cli/src/cli.ts detail 84404573 --format plain
```

## Output

| Field | Search | Detail |
|-------|--------|--------|
| `id`, `title`, `company`, `location`, `date`, `url` | ✓ | ✓ |
| `contract`, `salary` | ✓ | |
| `deadline`, `employmentType`, `description` | | ✓ |

Search JSON adds `meta.source`, the landing page actually read.

## Notes

- **Language Gate:** Hellowork is a French-market board and nearly all ads require French.
  Expect most results to fail an English-only Language Gate; check each description.
- Card dates are relative ("il y a 12 heures") and converted to calendar dates at run time.
  They are accurate to the day.
- Keyword landing pages include loosely related jobs (e.g. `yocto` returns general embedded
  roles). Pre-filter by title.
