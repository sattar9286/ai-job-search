import { describe, expect, test } from "bun:test"
import { runCLI, parseJSON } from "./helpers.js"
import { buildSearchUrl, normalizeRef, parseDetail, parseSearch, type JobCard } from "../src/meteojob.js"

interface SearchOutput {
  meta: { count: number; page: number }
  results: JobCard[]
}

describe("parsing", () => {
  test("builds robots-allowed /jobs? search URLs", () => {
    expect(buildSearchUrl({ query: "devops" })).toBe("https://www.meteojob.com/jobs?what=devops")
    expect(buildSearchUrl({ query: "linux embarqué", location: "Toulouse", page: 2 })).toBe("https://www.meteojob.com/jobs?what=linux+embarqu%C3%A9&where=Toulouse&page=2")
  })

  test("parses the transfer state, including the ad language", () => {
    const state = {
      "app:search:offers": {
        total: 398,
        content: [
          { id: "57445840", title: "DevOps H/F", publicationDate: "2026-10-12T22:37:35Z", locality: "Marseille (13)", company: { name: "Le Mercato" }, contentLanguage: "fr", contractTypes: ["CDI"], benefits: "45000 €", highlight: "<b>Infra</b>" },
          { id: "1", title: "Hidden", anonymous: true, recruiter: "X" },
          { id: null, title: "broken" },
        ],
      },
    }
    const parsed = parseSearch(`<script id="candidate-front-state" type="application/json">${JSON.stringify(state)}</script>`)!
    expect(parsed.total).toBe(398)
    expect(parsed.items.map((i) => i.id)).toEqual(["57445840", "1"])
    expect(parsed.items[0]).toMatchObject({ company: "Le Mercato", date: "2026-10-12", contentLanguage: "fr", contractTypes: ["CDI"], snippet: "Infra", url: "https://www.meteojob.com/jobs/57445840" })
    expect(parsed.items[1].company).toBeNull()
  })

  test("returns null without the state block", () => {
    expect(parseSearch("<html></html>")).toBeNull()
  })

  test("parses JobPosting JSON-LD", () => {
    const ld = { "@type": "JobPosting", title: "DevOps H/F", datePosted: "2026-10-12T22:37:35Z", validThrough: "2026-12-11T22:37:35Z", hiringOrganization: { name: "Le Mercato" }, jobLocation: { address: { addressLocality: "Marseille", addressCountry: "FR" } }, experienceRequirements: { monthsOfExperience: 72 }, description: "<p>Ansible</p>" }
    const job = parseDetail(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`, "https://www.meteojob.com/jobs/57445840")!
    expect(job).toMatchObject({ id: "57445840", location: "Marseille, FR", deadline: "2026-12-11", experienceMonths: 72, description: "Ansible" })
  })

  test("accepts Meteojob IDs and URLs only", () => {
    expect(normalizeRef("57445840")).toBe("https://www.meteojob.com/jobs/57445840")
    expect(normalizeRef("https://www.meteojob.com/jobs/57445840")).toBe("https://www.meteojob.com/jobs/57445840")
    expect(normalizeRef("https://meteojob.com.evil.io/jobs/57445840")).toBeNull()
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
      expect(r.url).toMatch(/^https:\/\/www\.meteojob\.com\/jobs\/\d+$/)
    }
  })
})
