import { BASE, htmlFetch, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  ref: string
  format: "json" | "plain"
}

/** Accept a numeric job ID or a reed.co.uk/jobs/<slug>/<id> URL. */
export function normalizeRef(input: string): string | null {
  const trimmed = input.trim()
  // Reed resolves any slug for a valid ID, so a bare ID needs no title.
  if (/^\d{6,}$/.test(trimmed)) return `${BASE}/jobs/job/${trimmed}`
  let parsed: URL
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
  if (!/^(www\.)?reed\.co\.uk$/i.test(parsed.hostname)) return null
  const m = parsed.pathname.match(/^\/jobs\/([^/]+)\/(\d{6,})\/?$/)
  return m ? `${BASE}/jobs/${m[1]}/${m[2]}` : null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const url = normalizeRef(opts.ref)
  if (!url) {
    writeError(`"${opts.ref}" is not a Reed job ID or ${BASE}/jobs/<slug>/<id> URL`, "BAD_ID")
    return 1
  }
  try {
    const html = await htmlFetch(url)
    if (!html) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = parseJobDetail(html, url)
    if (!job) {
      writeError("Job page has no job data - the ad may be removed, or Reed changed its markup", "PARSE_FAILED")
      return 1
    }
    if (opts.format === "plain") {
      const lines = [
        job.title ?? "(no title)",
        `${job.company || "—"} · ${job.location || "—"}${job.remote ? " · Remote" : ""}`,
        "",
        job.date ? `Posted: ${job.date}` : "",
        job.deadline ? `Expires: ${job.deadline}` : "",
        `Status: ${job.isLive ? "LIVE" : "NOT LIVE"}`,
        job.requiresUkWorkEligibility ? "Requires existing UK work eligibility" : "",
        job.eligibilityRequirement ? `Eligibility: ${job.eligibilityRequirement}` : "",
        job.contractType ? `Contract: ${job.contractType}` : "",
        job.salary ? `Salary: ${job.salary}` : "",
        job.isAgency ? "Posted by a recruitment agency" : "",
        "",
        job.description || "(no description)",
        "",
        `URL: ${job.url}`,
      ].filter((l, i, all) => l !== "" || all[i - 1] !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
