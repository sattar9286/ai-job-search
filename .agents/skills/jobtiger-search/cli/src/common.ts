// Shared fetch, error and text helpers for this portal CLI. Zero dependencies.

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

export interface FetchOpts {
  method?: "GET" | "POST"
  body?: string
  accept?: string
  contentType?: string
  /** Decode the body with this charset instead of the response's declared one. */
  charset?: string
}

/** Fetch text with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function fetchText(url: string, ua: string, opts: FetchOpts = {}): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const headers: Record<string, string> = {
      "User-Agent": ua,
      Accept: opts.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    }
    if (opts.contentType) headers["Content-Type"] = opts.contentType
    const response = await fetch(url, {
      method: opts.method ?? "GET",
      body: opts.body,
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
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
    if (opts.charset) return new TextDecoder(opts.charset).decode(await response.arrayBuffer())
    return response.text()
  }
  throw new Error("Request failed after max retries")
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
    .map((line) => line.replace(/[ \t  ]+/g, " ").trim())
    .filter((line, i, all) => line !== "" || (i > 0 && all[i - 1] !== ""))
    .join("\n")
    .trim()
}

export function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null
}

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Keep items posted within `days` days. Undated items are kept, not guessed at. */
export function filterByAge<T extends { date: string | null }>(items: T[], days: number | undefined, now = Date.now()): T[] {
  if (!days) return items
  const cutoff = now - days * 86400000
  return items.filter((j) => {
    if (!j.date) return true
    const t = Date.parse(j.date)
    return Number.isNaN(t) || t >= cutoff
  })
}

/** All schema.org JobPosting objects in a page's JSON-LD blocks (handles @graph and encoded types). */
export function jobPostings(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  const blocks = html.matchAll(/<script[^>]*type="application\/ld(?:\+|&#x2B;|&#43;)json"[^>]*>([\s\S]*?)<\/script>/gi)
  for (const block of blocks) {
    let data: unknown
    try {
      data = JSON.parse(block[1])
    } catch {
      continue
    }
    const queue: unknown[] = Array.isArray(data) ? [...data] : [data]
    while (queue.length) {
      const item = queue.shift() as Record<string, unknown> | null
      if (!item || typeof item !== "object") continue
      if (Array.isArray(item["@graph"])) queue.push(...(item["@graph"] as unknown[]))
      if (item["@type"] === "JobPosting") out.push(item)
    }
  }
  return out
}

/** Common CLI plumbing: flag parsing, validation, and table rendering. */
export interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

export function parseFlags(argv: string[], alias: Record<string, string>, booleans: Set<string> = new Set()): Flags {
  const flags: Flags = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (booleans.has(key) || key === "help" || key === "h" || next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return flags
}

export function fail(error: string, code: string): number {
  writeError(error, code)
  return 1
}

export function wholeNumber(name: string, raw: string | boolean | string[]): number | null {
  const val = typeof raw === "string" ? Number(raw.trim()) : NaN
  if (!Number.isInteger(val) || val < 1) {
    fail(`--${name} must be a whole number of at least 1, got "${raw}"`, "BAD_ARG")
    return null
  }
  return val
}

/** Reject any flag the command does not support, so a typo never silently widens a search. */
export function rejectUnknown(flags: Flags, known: Set<string>, cmd: string): boolean {
  for (const key of Object.keys(flags)) {
    if (key === "_" || key === "help" || key === "h" || known.has(key)) continue
    fail(
      `unknown flag --${key} for '${cmd}' - flags are never silently ignored, because a discarded filter changes what the search returns; see --help`,
      "UNKNOWN_FLAG",
    )
    return true
  }
  return false
}

export interface Row {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
}

export function renderTable(rows: Row[]): string {
  if (rows.length === 0) return "No results."
  const cut = (s: string | null, n: number) => (s || "—").replace(/\s+/g, " ").slice(0, n).padEnd(n)
  const header = "ID".padEnd(10) + " " + "TITLE".padEnd(42) + " " + "COMPANY".padEnd(24) + " " + "LOCATION".padEnd(20) + " DATE"
  return [header, "-".repeat(header.length), ...rows.map((r) => `${cut(r.id, 10)} ${cut(r.title, 42)} ${cut(r.company, 24)} ${cut(r.location, 20)} ${r.date || "—"}`)].join("\n")
}

export function renderPlain(rows: (Row & { url: string })[]): string {
  return rows.map((r) => `${r.title}\n  ${r.company || "—"} · ${r.location || "—"} · ${r.date || "—"}\n  id: ${r.id}\n  ${r.url}`).join("\n\n")
}
