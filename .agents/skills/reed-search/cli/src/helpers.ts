// Data source: Reed.co.uk public search and job pages (UK). No authentication.
//
// Both are Next.js pages. Search results live in __NEXT_DATA__ at
// props.pageProps.searchResults.jobs[].jobDetail; a job page carries
// props.pageProps.consolidatedJobDetails.jobDetails.
//
// robots.txt allows /jobs/ pages, ?pageno= and ?dateCreatedOffSet=; it disallows
// /api/ and sortBy parameters, which the CLI never uses.

export const BASE = "https://www.reed.co.uk"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; reed-search-cli/1.0)"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return ""
    if (!response.ok) throw new Error(`Request failed: ${response.status} ${response.statusText}`)
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
  deadline: string | null
  salary: string | null
  workingOption: string | null
  eligibleUkOnly: boolean
  snippet: string | null
}

export interface JobDetail {
  id: string
  title: string | null
  company: string | null
  location: string | null
  remote: boolean
  date: string | null
  deadline: string | null
  isLive: boolean
  requiresUkWorkEligibility: boolean
  eligibilityRequirement: string | null
  contractType: string | null
  salary: string | null
  isAgency: boolean
  description: string | null
  url: string
}

/** Turn free text into Reed's path slug: "Embedded Linux" -> "embedded-linux". */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/\+/g, "%2B")
    .replace(/#/g, "%23")
}

/** Reed's dateCreatedOffSet buckets; a larger --jobage falls back to client-side filtering. */
export function dateOffset(days: number | undefined): string | null {
  if (!days) return null
  if (days <= 1) return "today"
  if (days <= 3) return "lastthreedays"
  if (days <= 7) return "lastweek"
  if (days <= 14) return "lasttwoweeks"
  return null
}

export function buildSearchUrl(opts: { query: string; location?: string; jobage?: number; page?: number }): string {
  const q = slugify(opts.query)
  const loc = opts.location ? `-in-${slugify(opts.location)}` : ""
  const params = new URLSearchParams()
  const offset = dateOffset(opts.jobage)
  if (offset) params.set("dateCreatedOffSet", offset)
  if (opts.page && opts.page > 1) params.set("pageno", String(opts.page))
  const qs = params.toString()
  return `${BASE}/jobs/${q}-jobs${loc}${qs ? `?${qs}` : ""}`
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

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null
}

function truthy(v: unknown): boolean {
  return v === true || v === "True" || v === "true"
}

function pageProps(html: string): Record<string, unknown> | null {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) return null
  try {
    const data = JSON.parse(m[1]) as { props?: { pageProps?: Record<string, unknown> } }
    return data.props?.pageProps ?? null
  } catch {
    return null
  }
}

function salaryText(d: Record<string, unknown>): string | null {
  const from = typeof d.salaryFrom === "number" ? d.salaryFrom : null
  const to = typeof d.salaryTo === "number" ? d.salaryTo : null
  if (!from && !to) return null
  const fmt = (n: number) => `£${n.toLocaleString("en-GB")}`
  return from && to && from !== to ? `${fmt(from)} - ${fmt(to)}` : fmt((from ?? to)!)
}

/**
 * Parse a search page. Returns null when the Next.js data or the
 * searchResults object is missing, which signals a markup change.
 */
export function parseSearchResults(html: string): { items: JobCard[]; total: number | null } | null {
  const pp = pageProps(html)
  const sr = pp?.searchResults as { count?: unknown; jobs?: unknown[] } | undefined
  if (!sr) return null
  const items: JobCard[] = []
  for (const entry of Array.isArray(sr.jobs) ? sr.jobs : []) {
    try {
      const e = entry as Record<string, unknown>
      const d = (e.jobDetail ?? {}) as Record<string, unknown>
      const id = d.jobId !== undefined && d.jobId !== null ? String(d.jobId) : null
      const title = str(d.jobTitle)
      const path = str(e.url)
      if (!id || !title) continue
      const date = str(d.displayDate) ?? str(d.dateCreated)
      const expiry = str(d.expiryDate)
      const place = [str(d.displayLocationName), str(d.countyLocation)].filter(Boolean).join(", ")
      const snippet = str(d.jobDescriptionSnippet)
      items.push({
        id,
        title: decodeHtmlEntities(title),
        company: str(d.ouName) ?? str(e.profileName),
        location: place || null,
        date: date ? date.slice(0, 10) : null,
        url: path ? `${BASE}${path}` : `${BASE}/jobs/job/${id}`,
        deadline: expiry ? expiry.slice(0, 10) : null,
        salary: salaryText(d),
        workingOption: str(d.workingOption),
        eligibleUkOnly: truthy(d.eligibleUkOnly),
        snippet: snippet ? htmlToText(snippet) : null,
      })
    } catch {
      continue
    }
  }
  return { items, total: typeof sr.count === "number" ? sr.count : null }
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

export function idFromUrl(url: string): string | null {
  const m = url.match(/\/jobs\/[^/]+\/(\d{6,})/)
  return m ? m[1] : null
}

/** Parse a job page. Returns null when the job data is missing. */
export function parseJobDetail(html: string, url: string): JobDetail | null {
  const pp = pageProps(html)
  const c = pp?.consolidatedJobDetails as { jobDetails?: Record<string, unknown>; gaTags?: Record<string, unknown> } | undefined
  const d = c?.jobDetails
  if (!d) return null
  const ga = c?.gaTags ?? {}
  const loc = (d.jobLocation ?? {}) as Record<string, unknown>
  const contract = (d.jobContractType ?? {}) as Record<string, unknown>
  const sal = (d.jobSalary ?? {}) as Record<string, unknown>
  const date = str(d.displayDate) ?? str(d.createdDate)
  const expiry = str(d.expiryDate)
  const description = str(d.description)
  const requirement = str(d.jobApplicationEligibilityRequirement)
  return {
    id: str(d.id) ?? String(d.id ?? idFromUrl(url) ?? ""),
    title: str(d.title) ? decodeHtmlEntities(str(d.title)!) : null,
    company: str(ga.jobRecruiterName),
    location: str(ga.jobLocation),
    remote: truthy(loc.isRemoteJob),
    date: date ? date.slice(0, 10) : null,
    deadline: expiry ? expiry.slice(0, 10) : null,
    isLive: truthy(d.isLive),
    requiresUkWorkEligibility: truthy(d.hasEligibilityToWorkInUk),
    eligibilityRequirement: requirement && requirement !== "None" ? requirement : null,
    contractType: str(contract.name),
    salary: str(sal.displaySalary),
    isAgency: truthy(d.isAgency),
    description: description ? htmlToText(description) : null,
    url,
  }
}
