#!/usr/bin/env bun
// Self-contained CLI for searching UK jobs on Reed.co.uk. Zero runtime dependencies.
// Personal use only; keep volume low. Requests stay inside robots.txt: /jobs/ pages
// with only the pageno and dateCreatedOffSet parameters.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
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

const HELP = `reed-cli — search UK jobs on Reed.co.uk

USAGE
  bun run src/cli.ts search -q "<keywords>" [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (job title or skill). REQUIRED.
  --location, -l <text>   UK town, city or county, e.g. "London", "Cambridge", "Bristol".
  --jobage <days>         Posted within N days (server bucket 1/3/7/14 plus exact client filter).
  --page <n>              1-indexed page (25 results/page). Default 1.
  --limit, -n <n>         Cap results emitted.
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "yocto" --format table
  bun run src/cli.ts search -q "embedded linux" -l "Cambridge" --jobage 14 --format table
  bun run src/cli.ts search -q "devops" --jobage 7 --page 2
  bun run src/cli.ts detail 57340750 --format plain

Personal use only — keep volume low.
`

const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set(["query", "location", "jobage", "page", "limit", "format", "help", "h"]),
  detail: new Set(["format", "help", "h"]),
}

function fail(error: string, code: string): number {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
  return 1
}

function wholeNumber(name: string, raw: string | boolean | string[]): number | null {
  const val = typeof raw === "string" ? Number(raw.trim()) : NaN
  if (!Number.isInteger(val) || val < 1) {
    fail(`--${name} must be a whole number of at least 1, got "${raw}"`, "BAD_ARG")
    return null
  }
  return val
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2))
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  const known = KNOWN_FLAGS[cmd]
  if (known) {
    for (const key of Object.keys(flags)) {
      if (key === "_" || known.has(key)) continue
      return fail(
        `unknown flag --${key} for '${cmd}' - flags are never silently ignored, because a discarded filter changes what the search returns; see --help`,
        "UNKNOWN_FLAG",
      )
    }
  }

  if (cmd === "search") {
    const query = typeof flags.query === "string" ? flags.query.trim() : ""
    if (!query) return fail('the --query/-q flag is required (e.g. -q "embedded linux")', "NO_QUERY")

    let jobage: number | undefined
    if (flags.jobage !== undefined) {
      const v = wholeNumber("jobage", flags.jobage)
      if (v === null) return 1
      jobage = v
    }
    let page = 1
    if (flags.page !== undefined) {
      const v = wholeNumber("page", flags.page)
      if (v === null) return 1
      page = v
    }
    let limit: number | undefined
    if (flags.limit !== undefined) {
      const v = wholeNumber("limit", flags.limit)
      if (v === null) return 1
      limit = v
    }

    const fmt = typeof flags.format === "string" ? flags.format : "json"
    if (!["json", "table", "plain"].includes(fmt)) return fail("--format must be json, table, or plain", "BAD_ARG")

    const opts: SearchOpts = {
      query,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage,
      page,
      limit,
      format: fmt as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const ref = (flags._ as string[])[1]
    if (!ref) return fail("detail requires a Reed job <id|url>", "NO_ID")
    const fmt = typeof flags.format === "string" ? flags.format : "json"
    if (!["json", "plain"].includes(fmt)) return fail("--format must be json or plain", "BAD_ARG")
    const opts: DetailOpts = { ref, format: fmt as DetailOpts["format"] }
    return runDetail(opts)
  }

  return fail(`Unknown command "${cmd}"`, "BAD_CMD")
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    process.stderr.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e), code: "INTERNAL_ERROR" }) + "\n")
    process.exit(1)
  })
