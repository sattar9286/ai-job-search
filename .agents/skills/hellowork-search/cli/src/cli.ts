#!/usr/bin/env bun
// Self-contained CLI for Hellowork (hellowork.com), France. Zero runtime dependencies.
// Personal use only; keep volume low.

import { fail, filterByAge, parseFlags, rejectUnknown, renderPlain, renderTable, wholeNumber, writeError } from "./common.js"
import { fetchPage, searchUrls, normalizeRef, parseDetail, parseSearch } from "./hellowork.js"

const HELP = `hellowork-cli — search jobs on Hellowork (France)

USAGE
  bun run src/cli.ts search -q "<keywords>" [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords. REQUIRED.
  --jobage <days>         Keep jobs posted within N days (client-side).
  --page <n>              Only 1 is supported (robots.txt disallows paged URLs).
  --limit, -n <n>         Cap results emitted.
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "devops" --jobage 14 --format table
  bun run src/cli.ts search -q "linux embarqué" --format table
  bun run src/cli.ts search -q "yocto" --format table
  bun run src/cli.ts detail 84404573 --format plain

Personal use only — keep volume low.
`

const KNOWN: Record<string, Set<string>> = {
  search: new Set(["query", "jobage", "page", "limit", "format"]),
  detail: new Set(["format"]),
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2), { q: "query", n: "limit" })
  const cmd = flags._[0]
  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }
  if (!KNOWN[cmd]) return fail(`Unknown command "${cmd}"`, "BAD_CMD")
  if (rejectUnknown(flags, KNOWN[cmd], cmd)) return 1
  const fmt = typeof flags.format === "string" ? flags.format : "json"

  if (cmd === "search") {
    const query = typeof flags.query === "string" ? flags.query.trim() : ""
    if (!query) return fail('the --query/-q flag is required (e.g. -q "devops")', "NO_QUERY")
    if (!["json", "table", "plain"].includes(fmt)) return fail("--format must be json, table, or plain", "BAD_ARG")
    const nums: Record<string, number | undefined> = {}
    for (const name of ["jobage", "page", "limit"]) {
      if (flags[name] === undefined) continue
      const v = wholeNumber(name, flags[name])
      if (v === null) return 1
      nums[name] = v
    }
    if (nums.page !== undefined && nums.page !== 1) {
      return fail("only --page 1 is supported: robots.txt disallows Hellowork URLs with query strings", "UNSUPPORTED_PAGE")
    }
    try {
      // Job-title page first, then keyword page; neither existing means zero results.
      let html = ""
      let source: string | null = null
      for (const url of searchUrls(query)) {
        html = await fetchPage(url)
        if (html) {
          source = url
          break
        }
      }
      let items = filterByAge(html ? parseSearch(html) : [], nums.jobage)
      if (nums.limit !== undefined) items = items.slice(0, nums.limit)
      if (fmt === "table") process.stdout.write(renderTable(items) + "\n")
      else if (fmt === "plain") process.stdout.write(renderPlain(items) + "\n")
      else process.stdout.write(JSON.stringify({ meta: { count: items.length, page: 1, source }, results: items }, null, 2) + "\n")
      return 0
    } catch (e) {
      writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
      return 1
    }
  }

  if (!["json", "plain"].includes(fmt)) return fail("--format must be json or plain", "BAD_ARG")
  const ref = flags._[1]
  if (!ref) return fail("detail requires a Hellowork job <id|url>", "NO_ID")
  const url = normalizeRef(ref)
  if (!url) return fail(`"${ref}" is not a Hellowork job ID or https://www.hellowork.com/fr-fr/emplois/<id>.html URL`, "BAD_ID")
  try {
    const html = await fetchPage(url)
    if (!html) return fail("Job not found", "NOT_FOUND")
    const job = parseDetail(html, url)
    if (!job) return fail("Job page has no JobPosting data - the ad may be closed, or Hellowork changed its markup", "PARSE_FAILED")
    if (fmt === "plain") {
      const lines = [
        job.title ?? "(no title)",
        `${job.company || "—"} · ${job.location || "—"}`,
        "",
        job.date ? `Posted: ${job.date}` : "",
        job.deadline ? `Valid through: ${job.deadline}` : "",
        job.employmentType ? `Employment: ${job.employmentType}` : "",
        "",
        job.description || "(no description)",
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
