# Hellowork URL Reference

Recorded 2026-10-14 from live responses. Update this file when Hellowork changes its markup.

## robots.txt (relevant lines)

```
Disallow: /*?
Disallow: /fr-fr/emploi/recherche.html
Disallow: /fr-fr/emplois/candidature.html
Disallow: /fr-fr/emplois/ext/
Disallow: /fr-fr/api/
```

The search page and any query-string URL are off limits. Landing pages under
`/fr-fr/emploi/` and job pages `/fr-fr/emplois/<id>.html` are allowed.

## Landing pages

| URL | Example | Notes |
|-----|---------|-------|
| `/fr-fr/emploi/metier_<slug>.html` | `metier_devops`, `metier_ingenieur-devops` | job-title page |
| `/fr-fr/emploi/mot-cle_<slug>.html` | `mot-cle_linux-embarque`, `mot-cle_yocto` | keyword page |
| `/fr-fr/emploi/metier_<slug>-ville_<city>-<zip>.html` | `metier_devops-ville_paris-75000` | location page (not wired in) |

A slug with no page returns 404 (`mot-cle_devops` is 404 while `metier_devops` exists).
About 20 jobs per page. Pagination needs `?p=N`, which robots.txt disallows.

A JSON-LD `ItemList` lists the job URLs in order. Each card:

```html
<a ... href="/fr-fr/emplois/<id>.html" title="<title> - <company>" data-cy="offerTitle">
  <h3><p class="typo-l ...">Title</p><p class="typo-s inline">Company</p></h3>
</a>
<div data-cy="localisationCard"> Lyon - 69 </div>
<div data-cy="contractCard"> CDI </div>
<div class="... typo-s-bold ...">45 000 - 55 000 € / an</div>
... "il y a 12 heures"
```

## Job page

`GET /fr-fr/emplois/<id>.html` contains JSON-LD with the script type entity-encoded
(`type="application/ld&#x2B;json"`). The JobPosting has `title`, `description`, `datePosted`,
`validThrough`, `employmentType`, `hiringOrganization.name` and `jobLocation.address`.
