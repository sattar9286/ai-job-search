import { describe, expect, test } from "bun:test"
import { runCLI, parseJSON } from "./helpers.js"
import { bgDate, buildSearchUrl, normalizeUrl, parseDetail, parseSearch, type JobCard } from "../src/jobtiger.js"

interface SearchOutput {
  meta: { count: number; page: number }
  results: JobCard[]
}

const card = (id: string, title: string) => `
  <a href="/obiavi-za-rabota/${title.toLowerCase().replace(/\W+/g, "-")}-${id}-2" class="jt-card" data-jt-card>
    <div class="jt-card__content"><h3 class="jt-card__title">${title}</h3>
    <div class="jt-card__company"> Cross Source </div><div class="jt-card__location"> София </div>
    <div class="jt-card__date"><div class="date">18.09.2026</div></div></div>
  </a>`

describe("parsing", () => {
  test("builds the English-interface search URL", () => {
    expect(buildSearchUrl("embedded linux")).toBe("https://www.jobtiger.bg/obiavi-za-rabota/?keyword=embedded+linux&ln=2")
  })

  test("converts Bulgarian dates", () => {
    expect(bgDate("18.09.2026")).toBe("2026-09-18")
    expect(bgDate("1.2.2026")).toBe("2026-02-01")
    expect(bgDate(null)).toBeNull()
  })

  test("parses job cards and skips duplicates and non-card links", () => {
    const html = card("328780", "Embedded Linux Software Engineer") + card("328780", "Embedded Linux Software Engineer") + `<a href="/obiavi-za-rabota/x-1-2" class="other">x</a>` + card("328545", "C/Embedded Developer")
    const items = parseSearch(html)
    expect(items.map((i) => i.id)).toEqual(["328780", "328545"])
    expect(items[0]).toMatchObject({ title: "Embedded Linux Software Engineer", company: "Cross Source", location: "София", date: "2026-09-18" })
    expect(items[0].url).toBe("https://www.jobtiger.bg/obiavi-za-rabota/embedded-linux-software-engineer-328780-2")
  })

  test("parses JobPosting JSON-LD inside @graph and drops n/a localities", () => {
    const ld = { "@context": "https://schema.org", "@graph": [{ "@type": "JobPosting", title: "Embedded Linux Software Engineer", datePosted: "2026-09-23", validThrough: "2026-10-23", hiringOrganization: { name: "Cross Source" }, jobLocation: { address: { addressLocality: "n/a", addressCountry: "Bulgaria" } }, description: "Linux &amp; C" }] }
    const job = parseDetail(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`, "https://www.jobtiger.bg/obiavi-za-rabota/x-328780-2")!
    expect(job).toMatchObject({ id: "328780", company: "Cross Source", location: "Bulgaria", deadline: "2026-10-23", description: "Linux & C" })
  })

  test("accepts JobTiger job URLs only", () => {
    expect(normalizeUrl("https://www.jobtiger.bg/obiavi-za-rabota/x-328780-2")).toBe("https://www.jobtiger.bg/obiavi-za-rabota/x-328780-2")
    expect(normalizeUrl("328780")).toBeNull()
    expect(normalizeUrl("https://www.jobtiger.bg.evil.io/obiavi-za-rabota/x-328780-2")).toBeNull()
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
    const out = parseJSON<SearchOutput>(await runCLI(["search", "-q", "developer", "--limit", "3"]))
    expect(out.results.length).toBeGreaterThan(0)
    for (const r of out.results) {
      expect(r.id).toBeTruthy()
      expect(r.title).toBeTruthy()
      expect(r.url).toMatch(/^https:\/\/www\.jobtiger\.bg\/obiavi-za-rabota\//)
    }
  })
})
