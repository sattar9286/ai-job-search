// Data source: JobTiger (jobtiger.bg) public search and job pages, Bulgaria.
// Pages are served as windows-1251. robots.txt allows /obiavi-za-rabota/ (it
// disallows /jobs, /CV, /admin and similar paths, which the CLI never uses).
//
//   GET /obiavi-za-rabota/?keyword=<q>&ln=2      search (ln=2 = English interface)
//   GET /obiavi-za-rabota/<slug>-<id>-<n>        job page with JobPosting JSON-LD
//
// The search page returns its first 12 cards server-side; further results are
// loaded by script, and the page parameter is ignored, so only page 1 is read.

import { decodeHtmlEntities, fetchText, htmlToText, jobPostings, str } from "./common.js"

export const BASE = "https://www.jobtiger.bg"
export const UA = "Mozilla/5.0 (compatible; jobtiger-search-cli/1.0)"
const CHARSET = "windows-1251"

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
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

export function buildSearchUrl(query: string): string {
  return `${BASE}/obiavi-za-rabota/?${new URLSearchParams({ keyword: query, ln: "2" }).toString()}`
}

/** "18.09.2026" -> "2026-09-18". */
export function bgDate(text: string | null): string | null {
  const m = text?.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null
}

function inner(chunk: string, cls: string): string | null {
  const m = chunk.match(new RegExp(`class="${cls}"[^>]*>([\\s\\S]*?)</(?:div|h3|span|p)>`))
  if (!m) return null
  const text = htmlToText(m[1]).replace(/\s+/g, " ").trim()
  return text || null
}

/** Split the page on job-card anchors and parse each card independently. */
export function parseSearch(html: string): JobCard[] {
  const items: JobCard[] = []
  const seen = new Set<string>()
  const chunks = html.split(/<a\s+href="(?=\/obiavi-za-rabota\/[a-z0-9-]+-\d+-\d+")/).slice(1)
  for (const chunk of chunks) {
    const path = chunk.match(/^(\/obiavi-za-rabota\/[a-z0-9-]+-(\d+)-\d+)"/)
    if (!path || !/class="jt-card"/.test(chunk.slice(0, 300))) continue
    const id = path[2]
    if (seen.has(id)) continue
    const card = chunk.split(/<\/a>/)[0]
    const title = inner(card, "jt-card__title")
    if (!title) continue
    seen.add(id)
    items.push({
      id,
      title: decodeHtmlEntities(title),
      company: inner(card, "jt-card__company"),
      location: inner(card, "jt-card__location"),
      date: bgDate(inner(card, "date")),
      url: `${BASE}${path[1]}`,
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
      // JobTiger fills unknown localities with "n/a".
      return [str(a?.addressLocality), str(a?.addressCountry)].filter((v) => v && v.toLowerCase() !== "n/a").join(", ")
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
  const m = url.match(/\/obiavi-za-rabota\/[a-z0-9-]+-(\d+)-\d+/)
  return m ? m[1] : null
}

/** Accept a JobTiger job URL; a bare ID cannot be resolved without its slug. */
export function normalizeUrl(input: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`)
  } catch {
    return null
  }
  if (!/^(www\.)?jobtiger\.bg$/i.test(parsed.hostname)) return null
  return /^\/obiavi-za-rabota\/[a-z0-9-]+-\d+-\d+\/?$/.test(parsed.pathname) ? `${BASE}${parsed.pathname}` : null
}

export const fetchPage = (url: string) => fetchText(url, UA, { charset: CHARSET })
