# StepStone URL Reference

Recorded 2026-10-13 from live responses. Update this file when StepStone changes its markup.

## Markets

| Code | Base URL | Job-ad path prefix | Status |
|------|----------|--------------------|--------|
| `at` | `https://www.stepstone.at` | `/stellenangebote--<slug>--<id>-inline.html` | Working |
| `be` | `https://www.stepstone.be` | `/jobs--<slug>--<id>-inline.html` | Working (includes Luxembourg roles) |
| `de` | `https://www.stepstone.de` | n/a | CDN returns 403 "Access Denied" for every path, including `robots.txt`. Not wired in. |
| `nl` | `https://www.stepstone.nl` | n/a | Search returns a ~6 KB shell page with no results. Not wired in. |

## robots.txt constraints (both markets)

```
Disallow: /jobs/*?*          # any query string on search pages...
Allow:    /jobs/*?q=*        # ...except a lone ?q=
Disallow: /jobs/*?q*&*       # ...with no further parameters
Disallow: /*?*               # (BE) query strings site-wide
Disallow: /jobs/full-time/* , /jobs/work-from-home/*  (AT: /jobs/vollzeit/*, /jobs/home-office/*)
```

Consequences:
- Search uses path-only URLs: `/jobs/<query-slug>` and `/jobs/<query-slug>/in-<location-slug>`.
- No server-side age filter (`ag=age_7`), sort, or `page=` parameter. Age is filtered client-side
  on `datePosted`, and only page 1 (~25 results) is fetched.
- Job-ad URLs from search carry `?rltr=...` tracking; it is stripped before storing or fetching.

## Search page

`GET /jobs/<slug>[/in-<location>]` returns `text/html; charset=utf-8`.

Results live in a server-rendered script:

```js
__PRELOADED_STATE__["app-unifiedResultlist"] = { ... };
```

The CLI reads the object by brace matching from the first `{` after that marker.

| Path | Meaning |
|------|---------|
| `searchResults.items[]` | result cards (25 per page) |
| `searchResults.meta.total` | total matches across all pages |
| `items[].id` | numeric listing ID |
| `items[].title` | job title |
| `items[].companyName` | company |
| `items[].location` | city / free-text location |
| `items[].datePosted` | ISO timestamp |
| `items[].publishToDate` | listing end date |
| `items[].url` | absolute job-ad URL with `?rltr=` tracking |
| `items[].textSnippet` | short HTML snippet with `<strong>` highlights |
| `items[].workFromHome` | string code; meaning not verified |

Slug rules: lowercase, accents folded, runs of other characters become `-`; `+` and `#` are kept
URL-encoded (`/jobs/c%2B%2B` returns C++ jobs). A slug with no landing page returns 404.

## Job-ad page

`GET <job-ad url without query string>` returns HTML containing a schema.org JobPosting:

```html
<script type="application/ld+json">{"@type":"JobPosting", ...}</script>
```

| JSON-LD field | CLI field |
|---------------|-----------|
| `title` | `title` |
| `hiringOrganization.name` | `company` |
| `jobLocation.address.addressLocality` + `addressCountry` | `location` |
| `datePosted` | `date` |
| `validThrough` | `deadline` |
| `employmentType` | `employmentType` |
| `industry` | `industry` |
| `description` (HTML) | `description` (plain text) |

The rendered page also marks sections with `data-at` attributes (`job-ad-content`,
`section-text-description-content`, `section-text-profile-content`, ...), a fallback if the
JSON-LD block ever disappears.
