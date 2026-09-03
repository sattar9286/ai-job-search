# Search Queries for Job Scraper

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Shipped country-agnostic CLIs include `linkedin-search` and `freehire-search`; Danish demos and any skill you add with `/add-portal` are included the same way. You do **not** need a matching `site:` line below for those CLIs to run.

**Currently enabled:** `linkedin-search`, `freehire-search`.
**Currently disabled:** the four Danish demo portals (`jobindex`, `jobbank`, `jobdanmark`, `jobnet`) — not relevant to this search.
**Not yet installed:** StepStone and Indeed have no CLI skill. They are covered by the `site:` fallback queries below; scaffold real CLIs with `/add-portal` if the fallback proves too thin.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

**Language scope:** English only. All queries below are written in English, matching the single entry in CLAUDE.md's Languages table. A posting requiring a language not declared there, as a job condition, is excluded before scoring; a posting requiring a higher level than declared in a language that *is* listed is flagged for your own judgment, not excluded — see `04-job-evaluation.md`'s Language Gate, the single source of truth for this rule.

## Search Sites

Primary:
- **linkedin.com/jobs** — also covered by the `linkedin-search` CLI
- **stepstone.com** / **stepstone.de** — strong for German, Dutch, and Belgian embedded roles, many of which sponsor relocation. Under the English-only rule, any posting requiring German (or Dutch, or French) **as a job condition** fails the Language Gate. Plenty of embedded roles in these markets are English-working — prefer queries that surface those rather than filtering after the fact.
- **indeed.com** — broad international coverage
- **freehire** — worldwide remote roles, covered by the `freehire-search` CLI

Remote-worldwide boards (WebSearch fallback):
- **weworkremotely.com**, **remoteok.com**, **remotive.com**, **wellfound.com**

Secondary (company career pages via Google):
- Direct `site:` searches for target companies — **NVIDIA** first, plus embedded/automotive and silicon vendors (Bosch, Continental, ZF, Qualcomm, AMD, Arm, Intel, Wind River, Siemens, Zoox, Wayve)

## Query Categories

Queries are grouped by priority. Combine with the location terms in the Location Filter below where the site supports it.

### Priority 1: Embedded DevOps & Yocto Build Systems

The strongest and most desired direction — 8+ years of directly matching work.

```
site:linkedin.com/jobs "Embedded DevOps Engineer" remote OR relocation
site:linkedin.com/jobs "Yocto" engineer remote
site:linkedin.com/jobs "BSP Engineer" OR "Board Support Package" embedded
site:stepstone.de "Embedded Linux Engineer" Yocto
site:stepstone.com "Yocto" OR "BitBake" engineer
site:indeed.com "Yocto Project" engineer visa sponsorship
"Yocto" "BitBake" engineer remote worldwide
"Embedded Linux" "CI/CD" engineer relocation sponsored
```

### Priority 2: AI Infrastructure & Cloud Architecture

The stated career direction (NVIDIA and comparable AI-infrastructure employers). Currently an aspirational tier — see the skills-in-progress note in `04-job-evaluation.md`; expect these to require the AWS SA-Associate and NVIDIA AI Infrastructure credentials to land.

```
site:nvidia.com/en-us/about-nvidia/careers "solutions architect" AI infrastructure
site:linkedin.com/jobs "AI Infrastructure Engineer" remote
site:linkedin.com/jobs "AI Solutions Architect" OR "Cloud Solutions Architect" GPU
site:linkedin.com/jobs "GPU" infrastructure engineer remote
site:indeed.com "AI infrastructure" architect remote
"AI cloud architect" OR "GPU cluster" engineer remote worldwide
```

### Priority 3: Platform, Build & Release, Developer Experience

Adjacent roles the build-system and CI/CD record pivots into cleanly — the ~95% build-time reduction is the headline evidence for all three.

```
site:linkedin.com/jobs "Build and Release Engineer" C++ remote
site:linkedin.com/jobs "Platform Engineer" embedded OR Linux remote
site:linkedin.com/jobs "Developer Experience Engineer" OR "DevEx" build systems
site:linkedin.com/jobs "Robotics Software Engineer" ROS C++ remote
site:stepstone.com "Build Engineer" OR "Release Engineer" embedded
"build systems" engineer "CI/CD" remote worldwide
```

### Priority 4: Broader C++ Systems Engineering

Wider net, drawing on the payments, telecom, and automotive record.

```
site:linkedin.com/jobs "Senior C++ Engineer" remote worldwide
site:linkedin.com/jobs "C++" engineer automotive relocation
site:linkedin.com/jobs "C++" engineer payments OR "ISO 8583" OR SWIFT
site:indeed.com "Senior C++ Developer" visa sponsorship
site:stepstone.com "C++ Software Engineer" automotive
```

## Location Filter

**Anywhere in the world except Pakistan** (rule set 2026-08-29). Remote and relocation are
equally welcome, and Abdul will **fund and arrange relocation himself** if needed, so the absence
of employer relocation support is not a downgrade.

- **Ideal:** fully remote, hiring worldwide or in a region that includes his time zone
- **Ideal:** on-site or hybrid outside Pakistan with visa sponsorship / relocation support stated
- **Ideal:** on-site or hybrid outside Pakistan with **no** relocation support mentioned — rank
  these level with the above, not below. Self-funded relocation is fine.
- **Borderline:** remote roles region-locked in a way that excludes him ("remote — US only",
  "remote — EU only") — flag rather than drop; some employers flex for contractors
- **Exclude:** roles based in Pakistan, or Pakistan-remote. This is the one geography being
  filtered out.
- **Exclude:** roles whose ad **explicitly** requires existing work authorisation ("must have
  the right to work in X", "no visa sponsorship"), explicitly requires being local ("must be
  based in X", "local candidates only", "no relocation"), or requires citizenship, PR, or a
  security clearance — these fail the Eligibility Gate in `04-job-evaluation.md` before scoring

**Silence on sponsorship is a PASS, not a flag.** If a posting says nothing about visas,
residency or work rights, keep it and rank it normally — do not mark it unverified and do not
check the careers page first. Only an explicit exclusion drops a role. See the Eligibility Gate
for the accepted trade-off behind this.

## Language Filter

**English only** (rule set 2026-08-29). Apply `04-job-evaluation.md`'s Language Gate:

- A posting requiring **any language other than English** as a job condition is **excluded**.
- English requirements at any stated level **pass** — English is declared Fluent.
- A non-English language listed as a *nice-to-have* is **not** a requirement: keep the posting
  and note the preference.
- Postings merely *written* in another language, for roles that only need English on the job,
  are fine — do not exclude on the ad's language.
- **Urdu is the one exception:** it is a declared native language, so flag rather than exclude
  and let Abdul decide.

When building queries for non-English markets, prefer terms that surface English-working roles
(e.g. "English-speaking", "international team") rather than filtering after the fact.

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate 2-3 custom queries for that focus. For example:
- "/scrape yocto" -> Priority 1 queries + custom Yocto-specific queries
- "/scrape nvidia" -> Priority 2 queries + NVIDIA careers-page searches
