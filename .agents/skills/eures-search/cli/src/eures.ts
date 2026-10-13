// Data source: the public JSON API behind the EURES job-search portal (europa.eu),
// which aggregates vacancies from the public employment services of EU/EEA countries.
// No authentication. robots.txt for europa.eu does not disallow /eures/.
//
//   POST /eures/api/jv-searchengine/public/jv-search/search   (search)
//   GET  /eures/api/jv-searchengine/public/jv/id/<id>           (one vacancy)

import { decodeHtmlEntities, fetchText, htmlToText, str } from "./common.js"

export const API = "https://europa.eu/eures/api/jv-searchengine/public"
export const PORTAL = "https://europa.eu/eures/portal/jv-se/jv-details"
export const UA = "Mozilla/5.0 (compatible; eures-search-cli/1.0)"

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  countries: string[]
  date: string | null
  url: string
  languages: string[]
  euresFlag: boolean
  snippet: string | null
}

export interface JobDetail {
  id: string
  title: string | null
  company: string | null
  location: string | null
  countries: string[]
  date: string | null
  deadline: string | null
  euresFlag: boolean
  requiredLanguages: string[]
  adLanguages: string[]
  schedule: string[]
  employmentPeriod: string | null
  applicationInstructions: string | null
  description: string | null
  url: string
}

/** EURES publicationPeriod buckets; anything over a month falls back to client-side filtering. */
export function publicationPeriod(days: number | undefined): string | null {
  if (!days) return null
  if (days <= 1) return "LAST_DAY"
  if (days <= 3) return "LAST_THREE_DAYS"
  if (days <= 7) return "LAST_WEEK"
  if (days <= 31) return "LAST_MONTH"
  return null
}

export interface SearchParams {
  query?: string
  countries?: string[]
  jobage?: number
  euresOnly?: boolean
  page: number
  perPage: number
}

export function buildSearchBody(p: SearchParams): string {
  return JSON.stringify({
    resultsPerPage: p.perPage,
    page: p.page,
    sortSearch: "MOST_RECENT",
    keywords: p.query ? [{ keyword: p.query, specificSearchCode: "EVERYWHERE" }] : [],
    publicationPeriod: publicationPeriod(p.jobage),
    occupationUris: [],
    skillUris: [],
    requiredExperienceCodes: [],
    positionScheduleCodes: [],
    sectorCodes: [],
    educationAndQualificationLevelCodes: [],
    positionOfferingCodes: [],
    locationCodes: (p.countries ?? []).map((c) => c.toLowerCase()),
    euresFlagCodes: p.euresOnly ? ["WITH"] : [],
    otherBenefitsCodes: [],
    requiredLanguages: [],
    minNumberPost: null,
    sessionId: "eures-search-cli",
  })
}

function isoFromMillis(v: unknown): string | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN
  if (!Number.isFinite(n) || n <= 0) return null
  return new Date(n).toISOString().slice(0, 10)
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
}

export function detailUrl(id: string): string {
  return `${PORTAL}/${encodeURIComponent(id)}?lang=en`
}

/** Parse the search response; returns null when the shape is not recognised. */
export function parseSearch(json: string): { items: JobCard[]; total: number | null } | null {
  let data: { numberRecords?: unknown; jvs?: unknown }
  try {
    data = JSON.parse(json)
  } catch {
    return null
  }
  if (!data || !Array.isArray(data.jvs)) return null
  const items: JobCard[] = []
  for (const raw of data.jvs) {
    try {
      const j = raw as Record<string, unknown>
      const id = str(j.id)
      const title = str(j.title)
      if (!id || !title) continue
      const map = (j.locationMap ?? {}) as Record<string, unknown>
      const countries = Object.keys(map).map((c) => c.toUpperCase())
      const employer = (j.employer ?? {}) as Record<string, unknown>
      const description = str(j.description)
      const text = description ? htmlToText(description) : null
      items.push({
        id,
        title: decodeHtmlEntities(title),
        company: str(employer.name),
        location: countries.length ? countries.join(", ") : null,
        countries,
        date: isoFromMillis(j.creationDate),
        url: detailUrl(id),
        languages: strings(j.availableLanguages),
        euresFlag: j.euresFlag === true,
        snippet: text ? text.slice(0, 280) : null,
      })
    } catch {
      continue
    }
  }
  return { items, total: typeof data.numberRecords === "number" ? data.numberRecords : null }
}

/** Parse one vacancy, preferring the English profile when the employer provided one. */
export function parseDetail(json: string): JobDetail | null {
  let d: Record<string, unknown>
  try {
    d = JSON.parse(json)
  } catch {
    return null
  }
  const profiles = (d.jvProfiles ?? {}) as Record<string, Record<string, unknown>>
  const langs = Object.keys(profiles)
  if (!langs.length) return null
  const preferred = str(d.preferredLanguage)
  const lang = langs.includes("en") ? "en" : preferred && langs.includes(preferred) ? preferred : langs[0]
  const p = profiles[lang]
  const id = str(d.id) ?? ""
  const locations = Array.isArray(p.locations) ? (p.locations as Record<string, unknown>[]) : []
  const places = locations
    .map((l) => [str(l.cityName), str(l.countryCode)?.toUpperCase()].filter(Boolean).join(", "))
    .filter(Boolean)
  const employer = (p.employer ?? {}) as Record<string, unknown>
  const period = (p.employmentPeriod ?? {}) as Record<string, unknown>
  const positionLanguages = Array.isArray(p.positionLanguages) ? (p.positionLanguages as unknown[]) : []
  const requiredLanguages = positionLanguages
    .map((l) => {
      if (typeof l === "string") return l
      const o = l as Record<string, unknown>
      return [str(o.languageCode) ?? str(o.code), str(o.cefrLevel) ?? str(o.level)].filter(Boolean).join(" ")
    })
    .filter(Boolean)
  const deadlineKey = Object.keys(p).find((k) => /deadline|lastApplication|closing/i.test(k))
  const description = str(p.description)
  const instructions = strings(p.applicationInstructions).join("\n").trim()
  return {
    id,
    title: str(p.title) ? decodeHtmlEntities(str(p.title)!) : null,
    company: str(employer.name),
    location: places.length ? places.join(" / ") : null,
    countries: [...new Set(locations.map((l) => str(l.countryCode)?.toUpperCase()).filter((c): c is string => !!c))],
    date: isoFromMillis(d.creationDate),
    deadline: deadlineKey ? isoFromMillis(p[deadlineKey]) ?? str(p[deadlineKey]) : null,
    euresFlag: p.euresFlag === true,
    requiredLanguages,
    adLanguages: langs,
    schedule: strings(p.positionScheduleCodes),
    employmentPeriod: str(period.periodDescription),
    applicationInstructions: instructions ? htmlToText(instructions) : null,
    description: description ? htmlToText(description) : null,
    url: detailUrl(id),
  }
}

export async function search(p: SearchParams): Promise<string> {
  return fetchText(`${API}/jv-search/search`, UA, {
    method: "POST",
    body: buildSearchBody(p),
    accept: "application/json",
    contentType: "application/json",
  })
}

export async function fetchDetail(id: string): Promise<string> {
  return fetchText(`${API}/jv/id/${encodeURIComponent(id)}?requestLang=en`, UA, { accept: "application/json" })
}

/** Accept a raw EURES vacancy ID or a portal jv-details URL. */
export function normalizeId(input: string): string | null {
  const trimmed = input.trim()
  const fromUrl = trimmed.match(/^https?:\/\/(?:www\.)?europa\.eu\/eures\/portal\/jv-se\/jv-details\/([A-Za-z0-9_-]+={0,2})(?:[?#].*)?$/)
  if (fromUrl) return decodeURIComponent(fromUrl[1])
  if (/^https?:\/\//i.test(trimmed)) return null
  return /^[A-Za-z0-9_-]{8,}={0,2}$/.test(trimmed) ? trimmed : null
}
