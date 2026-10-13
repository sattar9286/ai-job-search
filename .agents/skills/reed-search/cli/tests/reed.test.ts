import { describe, expect, test } from "bun:test"
import { runCLI, parseJSON } from "./helpers.js"
import { buildSearchUrl, dateOffset, filterByAge, parseJobDetail, parseSearchResults, slugify, type JobCard } from "../src/helpers.js"
import { normalizeRef } from "../src/commands/detail.js"

interface SearchOutput {
  meta: { count: number; page: number }
  results: JobCard[]
}

const nextData = (pageProps: unknown) =>
  `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({ props: { pageProps } })}</script>`

describe("parsing", () => {
  test("builds robots-compliant search URLs", () => {
    expect(slugify("Embedded Linux")).toBe("embedded-linux")
    expect(slugify("C++")).toBe("c%2B%2B")
    expect(buildSearchUrl({ query: "yocto" })).toBe("https://www.reed.co.uk/jobs/yocto-jobs")
    expect(buildSearchUrl({ query: "embedded linux", location: "Cambridge", jobage: 14, page: 2 })).toBe(
      "https://www.reed.co.uk/jobs/embedded-linux-jobs-in-cambridge?dateCreatedOffSet=lasttwoweeks&pageno=2",
    )
  })

  test("maps job age onto Reed's date buckets", () => {
    expect(dateOffset(1)).toBe("today")
    expect(dateOffset(3)).toBe("lastthreedays")
    expect(dateOffset(7)).toBe("lastweek")
    expect(dateOffset(14)).toBe("lasttwoweeks")
    expect(dateOffset(30)).toBeNull()
  })

  test("parses search results and the UK-only flag", () => {
    const html = nextData({
      searchResults: {
        count: 2,
        jobs: [
          { url: "/jobs/devops-engineer/57340750", jobDetail: { jobId: 57340750, jobTitle: "DevOps Engineer", ouName: "Matchtech ", displayLocationName: "Portsmouth", countyLocation: "Hampshire", displayDate: "2026-09-14T08:16:21", expiryDate: "2026-10-26T23:55:00", salaryFrom: 56000, salaryTo: 63000, eligibleUkOnly: true, workingOption: "onSite" } },
          { url: null, jobDetail: { jobId: null } },
        ],
      },
    })
    const parsed = parseSearchResults(html)!
    expect(parsed.total).toBe(2)
    expect(parsed.items).toHaveLength(1)
    expect(parsed.items[0]).toMatchObject({ id: "57340750", company: "Matchtech", location: "Portsmouth, Hampshire", date: "2026-09-14", deadline: "2026-10-26", salary: "£56,000 - £63,000", eligibleUkOnly: true, url: "https://www.reed.co.uk/jobs/devops-engineer/57340750" })
  })

  test("returns null without search data", () => {
    expect(parseSearchResults("<html></html>")).toBeNull()
    expect(parseSearchResults(nextData({}))).toBeNull()
  })

  test("filters by age and keeps undated jobs", () => {
    const now = Date.parse("2026-10-14T00:00:00Z")
    const job = (id: string, date: string | null) => ({ id, date }) as JobCard
    expect(filterByAge([job("new", "2026-10-10"), job("old", "2026-08-01"), job("none", null)], 14, now).map((j) => j.id)).toEqual(["new", "none"])
  })

  test("parses job pages, including eligibility and live status", () => {
    const html = nextData({
      consolidatedJobDetails: {
        jobDetails: { id: "57340750", title: "DevOps Engineer", description: "<p>CI/CD &amp; Yocto</p>", displayDate: "2026-09-14T08:16:21", expiryDate: "2026-10-26T23:55:00", isLive: "True", hasEligibilityToWorkInUk: "True", jobApplicationEligibilityRequirement: "None", isAgency: "True", jobLocation: { isRemoteJob: false }, jobContractType: { name: "Permanent" }, jobSalary: { displaySalary: "£56,000 - £63,000 per annum" } },
        gaTags: { jobRecruiterName: "Matchtech", jobLocation: "Portsmouth, Hampshire" },
      },
    })
    const job = parseJobDetail(html, "https://www.reed.co.uk/jobs/devops-engineer/57340750")!
    expect(job).toMatchObject({ id: "57340750", company: "Matchtech", deadline: "2026-10-26", isLive: true, requiresUkWorkEligibility: true, eligibilityRequirement: null, contractType: "Permanent", isAgency: true })
    expect(job.description).toBe("CI/CD & Yocto")
  })

  test("detail accepts a Reed ID or job URL only", () => {
    expect(normalizeRef("57340750")).toBe("https://www.reed.co.uk/jobs/job/57340750")
    expect(normalizeRef("https://www.reed.co.uk/jobs/devops-engineer/57340750?source=x")).toBe("https://www.reed.co.uk/jobs/devops-engineer/57340750")
    expect(normalizeRef("https://www.reed.co.uk.evil.io/jobs/devops-engineer/57340750")).toBeNull()
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
})

describe("live smoke test", () => {
  test("search returns real results", async () => {
    const out = parseJSON<SearchOutput>(await runCLI(["search", "-q", "devops", "--limit", "3"]))
    expect(out.results.length).toBeGreaterThan(0)
    for (const r of out.results) {
      expect(r.id).toBeTruthy()
      expect(r.title).toBeTruthy()
      expect(r.url).toMatch(/^https:\/\/www\.reed\.co\.uk\/jobs\//)
    }
  })
})
