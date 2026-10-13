# EURES URL Reference

Recorded 2026-10-14 from live responses. Update this file when EURES changes its API.

The EURES portal (`/eures/portal/...`) is an Angular app. Its job search calls a JSON API under
`/eures/api/jv-searchengine/public/`. europa.eu's `robots.txt` has no rule covering `/eures/`.

## Search

`POST https://europa.eu/eures/api/jv-searchengine/public/jv-search/search`
with `Content-Type: application/json`:

```json
{
  "resultsPerPage": 25, "page": 1, "sortSearch": "MOST_RECENT",
  "keywords": [{ "keyword": "yocto", "specificSearchCode": "EVERYWHERE" }],
  "publicationPeriod": "LAST_WEEK",
  "locationCodes": ["de", "nl"],
  "euresFlagCodes": ["WITH"],
  "occupationUris": [], "skillUris": [], "requiredExperienceCodes": [], "positionScheduleCodes": [],
  "sectorCodes": [], "educationAndQualificationLevelCodes": [], "positionOfferingCodes": [],
  "otherBenefitsCodes": [], "requiredLanguages": [], "minNumberPost": null, "sessionId": "<any>"
}
```

| Field | Values (verified) |
|-------|-------------------|
| `publicationPeriod` | `null`, `LAST_DAY`, `LAST_THREE_DAYS`, `LAST_WEEK`, `LAST_MONTH` |
| `locationCodes` | lower-case ISO country codes (`nl` returned 1,411 of 11,612 devops vacancies) |
| `euresFlagCodes` | `["WITH"]` keeps EURES-flagged vacancies only |
| `sortSearch` | `MOST_RECENT` |

Response: `{ "numberRecords": n, "jvs": [...], "facets": [...] }`

| `jvs[]` field | Meaning |
|---------------|---------|
| `id` | vacancy ID (used by detail and the portal URL) |
| `title`, `description` (HTML) | in the first available language |
| `creationDate`, `lastModificationDate` | epoch milliseconds |
| `locationMap` | `{ "DE": ["DE125"] }`: country → NUTS regions |
| `employer.name` | |
| `availableLanguages[]` | languages the ad is published in |
| `euresFlag` | boolean |
| `positionScheduleCodes[]`, `positionOfferingCode`, `numberOfPosts` | |
| `translations` | `{ lang: { title, description } }` |

## Vacancy

`GET https://europa.eu/eures/api/jv-searchengine/public/jv/id/<id>?requestLang=en`

| Path | Meaning |
|------|---------|
| `preferredLanguage` | original ad language |
| `creationDate` | epoch ms |
| `jvProfiles.<lang>.title`, `.description` | per-language versions |
| `jvProfiles.<lang>.locations[]` | `cityName`, `countryCode`, `region`, `postalCode` |
| `jvProfiles.<lang>.employer` | `name`, `website`, `organisationSizeCode` |
| `jvProfiles.<lang>.positionLanguages[]` | required languages (often empty) |
| `jvProfiles.<lang>.employmentPeriod.periodDescription` | |
| `jvProfiles.<lang>.applicationInstructions[]` | how to apply, often with an external URL |
| `jvProfiles.<lang>.euresFlag` | |

Human-facing page: `https://europa.eu/eures/portal/jv-se/jv-details/<id>?lang=en`.
