import { BASE, htmlFetch, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  ref: string
  format: "json" | "plain"
}

/**
 * Accept a wellfound.com/jobs/<id>-<slug> URL. A bare ID is refused because
 * /jobs/<id> without its slug returns 404.
 */
export function normalizeRef(input: string): string | null {
  const trimmed = input.trim()
  let parsed: URL
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
  if (!/^(www\.)?wellfound\.com$/i.test(parsed.hostname)) return null
  const m = parsed.pathname.match(/^\/jobs\/(\d+)(-[a-z0-9-]+)\/?$/i)
  return m ? `${BASE}/jobs/${m[1]}${m[2]}` : null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const url = normalizeRef(opts.ref)
  if (!url) {
    writeError(`"${opts.ref}" is not a ${BASE}/jobs/<id>-<slug> URL. Use the url field from search output.`, "BAD_ID")
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
      writeError("Job page has no JobPosting data - the listing may be closed, or Wellfound changed its markup", "PARSE_FAILED")
      return 1
    }
    if (opts.format === "plain") {
      const lines = [
        job.title ?? "(no title)",
        `${job.company || "—"} · ${job.remote ? "Remote" : "On-site"}${job.location ? ` · ${job.location}` : ""}`,
        job.applicantLocations.length ? `Applicants from: ${job.applicantLocations.join(", ")}` : "",
        "",
        job.date ? `Posted: ${job.date}` : "",
        job.deadline ? `Valid through: ${job.deadline}` : "",
        job.employmentType ? `Employment: ${job.employmentType}` : "",
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
