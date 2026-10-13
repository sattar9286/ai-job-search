import { describe, expect, test } from "bun:test"
import { runCLI, parseJSON } from "./helpers.js"
import { normalizeRef, parseDetail, parseSearch, relativeDate, searchUrls, type JobCard } from "../src/hellowork.js"

interface SearchOutput {
  meta: { count: number; page: number }
  results: JobCard[]
}

const NOW = Date.parse("2026-10-14T12:00:00Z")

const card = (id: string, title: string, company: string, when: string) => `
  <a data-action="analytics#push" href="/fr-fr/emplois/${id}.html" title="${title} - ${company}" class="x" data-cy="offerTitle" target="_blank">
    <h3 class="inline"><p class="typo-l">${title}</p><p class="typo-s inline">${company}</p></h3></a>
  <div class="mt-6"><div class="readonly tag" data-cy="localisationCard"> Lyon - 69 </div>
  <div class="readonly tag" data-cy="contractCard"> CDI </div>
  <div class="readonly tag-secondary-s typo-s-bold w-fit border-0">45&#x202F;000 - 55&#x202F;000 &#x20AC; / an</div></div>
  <div class="typo-s">${when}</div>`

describe("parsing", () => {
  test("tries the job-title page, then the keyword page", () => {
    expect(searchUrls("Linux embarqué")).toEqual([
      "https://www.hellowork.com/fr-fr/emploi/metier_linux-embarque.html",
      "https://www.hellowork.com/fr-fr/emploi/mot-cle_linux-embarque.html",
    ])
  })

  test("converts relative French dates", () => {
    expect(relativeDate("il y a 12 heures", NOW)).toBe("2026-10-14")
    expect(relativeDate("il y a 3 jours", NOW)).toBe("2026-10-11")
    expect(relativeDate("hier", NOW)).toBe("2026-10-13")
    expect(relativeDate("bientôt", NOW)).toBeNull()
  })

  test("parses cards with company, location, contract and salary", () => {
    const html = card("84375312", "DevOps H/F", "Klanik", "il y a 1 jour") + card("84375312", "DevOps H/F", "Klanik", "il y a 1 jour") + card("84404573", "Lead DevOps H/F", "Astek", "il y a 4 heures")
    const items = parseSearch(html, NOW)
    expect(items.map((i) => i.id)).toEqual(["84375312", "84404573"])
    expect(items[0]).toMatchObject({ title: "DevOps H/F", company: "Klanik", location: "Lyon - 69", contract: "CDI", salary: "45 000 - 55 000 € / an", date: "2026-10-13" })
    expect(items[0].url).toBe("https://www.hellowork.com/fr-fr/emplois/84375312.html")
  })

  test("parses JobPosting JSON-LD with an entity-encoded script type", () => {
    const ld = { "@type": "JobPosting", title: "DevOps H/F", datePosted: "2026-10-13", validThrough: "2026-11-12", hiringOrganization: { name: "Astek" }, jobLocation: { address: { addressLocality: "Brest", addressCountry: "FR" } }, description: "Kubernetes &amp; Terraform" }
    const job = parseDetail(`<script type="application/ld&#x2B;json">${JSON.stringify(ld)}</script>`, "https://www.hellowork.com/fr-fr/emplois/84404573.html")!
    expect(job).toMatchObject({ id: "84404573", company: "Astek", location: "Brest, FR", deadline: "2026-11-12", description: "Kubernetes & Terraform" })
  })

  test("accepts Hellowork IDs and job URLs only", () => {
    expect(normalizeRef("84404573")).toBe("https://www.hellowork.com/fr-fr/emplois/84404573.html")
    expect(normalizeRef("https://www.hellowork.com/fr-fr/emplois/84404573.html")).toBe("https://www.hellowork.com/fr-fr/emplois/84404573.html")
    expect(normalizeRef("https://www.hellowork.com.evil.io/fr-fr/emplois/84404573.html")).toBeNull()
  })
})

describe("cli contract", () => {
  test("unknown flag exits 1 with JSON error on stderr", async () => {
    const r = await runCLI(["search", "-q", "devops", "--bogus", "x"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("UNKNOWN_FLAG")
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
      expect(r.url).toMatch(/^https:\/\/www\.hellowork\.com\/fr-fr\/emplois\/\d+\.html$/)
    }
  })
})
