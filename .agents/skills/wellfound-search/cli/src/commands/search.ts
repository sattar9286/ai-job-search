import {
  RoleNotFoundError,
  buildRoleUrl,
  filterByAge,
  filterByKeywords,
  htmlFetch,
  parseRolePage,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  role: string
  query?: string
  location?: string
  remote: boolean
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = c.title.slice(0, 40).padEnd(40)
    const company = (c.company || "—").slice(0, 22).padEnd(22)
    const loc = ((c.remote ? "Remote " : "") + (c.location || "")).trim().slice(0, 22).padEnd(22) || "—".padEnd(22)
    return `${c.id.padEnd(8)} ${title} ${company} ${loc} ${c.date || "—"}`
  })
  const header = "ID".padEnd(8) + " " + "TITLE".padEnd(40) + " " + "COMPANY".padEnd(22) + " " + "LOCATION".padEnd(22) + " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = buildRoleUrl(opts.role, { remote: opts.remote, location: opts.location, page: opts.page })
    const html = await htmlFetch(url, { roleRedirectIsMissing: true })
    const parsed = html ? parseRolePage(html) : []
    if (!parsed) {
      writeError("Role page did not contain the expected Apollo data - Wellfound may have changed its markup (see url-reference.md)", "PARSE_FAILED")
      return 1
    }
    let cards = filterByAge(filterByKeywords(parsed, opts.query), opts.jobage)
    if (opts.limit !== undefined) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map((c) => `${c.title}\n  ${c.company || "—"} · ${c.remote ? "Remote" : "On-site"}${c.location ? ` · ${c.location}` : ""} · ${c.date || "—"}\n  id: ${c.id}\n  ${c.url}`)
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(JSON.stringify({ meta: { count: cards.length, page: opts.page, source: url }, results: cards }, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    if (e instanceof RoleNotFoundError) {
      writeError(`${e.message}. Use a Wellfound role slug such as devops-engineer, embedded-software-engineer, software-engineer, site-reliability-engineer`, "ROLE_NOT_FOUND")
      return 1
    }
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
