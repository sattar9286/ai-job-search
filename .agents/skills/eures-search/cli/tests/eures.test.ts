import { describe, expect, test } from "bun:test"
import { runCLI, parseJSON } from "./helpers.js"
import { buildSearchBody, normalizeId, parseDetail, parseSearch, publicationPeriod, type JobCard } from "../src/eures.js"

interface SearchOutput {
  meta: { count: number; page: number }
  results: JobCard[]
}

describe("parsing", () => {
  test("maps job age onto EURES publication periods", () => {
    expect(publicationPeriod(1)).toBe("LAST_DAY")
    expect(publicationPeriod(3)).toBe("LAST_THREE_DAYS")
    expect(publicationPeriod(14)).toBe("LAST_MONTH")
    expect(publicationPeriod(60)).toBeNull()
  })

  test("builds the search body with countries and the EURES flag", () => {
    const body = JSON.parse(buildSearchBody({ query: "yocto", countries: ["DE", "nl"], jobage: 7, euresOnly: true, page: 2, perPage: 10 }))
    expect(body).toMatchObject({ page: 2, resultsPerPage: 10, publicationPeriod: "LAST_WEEK", locationCodes: ["de", "nl"], euresFlagCodes: ["WITH"] })
    expect(body.keywords).toEqual([{ keyword: "yocto", specificSearchCode: "EVERYWHERE" }])
  })

  test("parses search results", () => {
    const json = JSON.stringify({
      numberRecords: 2,
      jvs: [
        { id: "NjMzMjYxMSAxMjE", title: "Baseband Developer", creationDate: 1791840524897, locationMap: { SE: ["SE110"] }, employer: { name: "Ericsson AB" }, availableLanguages: ["en"], euresFlag: true, description: "<p>Linux &amp; C++</p>" },
        { id: null, title: "broken" },
      ],
    })
    const parsed = parseSearch(json)!
    expect(parsed.total).toBe(2)
    expect(parsed.items).toHaveLength(1)
    expect(parsed.items[0]).toMatchObject({ company: "Ericsson AB", countries: ["SE"], languages: ["en"], euresFlag: true, date: "2026-10-12", snippet: "Linux & C++" })
    expect(parsed.items[0].url).toBe("https://europa.eu/eures/portal/jv-se/jv-details/NjMzMjYxMSAxMjE?lang=en")
  })

  test("returns null for an unrecognised response", () => {
    expect(parseSearch("<html>")).toBeNull()
    expect(parseSearch(JSON.stringify({ foo: 1 }))).toBeNull()
  })

  test("parses a vacancy, preferring the English profile", () => {
    const json = JSON.stringify({
      id: "abc12345",
      preferredLanguage: "de",
      creationDate: 1791840524897,
      jvProfiles: {
        de: { title: "Entwickler", locations: [] },
        en: { title: "Developer", euresFlag: true, employer: { name: "Acme" }, locations: [{ cityName: "Heidelberg", countryCode: "de" }], positionLanguages: [{ languageCode: "de", cefrLevel: "B2" }], description: "<p>Yocto</p>", applicationInstructions: ["Apply online"] },
      },
    })
    const job = parseDetail(json)!
    expect(job).toMatchObject({ title: "Developer", company: "Acme", location: "Heidelberg, DE", countries: ["DE"], euresFlag: true, requiredLanguages: ["de B2"], adLanguages: ["de", "en"], description: "Yocto" })
  })

  test("accepts vacancy IDs and portal URLs only", () => {
    expect(normalizeId("NjMzMjYxMSAxMjE")).toBe("NjMzMjYxMSAxMjE")
    expect(normalizeId("https://europa.eu/eures/portal/jv-se/jv-details/NjMzMjYxMSAxMjE?lang=en")).toBe("NjMzMjYxMSAxMjE")
    expect(normalizeId("https://evil.example/eures/portal/jv-se/jv-details/NjMzMjYxMSAxMjE")).toBeNull()
  })
})

describe("cli contract", () => {
  test("unknown flag exits 1 with JSON error on stderr", async () => {
    const r = await runCLI(["search", "-q", "devops", "--bogus", "x"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("UNKNOWN_FLAG")
  })

  test("bad country code exits 1", async () => {
    const r = await runCLI(["search", "-q", "devops", "-c", "germany"])
    expect(r.exitCode).toBe(1)
    expect(JSON.parse(r.stderr).code).toBe("BAD_ARG")
  })
})

describe("live smoke test", () => {
  test("search returns real vacancies", async () => {
    const out = parseJSON<SearchOutput>(await runCLI(["search", "-q", "devops", "--limit", "3"]))
    expect(out.results.length).toBeGreaterThan(0)
    for (const r of out.results) {
      expect(r.id).toBeTruthy()
      expect(r.title).toBeTruthy()
      expect(r.url).toMatch(/^https:\/\/europa\.eu\/eures\/portal\/jv-se\/jv-details\//)
    }
  })
})
