# Wellfound URL Reference

Recorded 2026-10-14 from live responses. Update this file when Wellfound changes its markup.

## robots.txt (relevant lines)

```
Disallow: /search
Disallow: /_jobs/
Disallow: /*?jobId=*   /*?jobSlug=*   /*?role=*   /*?preview=*
```

Role landing pages (`/role/...`), their `?page=N` pagination, and job pages (`/jobs/<id>-<slug>`)
are not disallowed. The free-text search (`/search`) is, so the CLI never uses it.

## Role pages

| URL | Meaning |
|-----|---------|
| `/role/<role>` | all listings for a role |
| `/role/r/<role>` | remote listings |
| `/role/l/<role>/<location>` | listings in a location (e.g. `germany`, `london`) |
| `...?page=N` | pagination (page 2 verified) |

Unknown role slugs: `/role/r/<x>` answers **303** (the CLI reports `ROLE_NOT_FOUND`);
`/role/<x>` answers 200 with no listings. Verified slugs: `devops-engineer`,
`embedded-software-engineer`, `software-engineer`, `site-reliability-engineer`. Verified
missing: `embedded-engineer`, `build-engineer`, `platform-engineer`, `firmware-engineer`.

Data lives in `<script id="__NEXT_DATA__">` at `props.pageProps.apolloState.data`, an Apollo
cache keyed `Typename:id`.

| Record | Field | Meaning |
|--------|-------|---------|
| `JobListingSearchResult:<id>` | `id`, `title`, `slug` | job URL is `/jobs/<id>-<slug>` |
| | `liveStartAt` | Unix seconds, used as posting date |
| | `locationNames[]` | office locations |
| | `remote`, `remoteConfig.kind` | remote flag |
| | `acceptedRemoteLocationNames[]` | countries a remote role accepts |
| | `primaryRoleTitle` | role tag (loose; not used for filtering) |
| | `compensation`, `yearsExperienceMin`, `jobType` | |
| | `description` | full markdown description (not emitted by search) |
| `StartupResult:<id>` | `name`, `slug` | company |
| | `highlightedJobListings[].__ref` | links listings to the company |

## Job page

`GET /jobs/<id>-<slug>` (the slug is required; `/jobs/<id>` alone returns 404). There is no
`__NEXT_DATA__`; the page carries a schema.org JobPosting in
`<script type="application/ld+json">`:

| JSON-LD field | CLI field |
|---------------|-----------|
| `title` | `title` |
| `hiringOrganization.name` | `company` |
| `jobLocation[].address` (locality/region/country) | `location` |
| `jobLocationType == "TELECOMMUTE"` | `remote` |
| `applicantLocationRequirements[].name` | `applicantLocations` |
| `datePosted` | `date` |
| `validThrough` | `deadline` (rarely present) |
| `employmentType` | `employmentType` |
| `description` (HTML) | `description` |
