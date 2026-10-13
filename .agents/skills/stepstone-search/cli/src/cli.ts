#!/usr/bin/env bun
// Self-contained CLI for searching jobs on StepStone Austria (stepstone.at) and
// StepStone Belgium (stepstone.be). Zero runtime dependencies.
//
// Personal use only. Keep volume low. Requests stay inside each market's
// robots.txt: search URLs carry no query string, and job-ad URLs are fetched
// without StepStone's tracking parameters.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { MARKETS, type Market } from "./helpers.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit", m: "market" }
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

const HELP = `stepstone-cli — search jobs on StepStone Austria and Belgium

USAGE
  bun run src/cli.ts search -q "<keywords>" [flags]
  bun run src/cli.ts detail <job-ad url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (job title or skill). REQUIRED.
  --location, -l <text>   City, e.g. "Wien", "Graz", "Gent", "Brussels".
  --market, -m <code>     at (default) | be.
  --jobage <days>         Keep jobs posted within N days (filtered client-side).
  --page <n>              Only 1 is supported (robots.txt disallows paged URLs).
  --limit, -n <n>         Cap results emitted.
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "yocto" --format table
  bun run src/cli.ts search -q "embedded linux" -l "Wien" --jobage 14 --format table
  bun run src/cli.ts search -q "devops" -m be --limit 10
  bun run src/cli.ts detail "https://www.stepstone.at/stellenangebote--Embedded-Linux-Engineer-w-m-d-Wien-Mission-Embedded-GmbH--990013-inline.html" --format plain

Personal use only — keep volume low.
`

const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set(["query", "location", "market", "jobage", "page", "limit", "format", "help", "h"]),
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

    const market = (typeof flags.market === "string" ? flags.market.toLowerCase() : "at") as Market
    if (!(market in MARKETS)) return fail(`--market must be one of ${Object.keys(MARKETS).join(", ")}, got "${flags.market}"`, "BAD_ARG")

    let jobage: number | undefined
    if (flags.jobage !== undefined) {
      const v = wholeNumber("jobage", flags.jobage)
      if (v === null) return 1
      jobage = v
    }
    if (flags.page !== undefined) {
      const v = wholeNumber("page", flags.page)
      if (v === null) return 1
      if (v !== 1) {
        return fail("only --page 1 is supported: StepStone's robots.txt disallows paged search URLs; narrow the query or add --location instead", "UNSUPPORTED_PAGE")
      }
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
      market,
      jobage,
      limit,
      format: fmt as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const ref = (flags._ as string[])[1]
    if (!ref) return fail("detail requires a StepStone job-ad URL", "NO_ID")
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
