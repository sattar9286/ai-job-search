import { describe, expect, test } from "bun:test"
import { runCLI, parseJSON } from "./helpers.js"
import { buildSearchUrl, filterByAge, idFromUrl, parseJobDetail, parseSearchResults, slugify, type JobCard } from "../src/helpers.js"
import { normalizeUrl } from "../src/commands/detail.js"

interface SearchOutput {
  meta: { count: number; page: number }
  results: JobCard[]
}

describe("parsing", () => {
  test("builds robots-compliant search URLs without a query string", () => {
    expect(slugify("Embedded Linux")).toBe("embedded-linux")
    expect(slugify("C++")).toBe("c%2B%2B")
    expect(slugify("Ingénieur DevOps")).toBe("ingenieur-devops")
    expect(buildSearchUrl("at", "Embedded Linux", "Wien")).toBe("https://www.stepstone.at/jobs/embedded-linux/in-wien")
    expect(buildSearchUrl("be", "devops")).toBe("https://www.stepstone.be/jobs/devops")
  })

  test("parses the preloaded result state and drops tracking params", () => {
    const state = {
      searchResults: {
        meta: { total: 2 },
        items: [
          { id: 990013, title: "Embedded Linux Engineer (w/m/d)", companyName: "Acme GmbH", location: "Wien", datePosted: "2026-10-03T15:02:03Z", url: "https://www.stepstone.at/stellenangebote--x--990013-inline.html?rltr=1_1", textSnippet: "<strong>Yocto</strong> Linux" },
          { id: 1, title: null, url: null },
        ],
      },
    }
    const html = `<script>__PRELOADED_STATE__["app-unifiedResultlist"] = ${JSON.stringify(state)};</script>`
    const parsed = parseSearchResults(html)!
    expect(parsed.total).toBe(2)
    expect(parsed.items).toHaveLength(1)
    expect(parsed.items[0]).toMatchObject({ id: "990013", company: "Acme GmbH", date: "2026-10-03", url: "https://www.stepstone.at/stellenangebote--x--990013-inline.html", snippet: "Yocto Linux" })
  })

  test("returns null when the state block is missing", () => {
    expect(parseSearchResults("<html></html>")).toBeNull()
  })

  test("filters by age and keeps undated jobs", () => {
    const now = Date.parse("2026-10-13T00:00:00Z")
    const job = (id: string, date: string | null): JobCard => ({ id, title: id, company: null, location: null, date, url: "u", snippet: null, validThrough: null })
    expect(filterByAge([job("new", "2026-10-10"), job("old", "2026-08-01"), job("none", null)], 14, now).map((j) => j.id)).toEqual(["new", "none"])
  })

  test("parses JobPosting JSON-LD into readable text", () => {
    const ld = { "@type": "JobPosting", title: "Build Engineer", url: "https://www.stepstone.be/jobs--Build-Engineer--2245536-inline.html", datePosted: "2026-10-13T00:00:00Z", validThrough: "2026-11-12T00:00:00Z", hiringOrganization: { name: "IEE S.A." }, jobLocation: { address: { addressLocality: "Luxembourg", addressCountry: "LU" } }, description: "<p>Yocto &amp; BitBake</p><ul><li>CI</li></ul>" }
    const job = parseJobDetail(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`, ld.url)!
    expect(job).toMatchObject({ id: "2245536", company: "IEE S.A.", location: "Luxembourg, LU", deadline: "2026-11-12" })
    expect(job.description).toContain("Yocto & BitBake")
    expect(job.description).toContain("- CI")
  })

  test("accepts only StepStone AT/BE job-ad URLs for detail", () => {
    expect(idFromUrl("https://www.stepstone.at/stellenangebote--x--990013-inline.html")).toBe("990013")
    expect(normalizeUrl("https://www.stepstone.at/stellenangebote--x--990013-inline.html?rltr=1")).toBe("https://www.stepstone.at/stellenangebote--x--990013-inline.html")
    expect(normalizeUrl("https://www.stepstone.at.evil.io/stellenangebote--x--990013-inline.html")).toBeNull()
    expect(normalizeUrl("990013")).toBeNull()
  })
})

describe("cli contract", () => {
  test("unknown flag exits 1 with JSON error on stderr", async () => {
    const r = await runCLI(["search", "-q", "devops", "--bogus", "x"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("UNKNOWN_FLAG")
  })

  test("missing query exits 1", async () => {
    const r = await runCLI(["search"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("NO_QUERY")
  })

  test("page beyond 1 is refused", async () => {
    const r = await runCLI(["search", "-q", "devops", "--page", "2"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("UNSUPPORTED_PAGE")
  })
})

describe("live smoke test", () => {
  test("search returns real results", async () => {
    const out = parseJSON<SearchOutput>(await runCLI(["search", "-q", "devops", "--limit", "3"]))
    expect(out.results.length).toBeGreaterThan(0)
    for (const r of out.results) {
      expect(r.id).toBeTruthy()
      expect(r.title).toBeTruthy()
      expect(r.url).toMatch(/^https:\/\/www\.stepstone\.at\//)
    }
  })
})
