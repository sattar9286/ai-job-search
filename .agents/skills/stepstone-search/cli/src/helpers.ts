// Data source: StepStone's public search-result and job-ad pages (Austria and
// Belgium). No authentication required.
//
// Search pages embed their results as JSON in a server-rendered script:
//   __PRELOADED_STATE__["app-unifiedResultlist"] = { ... searchResults.items ... };
// Job-ad pages carry a schema.org JobPosting in <script type="application/ld+json">.
// Both are parsed without a DOM library.
//
// robots.txt on both markets disallows any /jobs/... URL with query parameters
// other than a bare ?q=, so filters (posting age, page) cannot be requested from
// the server. Age is filtered client-side and only page 1 is fetched.

export const MARKETS = {
  at: "https://www.stepstone.at",
  be: "https://www.stepstone.be",
} as const
export type Market = keyof typeof MARKETS

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; stepstone-search-cli/1.0)"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  snippet: string | null
  validThrough: string | null
}

export interface JobDetail {
  id: string
  title: string | null
  company: string | null
  location: string | null
  date: string | null
  deadline: string | null
  employmentType: string | null
  industry: string | null
  description: string | null
  url: string
}

/** Turn free text into StepStone's path slug: "Embedded Linux" -> "embedded-linux". */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, "-")
    .replace(/^-+|-+$/g, "")
    // StepStone keeps "+" and "#" in its slugs ("/jobs/c++" returns C++ jobs).
    .replace(/\+/g, "%2B")
    .replace(/#/g, "%23")
}

/** Build a robots-compliant search URL: /jobs/<query>[/in-<location>], no query string. */
export function buildSearchUrl(market: Market, query: string, location?: string): string {
  const q = slugify(query)
  const loc = location ? slugify(location) : ""
  return `${MARKETS[market]}/jobs/${q}${loc ? `/in-${loc}` : ""}`
}

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
}

/** Strip tags while keeping paragraph and list breaks readable. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n- ")
    .replace(/<\/\s*(p|div|h[1-6]|ul|ol)\s*>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line, i, all) => line !== "" || (i > 0 && all[i - 1] !== ""))
    .join("\n")
    .trim()
}

/** Remove StepStone's tracking query string so stored URLs stay robots-allowed. */
export function cleanUrl(url: string): string {
  return url.split("?")[0]
}

/** Read a JSON object literal that starts right after `marker`. */
function readJsonAfter(html: string, marker: string): unknown {
  const at = html.indexOf(marker)
  if (at === -1) return null
  const start = html.indexOf("{", at + marker.length)
  if (start === -1) return null
  let depth = 0
  let inString = false
  for (let i = start; i < html.length; i++) {
    const ch = html[i]
    if (inString) {
      if (ch === "\\") i++
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1))
        } catch {
          return null
        }
      }
    }
  }
  return null
}

const STATE_MARKER = '__PRELOADED_STATE__["app-unifiedResultlist"] ='

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null
}

/**
 * Parse search results. Each item is mapped independently, so one malformed
 * entry cannot break the rest. Returns null when the state block is missing
 * entirely, which signals that the page structure changed.
 */
export function parseSearchResults(html: string): { items: JobCard[]; total: number | null } | null {
  const state = readJsonAfter(html, STATE_MARKER) as
    | { searchResults?: { items?: unknown[]; meta?: { total?: unknown } } }
    | null
  if (!state || !state.searchResults) return null
  const raw = Array.isArray(state.searchResults.items) ? state.searchResults.items : []
  const items: JobCard[] = []
  for (const entry of raw) {
    try {
      const r = entry as Record<string, unknown>
      const id = r.id !== undefined && r.id !== null ? String(r.id) : null
      const title = str(r.title)
      const url = str(r.url)
      if (!id || !title || !url) continue
      const date = str(r.datePosted)
      const snippet = str(r.textSnippet)
      items.push({
        id,
        title: decodeHtmlEntities(title),
        company: str(r.companyName),
        location: str(r.location),
        date: date ? date.slice(0, 10) : null,
        url: cleanUrl(url),
        snippet: snippet ? htmlToText(snippet) : null,
        validThrough: str(r.publishToDate)?.slice(0, 10) ?? null,
      })
    } catch {
      continue
    }
  }
  const total = typeof state.searchResults.meta?.total === "number" ? state.searchResults.meta.total : null
  return { items, total }
}

/** Keep jobs posted within `days` days. Jobs with no date are kept, not guessed at. */
export function filterByAge(items: JobCard[], days: number | undefined, now = Date.now()): JobCard[] {
  if (!days) return items
  const cutoff = now - days * 86400000
  return items.filter((j) => {
    if (!j.date) return true
    const t = Date.parse(j.date)
    return Number.isNaN(t) || t >= cutoff
  })
}

/** Parse the JobPosting JSON-LD block of a job-ad page. */
export function parseJobDetail(html: string, url: string): JobDetail | null {
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const block of blocks) {
    let data: unknown
    try {
      data = JSON.parse(block[1])
    } catch {
      continue
    }
    const candidates = Array.isArray(data) ? data : [data]
    for (const c of candidates) {
      const d = c as Record<string, unknown>
      if (d["@type"] !== "JobPosting") continue
      const org = d.hiringOrganization as Record<string, unknown> | undefined
      const loc = d.jobLocation as Record<string, unknown> | Record<string, unknown>[] | undefined
      const firstLoc = Array.isArray(loc) ? loc[0] : loc
      const address = firstLoc?.address as Record<string, unknown> | undefined
      const place = [str(address?.addressLocality), str(address?.addressCountry)].filter(Boolean).join(", ")
      const description = str(d.description)
      const posted = str(d.datePosted)
      const valid = str(d.validThrough)
      const employment = Array.isArray(d.employmentType) ? d.employmentType.join(", ") : str(d.employmentType)
      return {
        id: idFromUrl(url) ?? "",
        title: str(d.title) ? decodeHtmlEntities(str(d.title)!) : null,
        company: org ? str(org.name) : null,
        location: place || null,
        date: posted ? posted.slice(0, 10) : null,
        deadline: valid ? valid.slice(0, 10) : null,
        employmentType: employment,
        industry: str(d.industry),
        description: description ? htmlToText(description) : null,
        url: cleanUrl(str(d.url) ?? url),
      }
    }
  }
  return null
}

/** Job-ad URLs end in "--<id>-inline.html" (AT: /stellenangebote--, BE: /jobs--). */
export function idFromUrl(url: string): string | null {
  const m = url.match(/--(\d{5,})-inline\.html/)
  return m ? m[1] : null
}
