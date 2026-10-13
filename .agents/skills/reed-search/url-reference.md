# Reed URL Reference

Recorded 2026-10-14 from live responses. Update this file when Reed changes its markup.

## robots.txt (User-agent: * group, relevant lines)

```
Disallow: /api/
Disallow: /handlers/
Disallow: /*?sourceInternal=
Disallow: /*?directjob
Disallow: /*multipleParentSectorIds=
Disallow: /jobs/*?*sortBy=
```

`/jobs/` pages are allowed, with `pageno` and `dateCreatedOffSet` parameters.

## Search page

| URL | Meaning |
|-----|---------|
| `/jobs/<keyword-slug>-jobs` | keyword search, UK-wide |
| `/jobs/<keyword-slug>-jobs-in-<location-slug>` | keyword + location |
| `?pageno=N` | page N (25 per page) |
| `?dateCreatedOffSet=<bucket>` | `today`, `lastthreedays`, `lastweek`, `lasttwoweeks` (unknown values are ignored) |

Keyword slugs keep `+` URL-encoded (`/jobs/c%2B%2B-jobs` returns C++ jobs).

Data: `<script id="__NEXT_DATA__">` → `props.pageProps.searchResults`

| Path | Meaning |
|------|---------|
| `count` | total matches |
| `jobs[].url` | relative job URL `/jobs/<slug>/<id>` |
| `jobs[].jobDetail.jobId`, `jobTitle` | |
| `jobs[].jobDetail.ouName` | advertiser (often an agency) |
| `jobs[].jobDetail.displayLocationName`, `countyLocation` | |
| `jobs[].jobDetail.displayDate`, `dateCreated`, `expiryDate` | |
| `jobs[].jobDetail.salaryFrom`, `salaryTo` | |
| `jobs[].jobDetail.workingOption` | `onSite` / `hybrid` / `remote` |
| `jobs[].jobDetail.eligibleUkOnly` | boolean |
| `jobs[].jobDetail.jobDescriptionSnippet` | |
| `promotedJobs[]` | sponsored listings (not emitted) |

## Job page

`GET /jobs/<any-slug>/<id>` (Reed resolves any slug for a valid ID; the CLI uses `/jobs/job/<id>`
for a bare ID).

Data: `props.pageProps.consolidatedJobDetails`

| Path | CLI field |
|------|-----------|
| `jobDetails.id`, `title` | `id`, `title` |
| `jobDetails.description` (HTML) | `description` |
| `jobDetails.displayDate`, `expiryDate` | `date`, `deadline` |
| `jobDetails.isLive` ("True"/"False" strings) | `isLive` |
| `jobDetails.hasEligibilityToWorkInUk` | `requiresUkWorkEligibility` |
| `jobDetails.jobApplicationEligibilityRequirement` | `eligibilityRequirement` |
| `jobDetails.jobLocation.isRemoteJob` | `remote` |
| `jobDetails.jobContractType.name` | `contractType` |
| `jobDetails.jobSalary.displaySalary` | `salary` |
| `jobDetails.isAgency` | `isAgency` |
| `gaTags.jobRecruiterName`, `gaTags.jobLocation` | `company`, `location` |
