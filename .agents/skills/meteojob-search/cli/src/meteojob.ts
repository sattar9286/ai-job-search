// Data source: Meteojob (meteojob.com) public search and job pages, France.
// robots.txt disallows "/*?" but explicitly allows "/jobs?*", so search runs on
// /jobs?what=...&where=...&page=N. Job pages /jobs/<id> carry a JobPosting JSON-LD.
//
// The search page is server-rendered Angular; its results are in the transfer-state
// script <script id="candidate-front-state" type="application/json"> under
// "app:search:offers".

import { decodeHtmlEntities, fetchText, htmlToText, jobPostings, str } from "./common.js"

export const BASE = "https://www.meteojob.com"
export const UA = "Mozilla/5.0 (compatible; meteojob-search-cli/1.0)"

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  contentLanguage: string | null
  contractTypes: string[]
  salary: string | null
  snippet: string | null
}

export interface JobDetail {
  id: string
  title: string | null
  company: string | null
  location: string | null
  date: string | null
  deadline: string | null
  employmentType: string | null
  experienceMonths: number | null
  description: string | null
  url: string
}

export function buildSearchUrl(opts: { query: string; location?: string; page?: number }): string {
  const params = new URLSearchParams({ what: opts.query })
  if (opts.location) params.set("where", opts.location)
  if (opts.page && opts.page > 1) params.set("page", String(opts.page))
  return `${BASE}/jobs?${params.toString()}`
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
}

/** Parse the transfer state; returns null when the state or the offers block is missing. */
export function parseSearch(html: string): { items: JobCard[]; total: number | null } | null {
  const m = html.match(/<script id="candidate-front-state"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) return null
  let state: Record<string, unknown>
  try {
    state = JSON.parse(m[1])
  } catch {
    return null
  }
  const offers = state["app:search:offers"] as { total?: unknown; content?: unknown[] } | undefined
  if (!offers || !Array.isArray(offers.content)) return null
  const items: JobCard[] = []
  for (const raw of offers.content) {
    try {
      const o = raw as Record<string, unknown>
      const id = o.id !== undefined && o.id !== null ? String(o.id) : null
      const title = str(o.title)
      if (!id || !title) continue
      const company = (o.company ?? {}) as Record<string, unknown>
      const date = str(o.publicationDate)
      const snippet = str(o.highlight)
      items.push({
        id,
        title: decodeHtmlEntities(title),
        company: o.anonymous === true ? null : str(company.name) ?? str(o.recruiter),
        location: str(o.locality),
        date: date ? date.slice(0, 10) : null,
        url: `${BASE}/jobs/${id}`,
        contentLanguage: str(o.contentLanguage),
        contractTypes: strings(o.contractTypes),
        salary: str(o.benefits),
        snippet: snippet ? htmlToText(snippet) : null,
      })
    } catch {
      continue
    }
  }
  return { items, total: typeof offers.total === "number" ? offers.total : null }
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
  const exp = job.experienceRequirements as Record<string, unknown> | undefined
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
    experienceMonths: typeof exp?.monthsOfExperience === "number" ? exp.monthsOfExperience : null,
    description: description ? htmlToText(description) : null,
    url,
  }
}

export function idFromUrl(url: string): string | null {
  const m = url.match(/\/jobs\/(\d+)/)
  return m ? m[1] : null
}

/** Accept a numeric Meteojob ID or a meteojob.com/jobs/<id> URL. */
export function normalizeRef(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d{5,}$/.test(trimmed)) return `${BASE}/jobs/${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
  if (!/^(www\.)?meteojob\.com$/i.test(parsed.hostname)) return null
  const m = parsed.pathname.match(/^\/jobs\/(\d{5,})\/?$/)
  return m ? `${BASE}/jobs/${m[1]}` : null
}

export const fetchPage = (url: string) => fetchText(url, UA)
