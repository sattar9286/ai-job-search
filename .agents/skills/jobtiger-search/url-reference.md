# JobTiger URL Reference

Recorded 2026-10-14 from live responses. Update this file when JobTiger changes its markup.

Pages are served as `windows-1251`; the CLI decodes them explicitly.

## robots.txt (relevant lines)

```
Allow: /
Disallow: /jobs   /CV   /admin   /applicants   /replyCV   /searchCV   ...
```

`/obiavi-za-rabota/` (search and job pages) is allowed.

## Search

`GET /obiavi-za-rabota/?keyword=<q>&ln=2` (`ln=2` = English interface, `ln=1` = Bulgarian)

Server-rendered: the first 12 cards only. `page=` is ignored; later results load by script.

Each card is an anchor:

```html
<a href="/obiavi-za-rabota/<slug>-<id>-<n>" class="jt-card" data-jt-card>
  <h3 class="jt-card__title">…</h3>
  <div class="jt-card__company">…</div>
  <div class="jt-card__location">…</div>
  <div class="jt-card__date"><div class="date">18.09.2026</div></div>
</a>
```

## Job page

`GET /obiavi-za-rabota/<slug>-<id>-<n>` contains `<script type="application/ld+json">` with
`{"@graph": [{"@type": "JobPosting", ...}]}`:
`title`, `description` (entity-encoded text), `datePosted`, `validThrough`,
`hiringOrganization.name`, `jobLocation.address` (`addressLocality` is often `n/a`),
`employmentType` (Bulgarian text).
