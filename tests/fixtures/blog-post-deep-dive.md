# Published Article — Technical Deep-Dive (Milestone Evidence)

Title: "Inside the Architecture: How the Grant Pipeline Actually Works"
Published URL: https://blog.example.org/grant-post-1
Published at: project blog, technical series
Word count: 2,148 words (counted on the published text)
Publication date: 2026-10-12

## Article structure

1. Introduction — why grant payouts need verification (210 words).
2. System architecture — escrow, milestones, and the review flow, with
   two diagrams (560 words).
3. Benchmarks — measured latency and throughput of the review pipeline
   across three configurations, with result tables (640 words).
4. Failure modes — what happens on disagreement, timeouts, and bad
   evidence (380 words).
5. Roadmap — the next two quarters of planned work (358 words).

## Excerpt (verbatim, from the published article)

"Every grant program eventually hits the same argument: the builder says
the work is done, the funder is not sure, and the money sits still. This
post walks through the architecture we shipped to end that argument —
how a milestone is specified, how evidence is checked against the spec,
and what the numbers look like when the pipeline runs under load.

The pipeline has three moving parts. First, the escrow: the full grant
budget is locked when the grant is created, split across milestones with
fixed amounts, so nobody can renegotiate mid-flight. Second, the
evidence: for each milestone the builder submits deliverables against a
written spec — not a vibe, a spec — and the submission is frozen at
submit time. Third, the review: independent validators read the same
evidence against the same spec and must agree before anything moves.

Our benchmarks section measures that review step. Across three
configurations the median review completed in under four minutes, and
— the number that actually matters — verdicts were stable: the same
evidence against the same spec produced the same verdict in 98.6% of
repeated runs. Where validators disagreed, the cases were genuinely
ambiguous evidence: a deliverable mentioned but not shown, a link that
did not resolve, a claim broader than its proof. That is the system
working as designed. A verifier that never disagrees is not verifying
anything; it is rubber-stamping.

The roadmap closes the post: broader artifact types next quarter, and
multi-reviewer panels for large tranches the quarter after."

## Excerpt (verbatim, closing section — Roadmap)

"Next quarter we widen what counts as evidence: signed build artifacts,
repository snapshots, and rendered documents join plain links, each
fetched and hashed at review time so the verdict names the exact bytes
it rested on. The quarter after, large tranches get multi-reviewer
panels — three independent verdicts, agreement required — because the
bigger the payout, the more eyes it deserves. The goal never changes:
when the money moves, everyone can point at the same evidence and the
same spec, and the argument is already over."

## Coverage against the milestone

- Topic: the project (architecture, benchmarks, roadmap) — yes.
- Length: 2,148 words, above the 2,000-word requirement — yes.
- Published at a public URL on the project blog — yes.
