import {
  buildSearchUrl,
  filterByAge,
  htmlFetch,
  parseSearchResults,
  writeError,
  type JobCard,
  type Market,
} from "../helpers.js"

export interface SearchOpts {
  query: string
  location?: string
  market: Market
  jobage?: number
  limit?: number
  format: "json" | "table" | "plain"
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = c.title.slice(0, 44).padEnd(44)
    const company = (c.company || "—").slice(0, 26).padEnd(26)
    const loc = (c.location || "—").slice(0, 18).padEnd(18)
    return `${c.id.padEnd(9)} ${title} ${company} ${loc} ${c.date || "—"}`
  })
  const header = "ID".padEnd(9) + " " + "TITLE".padEnd(44) + " " + "COMPANY".padEnd(26) + " " + "LOCATION".padEnd(18) + " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildSearchUrl(opts.market, opts.query, opts.location))
    // A 404 means StepStone has no landing page for that slug: no results.
    const parsed = html ? parseSearchResults(html) : { items: [], total: 0 }
    if (!parsed) {
      writeError("Search page did not contain the expected result state - StepStone may have changed its markup (see url-reference.md)", "PARSE_FAILED")
      return 1
    }
    let cards = filterByAge(parsed.items, opts.jobage)
    if (opts.limit !== undefined) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map((c) => `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}\n  id: ${c.id}\n  ${c.url}`)
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify({ meta: { count: cards.length, page: 1, total: parsed.total, market: opts.market }, results: cards }, null, 2) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
