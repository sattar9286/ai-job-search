import { describe, expect, test } from "bun:test"
import { cleanText, filterJobs, normalizeDate, parseRss, type JobResult } from "../src/helpers.js"

describe("remote board normalization", () => {
  test("cleans HTML and common entities", () => {
    expect(cleanText("<p>Yocto &amp; Linux&nbsp;Engineer</p>")).toBe("Yocto & Linux Engineer")
  })
  test("parses RSS job fields without inventing missing dates", () => {
    const jobs = parseRss(`<rss><channel><item><title>Acme: Embedded Engineer</title><link>https://example.com/job/1</link><guid>job-1</guid><pubDate>Tue, 13 Oct 2026 10:00:00 GMT</pubDate><description><![CDATA[<p>Linux and C++</p>]]></description></item></channel></rss>`)
    expect(jobs).toHaveLength(1)
    expect(jobs[0].id).toBe("job-1")
    expect(jobs[0].date).toBe("2026-10-13")
    expect(jobs[0].description).toBe("Linux and C++")
  })
  test("filters keyword terms and old dated listings", () => {
    const jobs: JobResult[] = [
      { id: "1", title: "Embedded Linux Engineer", company: "Acme", location: "Remote", date: new Date().toISOString().slice(0,10), url: "https://example.com/1", description: "Yocto", source: "remoteok" },
      { id: "2", title: "Marketing Manager", company: "Acme", location: "Remote", date: null, url: "https://example.com/2", description: null, source: "remotive" },
    ]
    expect(filterJobs(jobs, "embedded linux", 14).map((j) => j.id)).toEqual(["1"])
  })
  test("returns null for unknown dates", () => {
    expect(normalizeDate("not-a-date")).toBeNull()
  })

  test("excludes unrelated job titles and keeps embedded engineering roles", () => {
    const base = (title: string, id: string): JobResult => ({
      id, title, company: "Example", location: "Remote", date: null,
      url: "https://example.com/" + id, description: "General responsibilities and teamwork",
      source: "remoteok",
    })
    expect(filterJobs([
      base("Marketing and Sales Administrator", "marketing"),
      base("Technical Account Manager", "tam"),
      base("Embedded Linux Engineer", "embedded"),
      { ...base("Build Engineer", "build"), description: "Yocto, BitBake, CMake and GitLab CI" },
    ], "", 0).map((job) => job.id)).toEqual(["embedded", "build"])
  })
})
