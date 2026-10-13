---
name: meteojob-search
version: 1.0.0
description: >
  Search live job listings on Meteojob (meteojob.com), France, or fetch a Meteojob job's full
  description. Use for jobs in France (Paris, Lyon, Toulouse, Grenoble, Marseille...).
  Trigger phrases: meteojob, jobs in France, French jobs, emploi, offres d'emploi, recherche
  d'emploi, emploi Paris, emploi Toulouse, ingénieur DevOps, linux embarqué.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/meteojob-search/cli/src/cli.ts *)
---

# Meteojob Search Skill

Search live job listings from Meteojob's public pages (France). No authentication, zero
runtime dependencies.

> ⚠️ **Personal use only.** This reads Meteojob's public pages. Keep volume low and do not use
> it commercially or for bulk collection. `robots.txt` disallows URLs with query strings except
> `/jobs?*`, which is the search the CLI uses.

## Commands

### search

```bash
bun run .agents/skills/meteojob-search/cli/src/cli.ts search -q "<keywords>" [flags]
```

- `--query` / `-q <text>` — **required.** Keywords (French terms match best: `linux embarqué`,
  `ingénieur devops`).
- `--location` / `-l <text>` — city or region, e.g. `Paris`, `Toulouse`, `Grenoble`.
- `--jobage <days>` — keep jobs posted within N days (client-side; results are relevance-sorted).
- `--page <n>` — 1-indexed page, 20 results per page.
- `--limit` / `-n <n>` — cap results emitted.
- `--format json|table|plain` — default `json`.

### detail

```bash
bun run .agents/skills/meteojob-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Returns company, location, posted date, deadline (`validThrough`), employment type, required
experience in months and the full description.

## Examples

```bash
bun run .agents/skills/meteojob-search/cli/src/cli.ts search -q "devops" --jobage 14 --format table
bun run .agents/skills/meteojob-search/cli/src/cli.ts search -q "linux embarqué" -l "Toulouse" --format table
bun run .agents/skills/meteojob-search/cli/src/cli.ts search -q "yocto" --format table
bun run .agents/skills/meteojob-search/cli/src/cli.ts detail 57445840 --format plain
```

## Output

| Field | Search | Detail | Notes |
|-------|--------|--------|-------|
| `id`, `title`, `company`, `location`, `date`, `url` | ✓ | ✓ | `company` is null for anonymous ads |
| `contentLanguage` | ✓ | | **language the ad is written in** (`fr`, `en`) |
| `contractTypes` | ✓ | | `CDI`, `CDD`, `Interim`, ... |
| `salary`, `snippet` | ✓ | | |
| `deadline`, `employmentType`, `experienceMonths`, `description` | | ✓ | |

## Notes

- **Language Gate:** almost every ad is French (`contentLanguage: "fr"`) and French-language
  roles usually require French. Filter on `contentLanguage === "en"` first. The few English
  ads are the realistic candidates for an English-only profile.
- `H/F` / `F/H` in titles is the French "all genders" marker, like `(m/w/d)`.
