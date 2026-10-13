#!/usr/bin/env bun
import { cleanText, filterJobs, normalizeDate, parseRss, type JobResult } from "./helpers.js"

type Format = "json" | "table" | "plain"
const SOURCES = ["remoteok", "remotive", "weworkremotely"] as const
type Source = typeof SOURCES[number]

function parseArgs(argv: string[]) {
  const positional: string[] = []
  const flags: Record<string, string | boolean> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith("-")) { positional.push(arg); continue }
    const key = arg.replace(/^-+/, "")
    const next = argv[i + 1]
    if (next && !next.startsWith("-")) { flags[key] = next; i++ }
    else flags[key] = true
  }
  return { positional, flags }
}

function str(value: string | boolean | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback
}
function positiveInt(value: string | boolean | undefined, fallback: number): number {
  if (typeof value !== "string") return fallback
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : fallback
}
function outputError(source: string, error: unknown) {
  process.stderr.write(JSON.stringify({ source, error: error instanceof Error ? error.message : String(error) }) + "\n")
}

async function getJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  const response = await fetch(url, { headers: { "User-Agent": "ai-job-search/1.0 (personal job discovery)", ...headers }, signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error("HTTP " + response.status + " from " + new URL(url).hostname)
  return response.json()
}
async function getText(url: string): Promise<string> {
  const response = await fetch(url, { headers: { "User-Agent": "ai-job-search/1.0 (personal job discovery)", Accept: "application/rss+xml, application/xml, text/xml, text/html" }, signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error("HTTP " + response.status + " from " + new URL(url).hostname)
  return response.text()
}

async function remoteOk(query: string): Promise<JobResult[]> {
  const data = await getJson("https://remoteok.com/api", { Accept: "application/json" })
  const rows = Array.isArray(data) ? data.slice(1) : []
  return rows.flatMap((r: any) => {
    const title = typeof r.position === "string" ? r.position : null
    const url = typeof r.url === "string" ? r.url : null
    if (!title || !url) return []
    return [{ id: String(r.id ?? url), title, company: cleanText(r.company), location: cleanText(r.location) ?? "Remote", date: normalizeDate(r.date), url, description: cleanText(r.description), source: "remoteok" }]
  })
}
async function remotive(query: string): Promise<JobResult[]> {
  const params = new URLSearchParams({ limit: "100" })
  if (query) params.set("search", query)
  const data = await getJson("https://remotive.com/api/remote-jobs?" + params.toString())
  return (Array.isArray(data.jobs) ? data.jobs : []).flatMap((r: any) => {
    const title = typeof r.title === "string" ? r.title : null
    const url = typeof r.url === "string" ? r.url : null
    if (!title || !url) return []
    return [{ id: String(r.id ?? url), title, company: cleanText(r.company_name), location: cleanText(r.candidate_required_location) ?? "Remote", date: normalizeDate(r.publication_date), url, description: cleanText(r.description), source: "remotive" }]
  })
}
async function weWorkRemotely(): Promise<JobResult[]> {
  const xml = await getText("https://weworkremotely.com/categories/remote-programming-jobs.rss")
  const rows = parseRss(xml)
  return rows.map((job) => {
    const match = job.title.match(/^(.+?)\s*:\s*(.+)$/)
    return match ? { ...job, company: match[1].trim(), title: match[2].trim() } : job
  })
}
function table(jobs: JobResult[]): string {
  if (!jobs.length) return "No results."
  const cut = (s: string | null, n: number) => (s ?? "—").replace(/\s+/g, " ").slice(0, n).padEnd(n)
  return ["SOURCE       TITLE                                          COMPANY                    DATE",
    "-".repeat(91),
    ...jobs.map((j) => cut(j.source, 12) + " " + cut(j.title, 44) + " " + cut(j.company, 26) + " " + (j.date ?? "—"))].join("\n")
}
async function main(): Promise<number> {
  const { positional, flags } = parseArgs(process.argv.slice(2))
  const command = positional[0]
  if (!command || flags.help || flags.h) {
    process.stdout.write('Usage: cli.ts search [-q keywords] [--jobage days] [--limit n] [--source remoteok,remotive,weworkremotely] [--format json|table|plain]\n       cli.ts detail <http(s)-url> [--format json|plain]\n')
    return command ? 0 : 1
  }
  const format = str(flags.format, "json") as Format
  if (!["json", "table", "plain"].includes(format)) { outputError("cli", "format must be json, table, or plain"); return 2 }
  if (command === "detail") {
    const url = positional[1]
    if (!url || !/^https?:\/\//i.test(url)) { outputError("detail", "provide a full HTTP(S) job URL"); return 2 }
    try {
      const html = await getText(url)
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const descriptionMatch = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      const result = { url, title: cleanText(titleMatch?.[1]), description: cleanText(descriptionMatch?.[1]) ?? (cleanText(html) ?? "").slice(0, 12000), fetched: true }
      process.stdout.write(JSON.stringify(result, null, 2) + "\n")
      return 0
    } catch (e) { outputError("detail", e); return 1 }
  }
  if (command !== "search") { outputError("cli", "command must be search or detail"); return 2 }
  const query = str(flags.query ?? flags.q)
  const jobage = positiveInt(flags.jobage, 0)
  const limit = positiveInt(flags.limit ?? flags.n, 25)
  const page = positiveInt(flags.page, 1)
  const requested = str(flags.source).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  const sources: Source[] = requested.length ? SOURCES.filter((s) => requested.includes(s)) : [...SOURCES]
  if (requested.some((s) => !SOURCES.includes(s as Source)) || !sources.length) {
    outputError("cli", "source must be a comma-separated subset of " + SOURCES.join(", "))
    return 2
  }
  const jobs: JobResult[] = []
  const fetchers: Record<Source, () => Promise<JobResult[]>> = {
    remoteok: () => remoteOk(query),
    remotive: () => remotive(query),
    weworkremotely: () => weWorkRemotely(),
  }
  await Promise.all(sources.map(async (source) => {
    try { jobs.push(...await fetchers[source]()) }
    catch (e) { outputError(source, e) }
  }))
  const filtered = filterJobs(jobs, query, jobage)
  const unique = [...new Map(filtered.map((job) => [job.url, job])).values()]
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
  const start = (page - 1) * limit
  const results = unique.slice(start, start + limit)
  if (format === "table") process.stdout.write(table(results) + "\n")
  else if (format === "plain") process.stdout.write(results.map((j) => [j.title, "  " + (j.company ?? "—") + " · " + (j.location ?? "—") + " · " + (j.date ?? "—"), "  source: " + j.source, "  " + j.url].join("\n")).join("\n\n") + "\n")
  else process.stdout.write(JSON.stringify({ meta: { count: results.length, page, total: unique.length }, results }, null, 2) + "\n")
  if (!jobs.length) return 1
  return 0
}
if (import.meta.main) process.exitCode = await main()
