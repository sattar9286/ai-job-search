import { MARKETS, cleanUrl, htmlFetch, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  ref: string
  format: "json" | "plain"
}

const STEPSTONE_HOST = /(^|\.)stepstone\.(at|be)$/i

/**
 * Accept only a StepStone AT/BE job-ad URL. A bare numeric ID cannot be
 * resolved, because the ad URL also needs its title slug.
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim()
  let parsed: URL
  try {
    parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`)
  } catch {
    return null
  }
  if (!STEPSTONE_HOST.test(parsed.hostname)) return null
  if (!/--\d{5,}-inline\.html$/.test(parsed.pathname)) return null
  return cleanUrl(`https://${parsed.hostname}${parsed.pathname}`)
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const url = normalizeUrl(opts.ref)
  if (!url) {
    writeError(
      `"${opts.ref}" is not a StepStone job-ad URL (${Object.values(MARKETS).join(" or ")}/...--<id>-inline.html). Use the url field from search output.`,
      "BAD_ID",
    )
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
      writeError("Job page has no JobPosting data - the ad may be closed, or StepStone changed its markup", "PARSE_FAILED")
      return 1
    }
    if (opts.format === "plain") {
      const lines = [
        job.title ?? "(no title)",
        `${job.company || "—"} · ${job.location || "—"}`,
        "",
        job.date ? `Posted: ${job.date}` : "",
        job.deadline ? `Valid through: ${job.deadline}` : "",
        job.employmentType ? `Employment: ${job.employmentType}` : "",
        job.industry ? `Industry: ${job.industry}` : "",
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
