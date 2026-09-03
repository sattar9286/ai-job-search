---
framework_version: 1.0.0
---

# Behavioral Profile

## How to read this file

This profile rests on **two IPIP-50 self-report administrations taken on 2026-08-29**, which
disagree substantially. **Per Abdul's instruction (2026-08-29), run 2 — the more recent set of
answers — is the operative reading wherever the two runs disagree.** Run 1 is retained below
for traceability, not for scoring.

One limit that recency cannot fix, stated plainly because it changes what this file can be used
for: **run 2's Emotional Stability items were all answered `3`**, the exact scale midpoint. That
is a non-differentiated response, so it carries no information in either direction — taking the
newer answer gives no answer at all for that domain. Emotional Stability / stress reactivity is
therefore **still unknown**, and this is the one place the file cannot be relied on. Everything
else below is now a usable reading.

This is a self-report instrument with no population norms applied, so treat the results as
directional bands rather than percentiles.

## Score Record

| Domain | Run 1 | **Run 2 (operative)** | Reading |
|--------|-------|-----------------------|---------|
| Agreeableness | 41 | **44** | High — both runs agree |
| Conscientiousness | 29 | **42** | High — industrious *and* orderly |
| Openness / Intellect | 36 | **41** | Moderately high — both runs agree |
| Extraversion | 24 | **35** | Balanced, slightly toward outgoing |
| Emotional Stability | 23 | **30** | **No reading** — run 2 non-differentiated |

Raw sums, range 10–50, midpoint 30.

Run 1 responses (item order 1–50), retained for traceability:
```
3,4,4,3,4,2,5,5,5,4,3,1,4,4,4,5,5,3,3,3,4,3,5,4,5,5,5,4,4,3,
2,3,1,5,2,4,5,3,5,5,3,4,2,5,5,5,4,4,3,3
```

Run 2 responses (item order 1–50) — **operative**:
```
5,3,4,3,5,2,5,2,3,3,4,1,4,3,4,4,4,2,3,2,4,3,5,3,4,2,5,2,3,2,
3,1,4,3,4,4,5,1,3,4,4,5,4,3,5,3,4,4,3,4
```

## Behavioral Reading (from run 2)

- **High Agreeableness (44).** The most stable result in the file — high in both runs.
  Interested in people, sympathetic, takes time for others. Corroborated externally by mentoring
  a junior pipeline engineer and grooming cross-functional teams on Scrum practice.
- **High Conscientiousness (42), both halves.** Industriousness is convergent across both runs:
  "always prepared", "pay attention to details", "get things done right away", "exacting in my
  work" all scored 4–5 twice. Run 2 additionally reads as **orderly** — likes order (4), follows
  a schedule (4), does not leave belongings around (2), does not forget to put things back (2).
  Practical consequence: **structured process, planning, and defined workflows are a fit, not a
  friction.** Corroborated by the JIRA workflow redesign and Scrum adoption work.
- **Moderately high Openness / Intellect (41).** Idea-rich and reflective; "spend time
  reflecting on things" scored 5 in both runs. Corroborated by formal architecture documentation
  and multi-approach trade-off analyses.
- **Balanced Extraversion (35).** Slightly above midpoint. Comfortable engaging and speaking up,
  without being a high-stimulation extravert. Reads as an ambivert: fine in collaborative and
  client-facing settings, not dependent on them for energy. Run 1 read as introverted; run 2
  supersedes it.
- **Emotional Stability — no reading.** See the limit noted above. Make no claim in either
  direction about stress reactivity, pressure tolerance, or mood variability.

## Strengths

- End-to-end ownership and follow-through
- Technical rigour and attention to detail — the strongest signal in the file
- Design documentation and written architectural reasoning
- Mentoring and collaborative, low-ego working style
- Comfort with structure, planning, and process (per run 2)

## Growth Areas

- **Conflict avoidance risk.** High Agreeableness across both runs is a genuine strength that
  carries a cost: a strong tendency to accommodate. **Watch for** conceding architectural
  positions too readily and under-negotiating compensation. **Positive framing:** collaborative
  and low-ego, with deliberate practice needed on holding a position under pressure.
- **Unknown: response to sustained pressure.** Not a finding, an absence. Worth Abdul's own
  judgement on a specific role rather than a guess from this file.

## Mapping to Job Posting Language

**Strong behavioural fit:**
- "own X end to end", "full ownership", "architecture", "greenfield"
- "documentation culture", "written communication"
- "mentorship", "growing junior engineers"
- "quality bar", "code review culture", "engineering rigour"
- "structured process", "planning", "Agile/Scrum ceremony", "process improvement" — supported by
  run 2's orderliness and by the XOPS process-engineering record
- "cross-functional collaboration", "stakeholder engagement" — balanced Extraversion supports
  this; it is no longer a friction signal

**Genuinely unknown — neither a fit signal nor a friction signal:**
- "fast-paced", "high-pressure", "thrives in chaos", "heavy on-call", "work under pressure"

These rest on Emotional Stability, which has no reading. Do not score them in either direction.
**Ask Abdul directly** about a specific posting instead.

## Management Style Preferences

- A technically credible manager who can engage with the substance of the work
- Direct feedback delivered privately — high Agreeableness makes public criticism land hard
- Recognition of thoroughness rather than raw speed
- Clear structure and defined expectations are a positive, not a constraint (per run 2)

## Using This in Applications

- **Cover letters:** lead with ownership, technical rigour, documentation, and mentoring. The
  greenfield BSP build and the ~95% build-time reduction remain the strongest evidence, and they
  rest on the CV, not on this file.
- **CV:** emphasise end-to-end ownership, architecture documentation, quality metrics, mentoring.
- **Interviews:** use the STAR bank in `07-interview-prep.md`.
- **Negotiation:** the one piece of advice both runs support. High Agreeableness is a measurable
  salary risk. Decide a number in advance and hold it.
- **Don't overstate:** anything about stress reactivity or pressure tolerance. That domain has
  no reading.

## Job Scraping and Ranking — Non-Blocking Rule

**This file must never cause a job to be excluded, vetoed, or dropped.** During `/scrape` and
`/rank`, behavioural fit is a *soft, informational* signal only:

- Behavioural fit is **never** a FAIL and never a shortlist veto. The only hard gates are the
  Eligibility Gate, the Language Gate, and the Location gate in `04-job-evaluation.md`.
- If behavioural evidence for a posting is thin, absent, or falls in the "genuinely unknown"
  band above, **score it neutral (70) and move on**. Do not guess, do not penalise, and do not
  stall the run.
- A missing, blank, or unreadable behavioural profile is **not an error**. Score behavioural fit
  neutral (70), note it in one line, and continue scraping and ranking normally.

## Improving This File

The most valuable upgrade is a **normed instrument you cannot self-score** — a vendor Hogan or
PI administered through an employer, or a normed IPIP-NEO-120. Percentile-scored against a
reference sample, it does not have the failure mode this file has. Failing that,
`/setup --section behavioral` offers a qualitative path: what specifically drains you, what
management has actually worked, how you prefer to communicate. Direct answers about real
situations would settle the Emotional Stability gap better than a third self-rating.

## Prior LinkedIn-Inferred Observations

Retained for traceability. Verdicts updated against the operative run-2 reading.

| Observation (from LinkedIn About) | Verdict |
|---|---|
| Drawn to hard technical problems | **Supported** — Openness and industriousness both convergent |
| Craft orientation: performance, scalability, maintainability | **Strongly supported** — exacting and detail-attentive in both runs |
| End-to-end ownership, design through deployment | **Supported** — industriousness convergent; corroborated by CV |
| Comfortable in distributed US/European fast-paced teams | **Partially supported** — balanced Extraversion supports the distributed-team half; the "fast-paced" half rests on Emotional Stability and has no reading |
| Growth-seeking | **Supported** — Openness convergent, two certifications in progress |
