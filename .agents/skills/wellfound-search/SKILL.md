---
name: wellfound-search
version: 1.0.0
description: >
  Search live startup job listings on Wellfound (formerly AngelList Talent), remote or by
  location, or fetch a Wellfound job's full description. Worldwide market, English postings.
  Trigger phrases: wellfound, angellist jobs, startup jobs, remote startup jobs, startup
  devops jobs, startup embedded jobs, wellfound role, look up this wellfound job.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/wellfound-search/cli/src/cli.ts *)
---

# Wellfound Search Skill

Search live startup jobs from Wellfound's public **role pages**. No authentication, zero
runtime dependencies.

> ⚠️ **Personal use only.** This reads Wellfound's public pages. Keep volume low, do not use
> it commercially or for bulk data collection, and run it on your own responsibility.
> `robots.txt` disallows `/search`, so the CLI never calls Wellfound's search. It reads role
> landing pages (`/role/...`), which are allowed, and filters them client-side.

## Commands

### search

```bash
bun run .agents/skills/wellfound-search/cli/src/cli.ts search --role <role-slug> [flags]
```

- `--role` / `-r <slug>` — **required.** A Wellfound role page. Known to work:
  `devops-engineer`, `embedded-software-engineer`, `software-engineer`,
  `site-reliability-engineer`. With `--remote`, an unknown slug exits 1 with
  `ROLE_NOT_FOUND` (Wellfound redirects it). Without `--remote`, it returns 0 results.
  `build-engineer`, `platform-engineer` and `firmware-engineer` have no role page.
- `--remote` — remote listings only (`/role/r/<role>`).
- `--location` / `-l <text>` — location page (`/role/l/<role>/<location>`), e.g. `germany`,
  `london`. Cannot be combined with `--remote`.
- `--query` / `-q <words>` — keep listings whose **title** contains any of the words (whole
  word, case-insensitive). **Strongly recommended**: role pages mix in loosely related jobs.
  For example, the embedded page also lists product and full-stack roles.
- `--jobage <days>` — keep listings posted within N days (client-side).
- `--page <n>` — 1-indexed page (`?page=N`, allowed by robots.txt). ~25-37 listings per page.
- `--limit` / `-n <n>` — cap results emitted.
- `--format json|table|plain` — default `json`.

### detail

```bash
bun run .agents/skills/wellfound-search/cli/src/cli.ts detail <job url> [--format json|plain]
```

Takes the `url` from search output (`https://wellfound.com/jobs/<id>-<slug>`). A bare ID
returns 404 on Wellfound, so it is refused. Returns company, location, remote flag,
**applicant location requirements** (the region lock), posted date, employment type and the
full description.

## Examples

```bash
bun run .agents/skills/wellfound-search/cli/src/cli.ts search -r devops-engineer --remote --jobage 14 --format table
bun run .agents/skills/wellfound-search/cli/src/cli.ts search -r embedded-software-engineer --remote -q "embedded firmware linux" --format table
bun run .agents/skills/wellfound-search/cli/src/cli.ts search -r site-reliability-engineer --remote -q "devops platform infrastructure" --format table
bun run .agents/skills/wellfound-search/cli/src/cli.ts search -r devops-engineer -l germany --format table
bun run .agents/skills/wellfound-search/cli/src/cli.ts detail "https://wellfound.com/jobs/4824568-devops-engineer" --format plain
```

## Output

| Field | Search | Detail | Notes |
|-------|--------|--------|-------|
| `id` | ✓ | ✓ | Wellfound listing ID |
| `title` | ✓ | ✓ | |
| `company` | ✓ | ✓ | search: null when the startup record is not on the page |
| `location` | ✓ | ✓ | |
| `remote` | ✓ | ✓ | |
| `remoteLocations` | ✓ | | countries a remote role accepts |
| `applicantLocations` | | ✓ | the same region lock, read from the job page |
| `date` | ✓ | ✓ | `YYYY-MM-DD` |
| `url` | ✓ | ✓ | |
| `compensation` | ✓ | | free text |
| `yearsExperienceMin` | ✓ | | |
| `deadline` | | ✓ | usually null; Wellfound rarely sets `validThrough` |
| `description` | | ✓ | plain text |

Search JSON: `{ "meta": { "count", "page", "source" }, "results": [...] }`. Errors go to stderr
as `{ "error", "code" }` with exit code 1.

## Notes

- **Region locks are common.** Most "remote" listings accept only specific countries (often
  the United States). Check `remoteLocations` / `applicantLocations`. A lock that excludes the
  candidate is a FLAG under the Location rules, not a silent pass.
- **Embedded supply is thin.** Wellfound is startup-heavy and web/cloud-leaning. The embedded
  role page holds a handful of genuinely embedded jobs among unrelated ones, so always pass `-q`.
- Results are sorted newest first, and older listings stay live on role pages, so use
  `--jobage`.
