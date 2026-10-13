---
name: eures-search
version: 1.0.0
description: >
  Search live vacancies on EURES, the European Commission's job mobility portal, which
  aggregates the public employment services of all EU/EEA countries (Germany, Netherlands,
  Sweden, Austria, Belgium, Ireland, Poland, Bulgaria and more), or fetch one vacancy's full
  text. Flags employers that actively recruit across the EU. Trigger phrases: eures, EU jobs,
  European jobs, jobs in Europe, work in the EU, EU job mobility, jobs in Germany Netherlands
  Sweden, public employment service vacancies, look up this eures vacancy.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/eures-search/cli/src/cli.ts *)
---

# EURES Search Skill

Search EU/EEA vacancies through the public JSON API behind the EURES portal
(europa.eu/eures). No authentication, zero runtime dependencies.

> ⚠️ **Personal use only.** This calls the API the EURES website itself uses. Keep volume low
> and do not use it commercially or for bulk collection. europa.eu's `robots.txt` does not
> restrict `/eures/`.

## Commands

### search

```bash
bun run .agents/skills/eures-search/cli/src/cli.ts search [-q "<keywords>"] [flags]
```

- `--query` / `-q <text>` — keywords, matched anywhere in the vacancy (title or text).
- `--country` / `-c <codes>` — ISO country codes, comma-separated, e.g. `de,nl,se,at,ie`.
- `--eures-only` — only vacancies with the **EURES flag**: the employer is explicitly interested
  in recruiting workers from other EU/EEA countries. This is the best signal for international
  candidates.
- `--jobage <days>` — posted within N days (server buckets 1, 3, 7, 31 days plus an exact
  client-side filter).
- `--page <n>` — 1-indexed page. Results are sorted newest first.
- `--limit` / `-n <n>` — results per page, max 50 (default 25).
- `--format json|table|plain` — default `json`. The table truncates the long vacancy IDs; use
  `json` or `plain` to get IDs for `detail`.

### detail

```bash
bun run .agents/skills/eures-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Takes the `id` (or `url`) from search output. Returns the English version of the vacancy when
the employer provided one, otherwise the original language. Also returns location, EURES flag,
**required languages** (when the employer listed them), ad languages, employment period,
application instructions and full description.

## Examples

```bash
bun run .agents/skills/eures-search/cli/src/cli.ts search -q "yocto" --jobage 14 --format table
bun run .agents/skills/eures-search/cli/src/cli.ts search -q "embedded linux" -c de,nl,at,se --jobage 7
bun run .agents/skills/eures-search/cli/src/cli.ts search -q "devops" --eures-only --jobage 14 --format plain
bun run .agents/skills/eures-search/cli/src/cli.ts search -q "build engineer" -c ie,nl --eures-only
bun run .agents/skills/eures-search/cli/src/cli.ts detail NjMzMjYxMSAxMjE --format plain
```

## Output

| Field | Search | Detail | Notes |
|-------|--------|--------|-------|
| `id` | ✓ | ✓ | base64-style EURES vacancy ID |
| `title`, `company` | ✓ | ✓ | |
| `location` | ✓ | ✓ | search: country codes; detail: city + country |
| `countries` | ✓ | ✓ | ISO codes, upper case |
| `date` | ✓ | ✓ | creation date |
| `url` | ✓ | ✓ | portal page `jv-se/jv-details/<id>?lang=en` |
| `languages` / `adLanguages` | ✓ | ✓ | languages the **ad** is published in |
| `euresFlag` | ✓ | ✓ | employer recruits across the EU |
| `snippet` | ✓ | | first ~280 characters of the description |
| `requiredLanguages` | | ✓ | job language requirements, when given |
| `deadline` | | ✓ | usually null; few employment services send one |
| `employmentPeriod`, `applicationInstructions`, `description` | | ✓ | |

## Notes

- **Ad language is a strong Language Gate signal.** Most vacancies come from national
  employment services and are published only in the local language (`languages: ["de"]`).
  A German-only ad is not proof that German is required, but it usually is. Prefer results whose
  `languages` include `en`, and check `requiredLanguages` in `detail`.
- **Keyword matching is broad**: `yocto` also returns general German software roles that mention
  it in passing. Pre-filter on title before fetching details.
- Volume is large (over 11,000 vacancies for `devops` across all periods). Always pass
  `--jobage`, and usually `--country` or `--eures-only`.
