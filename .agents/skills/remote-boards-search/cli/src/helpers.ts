export interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  description: string | null
  source: string
}

export function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null
  const text = value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
  return text || null
}

export function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

export function parseRss(xml: string, source = "weworkremotely"): JobResult[] {
  const items = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) ?? []
  const field = (item: string, tag: string) => {
    const match = item.match(new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + tag + ">", "i"))
    return match ? cleanText(match[1]) : null
  }
  return items.flatMap((item) => {
    const title = field(item, "title")
    const url = field(item, "link")
    if (!title || !url || !/^https?:\/\//i.test(url)) return []
    const descriptionMatch = item.match(/<description(?:\s[^>]*)?>([\s\S]*?)<\/description>/i)
    const guid = field(item, "guid")
    return [{
      id: guid ?? url,
      title,
      company: null,
      location: "Remote",
      date: normalizeDate(field(item, "pubDate")),
      url,
      description: descriptionMatch ? cleanText(descriptionMatch[1]) : null,
      source,
    }]
  })
}

// Title must name the engineering domain. Generic words like "software" or
// "systems" are deliberately absent: they let web and full-stack roles through.
const DOMAIN_TITLE = /(?<![a-z0-9])(embedded|firmware|linux|platform engineer|build(?: and| &)? (?:release|engineer\w*|systems?|infra\w*|tools?)|release engineer\w*|devops|sre|site reliability|infrastructure|toolchain|compiler|cross[- ]compil\w*|cmake|yocto|bitbake|bsp|board support|robotics|ros2?|kernel|ci\/cd|continuous integration|developer (?:tools?|experience|productivity)|c\+\+|c\/c\+\+|automotive|autonomous|gpu|hpc)(?![a-z0-9])/i
const IRRELEVANT_TITLE = /(?<![a-z0-9])(marketing|sales(?:force)?|recruit(?:er|ing)|account manager|customer success|customer support|real estate|administrative assistant|administrator|executive assistant|copywriter|content writer|graphic designer|designer|social media|nurse|teacher|tutor|insurance agent|financial advisor|business development|appointment setter|virtual assistant|react|front[- ]?end|full[- ]?stack|web|wordpress|shopify|ios|ui|ux|code trainer|ai trainer|data annotat\w*)(?![a-z0-9])/i
const SKILL_TERMS = [
  "embedded", "yocto", "bitbake", "linux", "c++", "cmake", "cross-compilation",
  "cross compilation", "toolchain", "firmware", "kernel", "device driver", "docker",
  "gitlab ci", "ci/cd", "build system", "build engineer", "release engineering",
  "robotics", "ros", "gcc", "clang", "python", "bash", "devops", "infrastructure",
]

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Whole-term match: "ros" must not hit "across", and "c++" needs its own
// boundaries because \b never matches after "+".
export function hasTerm(text: string, term: string): boolean {
  return new RegExp("(?<![a-z0-9])" + escapeRegExp(term.toLowerCase()) + "(?![a-z0-9])", "i").test(text)
}

export function relevanceScore(job: JobResult): number {
  const title = job.title.toLowerCase()
  const description = (job.description ?? "").toLowerCase()
  let score = 0
  if (DOMAIN_TITLE.test(title)) score += 5
  if (IRRELEVANT_TITLE.test(title)) score -= 8
  for (const term of SKILL_TERMS) {
    if (hasTerm(title, term)) score += 3
    else if (hasTerm(description, term)) score += 1
  }
  return score
}

export function filterJobs(
  jobs: JobResult[],
  query: string,
  jobageDays: number,
  minRelevance = 6,
): JobResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const cutoff = jobageDays > 0 ? Date.now() - jobageDays * 86400000 : 0
  return jobs.filter((job) => {
    const title = job.title.toLowerCase()
    // Search terms are alternatives, but must appear in the title: long
    // descriptions on aggregator ads list every technology and match anything.
    if (terms.length && !terms.some((term) => hasTerm(title, term))) return false
    if (cutoff && job.date) {
      const timestamp = new Date(job.date).getTime()
      if (!Number.isNaN(timestamp) && timestamp < cutoff) return false
    }
    if (IRRELEVANT_TITLE.test(title)) return false
    if (!DOMAIN_TITLE.test(title)) return false
    if (relevanceScore(job) < minRelevance) return false
    return true
  })
}
