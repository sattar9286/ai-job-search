import { describe, expect, test } from "bun:test"
import { runCLI, parseJSON } from "./helpers.js"
import { buildRoleUrl, filterByAge, filterByKeywords, parseJobDetail, parseRolePage, type JobCard } from "../src/helpers.js"
import { normalizeRef } from "../src/commands/detail.js"

interface SearchOutput {
  meta: { count: number; page: number }
  results: JobCard[]
}

const card = (id: string, title: string, date: string | null = null): JobCard => ({
  id, title, company: null, location: null, remote: true, remoteLocations: [], date, url: "u", role: "Embedded Software Engineer", compensation: null, yearsExperienceMin: null,
})

describe("parsing", () => {
  test("builds role page URLs", () => {
    expect(buildRoleUrl("DevOps Engineer")).toBe("https://wellfound.com/role/devops-engineer")
    expect(buildRoleUrl("devops-engineer", { remote: true, page: 2 })).toBe("https://wellfound.com/role/r/devops-engineer?page=2")
    expect(buildRoleUrl("devops-engineer", { location: "Germany" })).toBe("https://wellfound.com/role/l/devops-engineer/germany")
  })

  test("parses the Apollo cache and links listings to companies", () => {
    const cache = {
      "StartupResult:1": { name: "Acme", highlightedJobListings: [{ __ref: "JobListingSearchResult:42" }] },
      "JobListingSearchResult:42": { id: "42", title: "Embedded Linux Engineer", slug: "embedded-linux-engineer", liveStartAt: 1791744342, locationNames: ["Berlin"], remote: true, acceptedRemoteLocationNames: ["Germany"], primaryRoleTitle: "Embedded Software Engineer" },
      "JobListingSearchResult:43": { id: "43", title: null },
    }
    const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps: { apolloState: { data: cache } } } })}</script>`
    const cards = parseRolePage(html)!
    expect(cards).toHaveLength(1)
    expect(cards[0]).toMatchObject({ id: "42", company: "Acme", location: "Berlin", remoteLocations: ["Germany"], url: "https://wellfound.com/jobs/42-embedded-linux-engineer", date: "2026-10-11" })
  })

  test("returns null without Apollo data", () => {
    expect(parseRolePage("<html></html>")).toBeNull()
  })

  test("keyword filter matches whole words in the title only", () => {
    const cards = [card("a", "Partnership Support Engineer"), card("b", "Embedded Systems Software Engineer"), card("c", "DevOps Engineer")]
    expect(filterByKeywords(cards, "embedded devops").map((c) => c.id)).toEqual(["b", "c"])
    expect(filterByKeywords(cards, "ops").map((c) => c.id)).toEqual([])
  })

  test("age filter keeps undated listings", () => {
    const now = Date.parse("2026-10-14T00:00:00Z")
    expect(filterByAge([card("new", "x", "2026-10-10"), card("old", "x", "2026-08-01"), card("none", "x")], 14, now).map((c) => c.id)).toEqual(["new", "none"])
  })

  test("parses JobPosting JSON-LD", () => {
    const ld = { "@type": "JobPosting", title: "DevOps Engineer", datePosted: "2026-10-11T18:45:42Z", hiringOrganization: { name: "Neotrix" }, jobLocation: [{ address: { addressRegion: "Texas", addressCountry: "United States" } }], applicantLocationRequirements: { name: "United States" }, jobLocationType: "TELECOMMUTE", employmentType: "FULL_TIME", description: "<p>CI/CD &amp; IaC</p>" }
    const job = parseJobDetail(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`, "https://wellfound.com/jobs/4824568-devops-engineer")!
    expect(job).toMatchObject({ id: "4824568", company: "Neotrix", location: "Texas, United States", remote: true, applicantLocations: ["United States"], date: "2026-10-11" })
    expect(job.description).toBe("CI/CD & IaC")
  })

  test("detail accepts only wellfound job URLs with a slug", () => {
    expect(normalizeRef("https://wellfound.com/jobs/4824568-devops-engineer")).toBe("https://wellfound.com/jobs/4824568-devops-engineer")
    expect(normalizeRef("4824568")).toBeNull()
    expect(normalizeRef("https://wellfound.com.evil.io/jobs/4824568-devops-engineer")).toBeNull()
  })
})

describe("cli contract", () => {
  test("unknown flag exits 1 with JSON error on stderr", async () => {
    const r = await runCLI(["search", "-r", "devops-engineer", "--bogus", "x"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("UNKNOWN_FLAG")
  })

  test("missing role exits 1", async () => {
    const r = await runCLI(["search"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("NO_ROLE")
  })
})

describe("live smoke test", () => {
  test("remote devops role page returns real listings", async () => {
    const out = parseJSON<SearchOutput>(await runCLI(["search", "-r", "devops-engineer", "--remote", "--limit", "3"]))
    expect(out.results.length).toBeGreaterThan(0)
    for (const r of out.results) {
      expect(r.id).toBeTruthy()
      expect(r.title).toBeTruthy()
      expect(r.url).toMatch(/^https:\/\/wellfound\.com\/jobs\/\d+/)
    }
  })
})
