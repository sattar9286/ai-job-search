# Meteojob URL Reference

Recorded 2026-10-14 from live responses. Update this file when Meteojob changes its markup.

## robots.txt (relevant lines)

```
Disallow: /*?
Allow: /*?utm_source=
Allow: /jobs?*
Disallow: /api/   /jobsearch/api/   /company/   /jobads/
```

## Search

`GET /jobs?what=<keywords>&where=<location>&page=<n>` (20 results per page, relevance order)

The page is server-rendered Angular. Results live in
`<script id="candidate-front-state" type="application/json">` under `"app:search:offers"`:

| Path | Meaning |
|------|---------|
| `total` | total matches |
| `content[].id` | job ID; job URL is `/jobs/<id>` |
| `content[].title` | |
| `content[].publicationDate`, `lastModification` | ISO timestamps |
| `content[].company.name`, `recruiter`, `anonymous` | |
| `content[].locality` | e.g. `Marseille (13) - Provence-Alpes-Côte d'Azur` |
| `content[].contentLanguage` | ad language (`fr`, `en`) |
| `content[].contractTypes[]`, `jobType[]` | |
| `content[].benefits` | salary text |
| `content[].salary` | `{ currency, from, to, period }` |
| `content[].highlight`, `description`, `profileDescription` | HTML |

The visible cards also carry `id="<jobId>-company-name"`, `-job-locations`, `-contract-types`
and `-salary` anchors, which can serve as a fallback if the state block disappears.

## Job page

`GET /jobs/<id>` contains a JSON-LD JobPosting: `title`, `description` (HTML), `datePosted`,
`validThrough`, `employmentType`, `hiringOrganization.name`, `jobLocation.address`,
`baseSalary`, `experienceRequirements.monthsOfExperience`, `industry`.
