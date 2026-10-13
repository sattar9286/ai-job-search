// Data source: Wellfound's public role landing pages and job pages. No authentication.
//
// Role pages (/role/<role>, /role/r/<role> for remote, /role/l/<role>/<location>) are
// Next.js pages whose __NEXT_DATA__ script carries an Apollo cache with
// JobListingSearchResult and StartupResult records. Job pages carry a schema.org
// JobPosting in <script type="application/ld+json">.
//
// robots.txt disallows /search and /_jobs/, so free-text search is not available:
// the CLI fetches a role page and filters it client-side by keyword.

export const BASE = "https://wellfound.com"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; wellfound-search-cli/1.0)"

export class RoleNotFoundError extends Error {}

/**
 * Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404.
 * Wellfound answers an unknown role slug with a 303 redirect, which is
 * reported as RoleNotFoundError instead of following it to an unrelated page.
 */
export async function htmlFetch(url: string, opts: { roleRedirectIsMissing?: boolean } = {}): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: opts.roleRedirectIsMissing ? "manual" : "follow",
      signal: AbortSignal.timeout(20000),
    })
    if (opts.roleRedirectIsMissing && response.status >= 300 && response.status < 400) {
      throw new RoleNotFoundError(`Wellfound has no role page at ${url}`)
    }
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
  remote: boolean
  remoteLocations: string[]
  date: string | null
  url: string
  role: string | null
  compensation: string | null
  yearsExperienceMin: number | null
}

export interface JobDetail {
  id: string
  title: string | null
  company: string | null
  location: string | null
  remote: boolean
  applicantLocations: string[]
  date: string | null
  deadline: string | null
  employmentType: string | null
  description: string | null
  url: string
}

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** /role/<role>, /role/r/<role> (remote) or /role/l/<role>/<location>, plus ?page=N. */
export function buildRoleUrl(role: string, opts: { remote?: boolean; location?: string; page?: number } = {}): string {
  const r = slugify(role)
  let path = `/role/${r}`
  if (opts.location) path = `/role/l/${r}/${slugify(opts.location)}`
  else if (opts.remote) path = `/role/r/${r}`
  const page = opts.page && opts.page > 1 ? `?page=${opts.page}` : ""
  return `${BASE}${path}${page}`
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

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
}

function nextData(html: string): unknown {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) return null
  try {
    return JSON.parse(m[1])
  } catch {
    return null
  }
}

/**
 * Parse a role page. Returns null when the Apollo cache is missing, which
 * signals that Wellfound changed its page structure.
 */
export function parseRolePage(html: string): JobCard[] | null {
  const data = nextData(html) as { props?: { pageProps?: { apolloState?: { data?: Record<string, Record<string, unknown>> } } } } | null
  const cache = data?.props?.pageProps?.apolloState?.data
  if (!cache) return null

  // Map each listing to its company through StartupResult.highlightedJobListings.
  const companyOf = new Map<string, string>()
  for (const [key, rec] of Object.entries(cache)) {
    if (!key.startsWith("StartupResult:")) continue
    const name = str(rec.name)
    const refs = Array.isArray(rec.highlightedJobListings) ? rec.highlightedJobListings : []
    for (const ref of refs) {
      const r = (ref as { __ref?: unknown }).__ref
      if (name && typeof r === "string") companyOf.set(r, name)
    }
  }

  const cards: JobCard[] = []
  for (const [key, rec] of Object.entries(cache)) {
    if (!key.startsWith("JobListingSearchResult:")) continue
    try {
      const id = rec.id !== undefined && rec.id !== null ? String(rec.id) : null
      const title = str(rec.title)
      const slug = str(rec.slug)
      if (!id || !title) continue
      const live = typeof rec.liveStartAt === "number" ? new Date(rec.liveStartAt * 1000) : null
      const locations = strList(rec.locationNames)
      cards.push({
        id,
        title: decodeHtmlEntities(title),
        company: companyOf.get(key) ?? null,
        location: locations.length ? locations.join(", ") : null,
        remote: rec.remote === true,
        remoteLocations: strList(rec.acceptedRemoteLocationNames),
        date: live && !Number.isNaN(live.getTime()) ? live.toISOString().slice(0, 10) : null,
        url: `${BASE}/jobs/${id}${slug ? `-${slug}` : ""}`,
        role: str(rec.primaryRoleTitle),
        compensation: str(rec.compensation),
        yearsExperienceMin: typeof rec.yearsExperienceMin === "number" ? rec.yearsExperienceMin : null,
      })
    } catch {
      continue
    }
  }
  return cards.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
}

/**
 * Keep cards whose title matches any keyword (whole-word, case-insensitive).
 * The title alone is checked: role pages tag loosely related jobs with the
 * page's role, so matching on that tag returned support and product roles.
 */
export function filterByKeywords(cards: JobCard[], query: string | undefined): JobCard[] {
  const terms = (query ?? "").toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return cards
  const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const res = terms.map((t) => new RegExp(`(?<![a-z0-9])${escape(t)}(?![a-z0-9])`, "i"))
  return cards.filter((c) => res.some((re) => re.test(c.title)))
}

/** Keep jobs posted within `days` days. Jobs with no date are kept, not guessed at. */
export function filterByAge(cards: JobCard[], days: number | undefined, now = Date.now()): JobCard[] {
  if (!days) return cards
  const cutoff = now - days * 86400000
  return cards.filter((c) => {
    if (!c.date) return true
    const t = Date.parse(c.date)
    return Number.isNaN(t) || t >= cutoff
  })
}

export function idFromUrl(url: string): string | null {
  const m = url.match(/\/jobs\/(\d+)(?:-|$|\/|\?)/)
  return m ? m[1] : null
}

/** Parse the JobPosting JSON-LD block of a job page. */
export function parseJobDetail(html: string, url: string): JobDetail | null {
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const block of blocks) {
    let data: unknown
    try {
      data = JSON.parse(block[1])
    } catch {
      continue
    }
    for (const c of Array.isArray(data) ? data : [data]) {
      const d = c as Record<string, unknown>
      if (d["@type"] !== "JobPosting") continue
      const org = d.hiringOrganization as Record<string, unknown> | undefined
      const locs = Array.isArray(d.jobLocation) ? d.jobLocation : d.jobLocation ? [d.jobLocation] : []
      const places = locs
        .map((l) => {
          const a = (l as Record<string, unknown>).address as Record<string, unknown> | undefined
          return [str(a?.addressLocality), str(a?.addressRegion), str(a?.addressCountry)].filter(Boolean).join(", ")
        })
        .filter(Boolean)
      const reqs = d.applicantLocationRequirements
      const applicantLocations = (Array.isArray(reqs) ? reqs : reqs ? [reqs] : [])
        .map((r) => str((r as Record<string, unknown>).name))
        .filter((x): x is string => !!x)
      const description = str(d.description)
      const posted = str(d.datePosted)
      const valid = str(d.validThrough)
      const employment = Array.isArray(d.employmentType) ? d.employmentType.join(", ") : str(d.employmentType)
      return {
        id: idFromUrl(url) ?? "",
        title: str(d.title) ? decodeHtmlEntities(str(d.title)!) : null,
        company: org ? str(org.name) : null,
        location: places.length ? places.join(" / ") : null,
        remote: d.jobLocationType === "TELECOMMUTE",
        applicantLocations,
        date: posted ? posted.slice(0, 10) : null,
        deadline: valid ? valid.slice(0, 10) : null,
        employmentType: employment,
        description: description ? htmlToText(description) : null,
        url,
      }
    }
  }
  return null
}
