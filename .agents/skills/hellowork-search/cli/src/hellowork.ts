// Data source: Hellowork (hellowork.com) public keyword landing pages and job pages, France.
// robots.txt disallows the search page (/fr-fr/emploi/recherche.html) and every URL
// with a query string ("/*?"), so the CLI uses the allowed SEO landing pages:
//
//   GET /fr-fr/emploi/mot-cle_<keyword-slug>.html   keyword landing page (first ~20 jobs)
//   GET /fr-fr/emplois/<id>.html                     job page with JobPosting JSON-LD
//
// Landing pages cannot be paged (the page parameter is a query string) or filtered
// by location; dates on cards are relative ("il y a 12 heures") and converted here.

import { decodeHtmlEntities, fetchText, htmlToText, jobPostings, slugify, str } from "./common.js"

export const BASE = "https://www.hellowork.com"
export const UA = "Mozilla/5.0 (compatible; hellowork-search-cli/1.0)"

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  contract: string | null
  salary: string | null
}

export interface JobDetail {
  id: string
  title: string | null
  company: string | null
  location: string | null
  date: string | null
  deadline: string | null
  employmentType: string | null
  description: string | null
  url: string
}

/**
 * Landing pages exist either per job title (metier_devops) or per keyword
 * (mot-cle_linux-embarque); a missing one returns 404. Try the job-title page
 * first, then the keyword page.
 */
export function searchUrls(query: string): string[] {
  const slug = slugify(query)
  return [`${BASE}/fr-fr/emploi/metier_${slug}.html`, `${BASE}/fr-fr/emploi/mot-cle_${slug}.html`]
}

/** "il y a 12 heures" / "il y a 3 jours" / "hier" -> ISO date, relative to `now`. */
export function relativeDate(text: string | null, now = Date.now()): string | null {
  if (!text) return null
  const t = text.toLowerCase()
  const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10)
  if (/aujourd|instant/.test(t)) return iso(now)
  if (/\bhier\b/.test(t)) return iso(now - 86400000)
  const m = t.match(/il y a\s+(\d+)\s*(minute|heure|jour|semaine|mois)/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  const unit = { minute: 60000, heure: 3600000, jour: 86400000, semaine: 7 * 86400000, mois: 30 * 86400000 }[m[2] as "minute"]
  return iso(now - n * unit)
}

function tagText(card: string, attr: string): string | null {
  const m = card.match(new RegExp(`data-cy="${attr}"[^>]*>([\\s\\S]*?)</div>`))
  const text = m ? htmlToText(m[1]).replace(/\s+/g, " ").trim() : ""
  return text || null
}

/** Split the page into job cards on their offerTitle anchors and parse each independently. */
export function parseSearch(html: string, now = Date.now()): JobCard[] {
  const items: JobCard[] = []
  const seen = new Set<string>()
  const parts = html.split(/data-cy="offerTitle"/)
  for (let i = 1; i < parts.length; i++) {
    // The anchor's attributes begin in the previous part; its href and title follow the marker
    // in some layouts and precede it in others, so look at both sides.
    const before = parts[i - 1].slice(-1500)
    const after = parts[i]
    const anchor = (before.slice(before.lastIndexOf("<a")) + after.slice(0, after.indexOf(">") + 1))
    const href = anchor.match(/href="\/fr-fr\/emplois\/(\d+)\.html"/)
    if (!href) continue
    const id = href[1]
    if (seen.has(id)) continue
    const card = after.slice(0, 6000)
    const h3 = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)
    const ps = h3 ? [...h3[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((p) => htmlToText(p[1]).trim()) : []
    const title = ps[0] || null
    if (!title) continue
    seen.add(id)
    const dateText = card.match(/il y a\s+\d+\s*\w+|\bhier\b|aujourd(?:'|&#x27;)hui/i)?.[0] ?? null
    const salary = card.match(/<div class="[^"]*typo-s-bold[^"]*"[^>]*>([^<]*)<\/div>/)
    items.push({
      id,
      title: decodeHtmlEntities(title),
      company: ps[1] ? decodeHtmlEntities(ps[1]) : null,
      location: tagText(card, "localisationCard"),
      date: relativeDate(dateText, now),
      url: `${BASE}/fr-fr/emplois/${id}.html`,
      contract: tagText(card, "contractCard"),
      salary: salary ? htmlToText(salary[1]).replace(/\s+/g, " ").trim() || null : null,
    })
  }
  return items
}

export function parseDetail(html: string, url: string): JobDetail | null {
  const job = jobPostings(html)[0]
  if (!job) return null
  const org = job.hiringOrganization as Record<string, unknown> | undefined
  const locs = Array.isArray(job.jobLocation) ? job.jobLocation : job.jobLocation ? [job.jobLocation] : []
  const places = (locs as Record<string, unknown>[])
    .map((l) => {
      const a = l.address as Record<string, unknown> | undefined
      return [str(a?.addressLocality), str(a?.addressRegion), str(a?.addressCountry)].filter(Boolean).join(", ")
    })
    .filter(Boolean)
  const posted = str(job.datePosted)
  const valid = str(job.validThrough)
  const description = str(job.description)
  const employment = Array.isArray(job.employmentType) ? job.employmentType.join(", ") : str(job.employmentType)
  return {
    id: idFromUrl(url) ?? "",
    title: str(job.title) ? decodeHtmlEntities(str(job.title)!) : null,
    company: org ? str(org.name) : null,
    location: places.length ? places.join(" / ") : null,
    date: posted ? posted.slice(0, 10) : null,
    deadline: valid ? valid.slice(0, 10) : null,
    employmentType: employment,
    description: description ? htmlToText(decodeHtmlEntities(description)) : null,
    url,
  }
}

export function idFromUrl(url: string): string | null {
  const m = url.match(/\/emplois\/(\d+)\.html/)
  return m ? m[1] : null
}

/** Accept a numeric Hellowork job ID or a hellowork.com/fr-fr/emplois/<id>.html URL. */
export function normalizeRef(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d{6,}$/.test(trimmed)) return `${BASE}/fr-fr/emplois/${trimmed}.html`
  let parsed: URL
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
  if (!/^(www\.)?hellowork\.com$/i.test(parsed.hostname)) return null
  const m = parsed.pathname.match(/^\/fr-fr\/emplois\/(\d{6,})\.html$/)
  return m ? `${BASE}/fr-fr/emplois/${m[1]}.html` : null
}

export const fetchPage = (url: string) => fetchText(url, UA)
