<!--
BURN CONTRACT TEMPLATE

What this is: the shape every unattended overnight job ("burn") copies. Every numbered/lettered
section below exists because a specific real run failed on exactly that point — this is not
boilerplate to thin out. If you strip a section, you are reintroducing the failure it closed.

How to use: replace every <...> placeholder. Keep the RULE TEXT of each section verbatim in your
own copy once you've filled it in — a refute pass (see LOOPS.md, "fold back") audits against these
rules directly, so if the rules drift from run to run, the refute pass has nothing stable to check
against.
-->

# STATUS: READY FOR EXECUTION

Prepared <date> by <who/what prepared this — a planner/verifier session, not the worker>.
**Today is <date>.** Runtime: <your code-writing worker>, <reasoning-effort tier>, <network access:
on/off, and which tools>. Launch from `<launch directory>` (the worker's sandbox roots here).

## Objective

<One paragraph. What question this burn answers, and the bar it is held to. Quote the requester's
own words where they exist — a paraphrase drifts across a multi-hour run in ways a verbatim quote
does not.>

## Consumer

*Required for any burn whose output feeds a decision or a piece of infrastructure. You may delete
this section only for a burn whose sole product is a literature summary with no downstream
consumer.*

- **What eats this output:** <a named file, session, decision, or system — never "future work">
- **What happens if the answer is "no":** <the concrete thing that changes, or is abandoned, if
  this burn returns a negative result. If nothing changes either way regardless of the answer,
  this burn should not be running unattended — it isn't actually decision-relevant.>

## Authority envelope

- **Read (explicit paths only — never "search everything"):**
  - <path 1>
  - <path 2>
  - <the web, if enabled — if so, mandatory verification that the tool actually fired this run,
    not just that it was configured on. Grep this run's own log for a literal marker string
    proving a real search happened, and quote one hit in the burn's own README output. If no such
    line can be found, say so plainly in the output rather than blocking completion on the grep.>
- **Write ONLY:** `<a single output directory unique to this burn>`
- **Prohibited:** any settings/config/hook change · any file edit outside the write target ·
  reading any path not explicitly listed above · installing anything.

## Closed rulings (verbatim, binding, non-negotiable)

*Injected into every contract you write, unchanged. A burn that breaches one of these is barred
from shipping regardless of how good its evidence looks — this has happened for real, and the
finding still didn't override the ruling.*

<This is where YOUR already-settled, non-negotiable decisions go — quoted verbatim, not
paraphrased, so the worker can't re-litigate something it wasn't present for the original
discussion of. Example shape:>

- **`<some prior architectural decision>` is CLOSED.** <what was decided, and what a burn may not
  propose instead, including euphemisms for the same idea.>
- **`<some fixed resource or budget constraint>` is a fixed constant, not a target to optimize.**
- **`<some fixed hardware/deployment ceiling>` — anything that does not fit inside it does not
  ship there.**

## Facts carried forward (do not re-derive)

<Bullets. Everything already settled that this burn would otherwise waste its budget
rediscovering. Cite the source for each. If you already know the answer, hand it over — don't make
the worker re-earn it.>

## Lanes

*Per-lane floors — independent per lane, never pooled together into one combined number.*

**Floors: at least `<N>` distinct sources and at least `<M>` primary sources PER LANE.** A lane that
cannot meet its floor **stops and states the shortfall explicitly** — it never pads with a
sibling lane's sources, and it never quietly lowers its own bar. An unmet lane stays `unknown`,
not padded to look complete.

**Preflight feasibility manifest (required before any lane runs):** as the burn's first real step,
list per lane a small number of plausible primary sources by name/identifier and the exact thing
each one is meant to cover. A lane whose manifest can't be filled is **narrowed or merged before
execution, and the narrowing is stated** — never launched at a floor its actual material can't
fill, because that mismatch is exactly what produces padding with adjacent-but-wrong sources. Save
this as its own file in the output directory. The floors above measure quantity; this manifest is
what makes the quantity mean coverage.

**Lane 1 — `<name>`.** `<scope + fences>`
**Lane 2 — `<name>`.** `<scope + fences>`
**Lane 3 — `<name>`.** `<scope + fences>`

## Source verification reads CONTENT, not status

*A prior run counted "200 OK" responses as verified sources; several were anti-bot interstitials
that were never actually read, and one silently backfilled a blocked page from a search snippet —
that became a miscited number downstream.*

- A source counts as READ only when you have its **readable content**. An HTTP success code is not
  evidence of content — an interstitial, a paywall, a cookie wall, and a CAPTCHA can all return a
  success code.
- The unit of verification is the readable **document instance**, not the first URL's status. A
  source whose primary page is blocked but whose authoritative mirror (an archive, a repository
  copy) is readable counts as READ — record both URLs and mark which instance was actually read.
  A claim with **no readable instance anywhere** is `UNSUPPORTED` — it may not be backfilled from a
  snippet, an abstract, a citation inside another source, or the model's own memory.
- Record, per source: the final URL after redirects, the response status, and a **verbatim quoted
  excerpt** that actually supports the specific claim it's cited for. No excerpt, no support.

## `SOURCES.tsv` + `CLAIMS.tsv` — the atomic claim-to-source join

*A generic source could previously float beside a more specific claim than it actually supported,
because nothing forced them to be joined at the claim level. This schema exists to close exactly
that gap.*

`SOURCES.tsv` — one row per fetched source (the fetch receipt):

```
source_id	lane	source_class	document_title	url	final_url_after_redirect	status	content_verified	checked_date
```

`CLAIMS.tsv` — **one row per claim-source pair** (the support receipt):

```
claim_id	artifact	exact_location	atomic_claim	source_id	source_location	excerpt	entailment	final_verdict
```

- `lane` and `source_class` are mandatory — without them the per-lane floors can't be verified from
  the burn's own receipts.
- `source_class` is one of `primary` / `secondary` / `tertiary` / `grey`. Primary means the actual
  study/dataset/spec, not a write-up describing it.
- `content_verified` is `YES` or `NO`. A `NO` source supports nothing, full stop.
- `entailment` is `FULL` / `PARTIAL` / `NONE` — does the excerpt, read on its own, actually entail
  the `atomic_claim` as written? **Every finding, recommendation, and ledger row must name a
  `claim_id` that joins to at least one `FULL` row.** A generic source may never license a more
  specific claim than its own excerpt states.
- `atomic_claim` is ONE claim — one number, one effect, one boundary. Split compound claims apart.
- **Absence conclusions do not join to a CLAIMS row** — no excerpt can prove a negative search
  result. An "I searched and found nothing" conclusion is a **search conclusion**: its receipt is
  the set of saturation rounds that came up empty (see below) — name them. The claims-join rule
  applies only to positive findings.
- Adjudication happens later, in a separate release-review step (see "fold back" in LOOPS.md) — the
  burn's own files are never edited after its hashes file is written.

## Every numeric constant names a producer

*A number with no traceable source was used as ranking evidence once, and a miscited range flattened
to a single point estimate reached a downstream decision it shouldn't have.*

- Every number in a finding, a recommendation, a threshold, or a default **names the artifact that
  produced it** — a cited source with an excerpt, or a script at a real path you can re-run.
- **"Typically," "commonly cited," and "approximately" are not producers.**
- A number with no producer is marked `pending` and **may not become a default, a threshold, or an
  input to ranking.**
- **Never flatten a range to a point estimate.** If the source says 18 to 254, the finding says
  18 to 254.

## Outcome extraction includes null, adverse, and between-group results

*A prior run reported an intervention as having "improved" an outcome while the same source's
own between-group comparison showed no significant effect.*

For every intervention or effect claim, extract and report the **null** results, the **adverse**
results, and the **between-group comparison** — not only the headline within-group finding. A null
result on one outcome never erases a distinct, valid result on a different outcome measured by the
same source — report both rather than picking whichever one looks better. State effect sizes and
confidence intervals where the source gives them.

## Saturation claims require reconstructible receipts

*"Two rounds with no new results" and nothing else is not reconstructible and does not count as
evidence of saturation.*

A saturation/convergence claim is valid only when the burn has saved, per round and per lane: the
**exact query used**, the **result set returned**, and the **net-new count** against prior rounds,
deduplicated on a stated key. Save these as `SATURATION.tsv`. A convergence round only counts if
its query is **materially different** from prior rounds (new terms, new source class, new
database) — two empty rounds from the same weak query repeated is not saturation. Set an explicit
attempt budget per lane (a max round count or a max time spent, whichever comes first) and a
whole-burn wall-clock ceiling. Precedence: spend the attempt budget, then check the floor — if
still unmet, state the shortfall and mark the lane `unknown`. A lane may not stop before its budget
is spent, and may not search past it either.

## Consulting another model mid-burn: quote-or-discard

If this burn consults a different model for a judgment call, that model **may not offer a
conclusion, threshold, or formula unless it also emits a verbatim quoted substring from the prompt
that necessitates it.** No quote, discard the recommendation without evaluating its logic.
*Measured: several consecutive consults without this rule each produced at least one fluent,
confident fabrication; adding the quote requirement dropped fabrications to zero on the next run.*

## Test candidate gaps, don't just report them

Any internal audit step in this burn that names a candidate gap must **actually test it, not just
report it** — if the evidence refutes the candidate, say so. A missing test-vs-report step has, on
its own, been the entire difference between a run's best finding and its worst miss.

## Phases

1. **Ground** — read the listed paths; write a short scope note separating what's already settled
   from what's genuinely open.
2. **External research** — the lanes above, run to their floors. Every claim carries a real URL and
   a verbatim excerpt.
3. **Map to your own situation** — each finding becomes one of: adopt / constraint / **blocked by a
   closed ruling** / already covered (with citation to where). The blocked-by-ruling bucket is
   required, not optional — a burn that finds nothing blocked by its own closed rulings either
   didn't look, or the rulings weren't actually loaded into its context.
4. `<burn-specific duty, if any>`
5. **Verify** — a second internal pass against every rule above. Report shortfalls; never pad over
   them.

**Long-run clauses (keep verbatim in your own copy):**
- **Floors clause:** "Freeze the input manifest and predefined lanes before execution. No
  saturation or convergence credit accrues until every declared lane meets its numeric diversity
  and receipt floor; unmet lanes remain `unknown` at the ceiling."
- **Release-review clause:** "The burn's final act is writing a hashes file — a checksum of every
  output file, excluding the hashes file itself and any later release-review document. After that,
  the burn's files are frozen — nothing, including the release review, edits them. The output is
  not releasable until a SEPARATE consuming session runs the three-state refute pass (see
  LOOPS.md) and writes the release review as an append-only sidecar: the hashes it reviewed, at
  least two independent claim-level adjudications of sampled `FULL` rows, the terminal status
  conversion of each ledger row, and a release verdict. A changed hash invalidates the review."
- **Receipt-lanes clause:** "The lanes and their feasibility manifest are the frozen inventory.
  Each lane must return producer-backed receipts (`SOURCES.tsv` + `CLAIMS.tsv` rows naming the
  lane) whose pass/fail is checkable from the schemas above; only reassign lanes that are missing
  or failed."

**Keep it minimal:** prefer the smallest structure that meets the floor — no speculative schema
fields, no lanes beyond those you declared, no framework where a plain table would work.

## Outputs

`<your output directory>/`:

- `README.md` — bottom line first, plus the tool-actually-fired evidence if network/search tools
  were enabled
- `FINDINGS.md` — claim + citation + verbatim excerpt + relevance to your situation, by lane; every
  finding names its `claim_id`
- `LEDGER.md` — born with the lifecycle table from
  [ledger-template.md](ledger-template.md): `id | finding | recommendation | claim_ids | status |
  proposed_terminal | closing artifact`
- `MANIFEST.md` — the preflight feasibility manifest
- `SOURCES.tsv` + `CLAIMS.tsv` — the schemas above, exactly
- `SATURATION.tsv` — the saturation receipts above
- `HASHES.txt` — checksum of every output file, written **last**
- A decision-tree or open-questions file, kept small (a handful to a dozen nodes, all `pending`)

**Ledger lifecycle:** every row is born and ends this burn as `status = proposed` — the burn never
self-assigns a terminal state, because it has no one to check its own work against. But **no row
may be merely "interesting"**: each carries a `proposed_terminal` of `scheduled`, `rejected`, or
`deferred + a named trigger for revisiting it`. The consuming session (the fold-back step) records
each row's actual terminal conversion in the release-review sidecar — the frozen `LEDGER.md` is
never itself edited. A row with no `proposed_terminal` is an unfinished burn, not a maybe.

## Completion criteria

*The completeness checker's only permitted PASS-equivalent verdict is something like
`STRUCTURALLY_COMPLETE` — it must never emit a release-sounding word like "PASS", because
structural completeness verifies that required things are PRESENT, which is not the same claim as
TRUE. Conflating the two produced false confidence more than once before this rule existed.*

- `MANIFEST.md` present; every executed lane has its feasibility manifest or a stated narrowing
- Per-lane floor met, or shortfall stated explicitly
- `SOURCES.tsv` + `CLAIMS.tsv` populated per the schema; every finding/recommendation/record joins
  to at least one `FULL` claims row; adjudicator columns left blank (that's the fold-back step's job)
- Every claim's source has a readable instance recorded with a verbatim excerpt
- Every numeric constant names a producer; no flattened ranges
- Null / adverse / between-group results reported wherever the source actually contains them
- `SATURATION.tsv` present with per-round queries, result sets, dedup key, net-new counts
- Zero breaches of the closed rulings above
- `## Consumer` present and answered, unless explicitly exempted
- `LEDGER.md` exists, every row `proposed`, every row carries a `proposed_terminal`
- `HASHES.txt` written last, covers every output file
- Zero writes outside the output directory

## Resume briefing

This file is the contract. If interrupted, re-read it in full and continue from the last completed
phase — do not replan, and do not widen scope.

---

## Transport validity — a real citation is not automatically a valid inference

*Installed after a night where several dossiers were externally reviewed and every failure was the
same shape: real, correctly-cited, peer-reviewed sources, transported across a boundary they don't
actually cross (a lab-task finding applied to field behavior; a study on one population applied to
a different one). Zero fabricated citations in that fleet — the citations were real. The failure
was entirely in the inference drawn from them.*

**A citation being real, correctly quoted, and peer-reviewed is not sufficient on its own.** For
every claim a finding or ledger row depends on, check and state:

| Axis | What the SOURCE actually measured | What THIS FINDING infers | Match / mismatch |
|---|---|---|---|
| **Population** | who/what was studied | who/what the inference is applied to | |
| **Modality / intervention class** | the exact thing manipulated | the thing the inference is applied to | |
| **Scale / timeframe** | the actual time scale measured | the time scale the inference is applied to | |
| **Outcome construct** | what was literally measured | what the inference claims | |

**A mismatch on any axis is a reportable finding, not a footnote.** Record it against the
`claim_id`, name the conclusion it limits, and either find a source that actually matches or mark
the inference `NOT-SUPPORTED-BY-TRANSPORT` and stop there. A claim can be true, correctly cited,
and still invalid for the specific inference drawn from it.

**A fifth axis — source quality.** State each source's venue/peer-review status. Flag predatory or
pay-to-publish venues, preprints treated as peer-reviewed, and anything you can't verify
(`COULD-NOT-VERIFY` is a fine, honest value here). Being funded by author-paid publication charges
is not by itself evidence of a predatory venue — judge the venue, not the funding model.

**Known limitation:** this check catches bad transport, not missing coverage. A body of literature
the burn never touched at all produces no claim, therefore no mismatch, therefore no finding. A
clean pass on this section is not evidence that a lane actually covered its field — that needs a
separate coverage check this template does not provide.
