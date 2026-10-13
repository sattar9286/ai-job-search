import { buildSearchUrl, filterByAge, htmlFetch, parseSearchResults, writeError, type JobCard } from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = c.title.slice(0, 42).padEnd(42)
    const company = (c.company || "—").slice(0, 24).padEnd(24)
    const loc = (c.location || "—").slice(0, 20).padEnd(20)
    return `${c.id.padEnd(9)} ${title} ${company} ${loc} ${c.date || "—"}`
  })
  const header = "ID".padEnd(9) + " " + "TITLE".padEnd(42) + " " + "COMPANY".padEnd(24) + " " + "LOCATION".padEnd(20) + " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = buildSearchUrl(opts)
    const html = await htmlFetch(url)
    const parsed = html ? parseSearchResults(html) : { items: [], total: 0 }
    if (!parsed) {
      writeError("Search page did not contain the expected Next.js result data - Reed may have changed its markup (see url-reference.md)", "PARSE_FAILED")
      return 1
    }
    // Reed's date buckets are coarse (and absent past 14 days), so filter exactly here too.
    let cards = filterByAge(parsed.items, opts.jobage)
    if (opts.limit !== undefined) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map((c) => `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}${c.eligibleUkOnly ? " · UK-eligible only" : ""}\n  id: ${c.id}\n  ${c.url}`)
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(JSON.stringify({ meta: { count: cards.length, page: opts.page, total: parsed.total }, results: cards }, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
