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
  return items.flatMap((item, index) => {
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

export function filterJobs(
  jobs: JobResult[],
  query: string,
  jobageDays: number,
): JobResult[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const cutoff = jobageDays > 0 ? Date.now() - jobageDays * 86400000 : 0
  return jobs.filter((job) => {
    const haystack = [job.title, job.company, job.location, job.description].filter(Boolean).join(" ").toLowerCase()
    if (terms.length && !terms.every((term) => haystack.includes(term))) return false
    if (cutoff && job.date) {
      const timestamp = new Date(job.date).getTime()
      if (!Number.isNaN(timestamp) && timestamp < cutoff) return false
    }
    return true
  })
}
