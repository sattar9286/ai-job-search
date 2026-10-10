# Search Queries for Job Scraper

<!-- SETUP: Customize these queries based on your skills, target roles, and location -->

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Shipped country-agnostic CLIs include `linkedin-search` and `freehire-search`; Danish demos and any skill you add with `/add-portal` are included the same way. You do **not** need a matching `site:` line below for those CLIs to run.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

**Language scope:** write every query category in every language listed in your CLAUDE.md Languages table (typically 1-2, sometimes more). A posting requiring a language you have *not* declared, as a job condition, is excluded before scoring; a posting requiring a *higher level* than you declared in a language you *do* work in is flagged for your own judgment, not excluded — see `04-job-evaluation.md`'s Language Gate, the single source of truth for this rule. Translate each category's keywords rather than machine-translating word-for-word (e.g. "Frontend Developer" -> "Desarrollador Frontend", not a literal word-for-word translation) if you work in more than one language.

## Search Sites

Primary (remote-first + relocation-friendly):
- **linkedin.com/jobs** - covered by `linkedin-search` CLI; filter for Remote (Worldwide / Europe) + Portugal, UAE, Germany, Netherlands
- **remoteok.com** - remote-first tech job board
- **weworkremotely.com** - remote-first
- **wellfound.com** (formerly AngelList) - startup / remote-friendly
- **stackoverflow.com/jobs** (where still active) - developer roles
- Company career pages via Google `site:` searches (fallback)

## Query Categories

Queries are grouped by priority. Combine each with location terms (Remote, Europe, Portugal, UAE, Germany, Netherlands) where the site supports it. **Exclude India** from all results.

**Organize by function, not job title.** Multiple plausible titles per priority.

### Priority 1: Embedded DevOps / Yocto BSP / Linux Build Engineer

Strongest and most desired direction.

```
site:linkedin.com/jobs "Yocto" "BSP" remote -India
site:linkedin.com/jobs "Embedded Linux" "BitBake" remote -India
site:linkedin.com/jobs "Linux Build Engineer" remote -India
site:linkedin.com/jobs "Embedded DevOps" remote Europe
site:linkedin.com/jobs "Board Support Package" "Linux" remote
site:remoteok.com "Yocto" OR "BitBake" OR "Embedded Linux"
site:weworkremotely.com "Yocto" OR "Embedded Linux"
site:wellfound.com "Yocto" OR "Embedded Linux"
```

### Priority 2: Platform / DevOps / CI-CD (C++ context)

Domain expertise: CI/CD pipeline engineering with a C++ / embedded flavor.

```
site:linkedin.com/jobs "Platform Engineer" "C++" remote -India
site:linkedin.com/jobs "DevOps Engineer" "GitLab CI" remote Europe -India
site:linkedin.com/jobs "Build Engineer" "CMake" remote -India
site:linkedin.com/jobs "Release Engineer" "embedded" remote
site:remoteok.com "DevOps" "C++"
site:weworkremotely.com "Platform Engineer" "CI/CD"
```

### Priority 3: Senior C++ Systems (adjacent)

Adjacent roles bridging embedded ownership and general C++ backend / systems.

```
site:linkedin.com/jobs "Senior C++ Engineer" remote Europe -India
site:linkedin.com/jobs "C++ Systems Engineer" remote -India
site:linkedin.com/jobs "Autonomous Driving" "C++" Europe -India
site:linkedin.com/jobs "Robotics" "C++" "Linux" remote
site:remoteok.com "Senior C++"
```

### Priority 4: Payments / Fintech C++ (specialty pivot)

Wider net using the payment-systems specialization.

```
site:linkedin.com/jobs "SWIFT" "C++" remote -India
site:linkedin.com/jobs "ISO 20022" engineer remote -India
site:linkedin.com/jobs "ISO 8583" engineer remote -India
site:linkedin.com/jobs "Payments Engineer" "C++" remote Europe
```

## Location Filter

- **Ideal:** Remote (worldwide), Remote (Europe / Middle East time zones)
- **Acceptable relocation:** Portugal, UAE, Germany, Netherlands, Ireland, other EU countries
- **Local:** Karachi (on-site or hybrid)
- **Exclude:** India (hard exclusion)
- **Borderline:** US-time-zone remote (only if async-friendly)

## Language Filter

Your working languages and levels are in CLAUDE.md's Languages table (English Native only). When filtering scraped results, apply `04-job-evaluation.md`'s Language Gate: a posting requiring any language other than English on the job is excluded. Postings written in another language but requiring only English on the job are fine.

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape yocto" -> Priority 1 queries + custom "Yocto"-specific queries
- "/scrape payments" -> Priority 4 queries + custom SWIFT/ISO queries
