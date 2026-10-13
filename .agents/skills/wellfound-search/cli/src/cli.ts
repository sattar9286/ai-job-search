#!/usr/bin/env bun
// Self-contained CLI for searching startup jobs on Wellfound's public role pages.
// Zero runtime dependencies. Personal use only; keep volume low.
// robots.txt disallows /search, so the CLI reads role pages and filters by keyword.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit", r: "role" }
  const booleans = new Set(["remote", "help", "h"])
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (booleans.has(key) || next === undefined || next.startsWith("-")) {
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

const HELP = `wellfound-cli — search startup jobs on Wellfound

USAGE
  bun run src/cli.ts search --role <role-slug> [flags]
  bun run src/cli.ts detail <job url> [--format json|plain]

SEARCH FLAGS
  --role, -r <slug>       Wellfound role page. REQUIRED. e.g. devops-engineer,
                          embedded-software-engineer, software-engineer,
                          site-reliability-engineer. Unknown slugs exit 1 (ROLE_NOT_FOUND).
  --remote                Remote listings only (/role/r/<role>).
  --location, -l <text>   Location page (/role/l/<role>/<location>), e.g. "germany", "london".
  --query, -q <words>     Keep listings whose title matches any word (client-side).
  --jobage <days>         Keep listings posted within N days (client-side).
  --page <n>              1-indexed page. Default 1.
  --limit, -n <n>         Cap results emitted.
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -r devops-engineer --remote --jobage 14 --format table
  bun run src/cli.ts search -r embedded-software-engineer --remote --format table
  bun run src/cli.ts search -r software-engineer --remote -q "infrastructure platform build" --format table
  bun run src/cli.ts search -r devops-engineer -l germany --format table
  bun run src/cli.ts detail "https://wellfound.com/jobs/4824568-devops-engineer" --format plain

Personal use only — keep volume low.
`

const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set(["role", "remote", "location", "query", "jobage", "page", "limit", "format", "help", "h"]),
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
    const role = typeof flags.role === "string" ? flags.role.trim() : ""
    if (!role) return fail('the --role/-r flag is required (e.g. -r devops-engineer)', "NO_ROLE")
    const location = typeof flags.location === "string" ? flags.location : undefined
    if (location && flags.remote) return fail("--remote and --location select different role pages; pass only one", "CONFLICTING_FLAGS")

    const nums: Record<string, number | undefined> = {}
    for (const name of ["jobage", "page", "limit"]) {
      if (flags[name] === undefined) continue
      const v = wholeNumber(name, flags[name])
      if (v === null) return 1
      nums[name] = v
    }
    const fmt = typeof flags.format === "string" ? flags.format : "json"
    if (!["json", "table", "plain"].includes(fmt)) return fail("--format must be json, table, or plain", "BAD_ARG")

    const opts: SearchOpts = {
      role,
      query: typeof flags.query === "string" ? flags.query : undefined,
      location,
      remote: flags.remote === true,
      jobage: nums.jobage,
      page: nums.page ?? 1,
      limit: nums.limit,
      format: fmt as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const ref = (flags._ as string[])[1]
    if (!ref) return fail("detail requires a Wellfound job URL", "NO_ID")
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
