#!/usr/bin/env bun
// Self-contained CLI for the EURES European job portal (EU/EEA public employment
// services). Zero runtime dependencies. Personal use only; keep volume low.

import { fail, filterByAge, parseFlags, rejectUnknown, renderPlain, renderTable, wholeNumber, writeError } from "./common.js"
import { fetchDetail, normalizeId, parseDetail, parseSearch, search } from "./eures.js"

const HELP = `eures-cli — search EU/EEA vacancies on the EURES portal

USAGE
  bun run src/cli.ts search [-q "<keywords>"] [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords, matched anywhere in the vacancy.
  --country, -c <codes>   ISO country codes, comma-separated (e.g. de,nl,se).
  --eures-only            Only employers flagged as recruiting across the EU (EURES flag).
  --jobage <days>         Posted within N days (server bucket 1/3/7/31 plus exact client filter).
  --page <n>              1-indexed page. Default 1.
  --limit, -n <n>         Results per page, max 50. Default 25.
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "yocto" --jobage 14 --format table
  bun run src/cli.ts search -q "embedded linux" -c de,nl,at --jobage 7 --format table
  bun run src/cli.ts search -q "devops" --eures-only --format table
  bun run src/cli.ts detail <id from search> --format plain

Personal use only — keep volume low.
`

const KNOWN: Record<string, Set<string>> = {
  search: new Set(["query", "country", "eures-only", "jobage", "page", "limit", "format"]),
  detail: new Set(["format"]),
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2), { q: "query", c: "country", n: "limit" }, new Set(["eures-only"]))
  const cmd = flags._[0]
  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }
  if (!KNOWN[cmd]) return fail(`Unknown command "${cmd}"`, "BAD_CMD")
  if (rejectUnknown(flags, KNOWN[cmd], cmd)) return 1
  const fmt = typeof flags.format === "string" ? flags.format : "json"

  if (cmd === "search") {
    if (!["json", "table", "plain"].includes(fmt)) return fail("--format must be json, table, or plain", "BAD_ARG")
    const nums: Record<string, number | undefined> = {}
    for (const name of ["jobage", "page", "limit"]) {
      if (flags[name] === undefined) continue
      const v = wholeNumber(name, flags[name])
      if (v === null) return 1
      nums[name] = v
    }
    if ((nums.limit ?? 25) > 50) return fail("--limit is capped at 50 results per page", "BAD_ARG")
    const countries = typeof flags.country === "string" ? flags.country.split(",").map((c) => c.trim()).filter(Boolean) : []
    if (countries.some((c) => !/^[a-z]{2}$/i.test(c))) return fail("--country takes two-letter ISO codes, e.g. de,nl,se", "BAD_ARG")
    try {
      const body = await search({
        query: typeof flags.query === "string" ? flags.query : undefined,
        countries,
        jobage: nums.jobage,
        euresOnly: flags["eures-only"] === true,
        page: nums.page ?? 1,
        perPage: nums.limit ?? 25,
      })
      const parsed = parseSearch(body)
      if (!parsed) return fail("EURES returned an unexpected response shape (see url-reference.md)", "PARSE_FAILED")
      const items = filterByAge(parsed.items, nums.jobage)
      if (fmt === "table") process.stdout.write(renderTable(items.map((i) => ({ ...i, id: i.id.slice(0, 10) }))) + "\n")
      else if (fmt === "plain") process.stdout.write(renderPlain(items) + "\n")
      else process.stdout.write(JSON.stringify({ meta: { count: items.length, page: nums.page ?? 1, total: parsed.total }, results: items }, null, 2) + "\n")
      return 0
    } catch (e) {
      writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
      return 1
    }
  }

  // detail
  if (!["json", "plain"].includes(fmt)) return fail("--format must be json or plain", "BAD_ARG")
  const ref = flags._[1]
  if (!ref) return fail("detail requires a EURES vacancy <id|url>", "NO_ID")
  const id = normalizeId(ref)
  if (!id) return fail(`"${ref}" is not a EURES vacancy ID or jv-details URL`, "BAD_ID")
  try {
    const body = await fetchDetail(id)
    if (!body) return fail("Vacancy not found", "NOT_FOUND")
    const job = parseDetail(body)
    if (!job) return fail("EURES returned an unexpected vacancy shape (see url-reference.md)", "PARSE_FAILED")
    if (fmt === "plain") {
      const lines = [
        job.title ?? "(no title)",
        `${job.company || "—"} · ${job.location || "—"}`,
        "",
        job.date ? `Posted: ${job.date}` : "",
        job.deadline ? `Deadline: ${job.deadline}` : "",
        `EURES flag (recruits across the EU): ${job.euresFlag ? "yes" : "no"}`,
        job.requiredLanguages.length ? `Required languages: ${job.requiredLanguages.join(", ")}` : "",
        `Ad languages: ${job.adLanguages.join(", ")}`,
        job.employmentPeriod ? `Period: ${job.employmentPeriod}` : "",
        "",
        job.description || "(no description)",
        job.applicationInstructions ? `\nHow to apply:\n${job.applicationInstructions}` : "",
        "",
        `URL: ${job.url}`,
      ].filter((l, i, all) => l !== "" || all[i - 1] !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    writeError(e instanceof Error ? e.message : String(e), "INTERNAL_ERROR")
    process.exit(1)
  })
