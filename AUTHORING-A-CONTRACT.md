# AUTHORING-A-CONTRACT.md — turning a rough idea into a runnable contract

[templates/burn-contract-template.md](templates/burn-contract-template.md) is the **form**. This is
the **process** of filling it in: what you decide, in what order, and which checks you run before
anything launches unattended.

**Read this honestly.** The template was extracted from a system that had been running for months.
This runbook was not — it is derived from what the twelve [mechanisms](MECHANISMS.md) and the
[failure record](FAILURES.md) imply a well-formed contract needs, cross-referenced against the
template's own section order. Where the real process is genuinely undocumented, this file says so
instead of inventing a plausible rule. Those places are marked **OPEN** and collected at the bottom.

A contract takes a while to write the first time and much less after that. The cost is real and it is
the point: an unattended run is only as good as the document it wakes up to, and every hour of
authoring buys back a multi-hour run you do not have to throw away.

---

## Step 0 — decide whether this should be a contract at all

Before you open the template, two screens.

**Is the work admissible?** Score it against your delegation test (mechanism
[#10](MECHANISMS.md#10-delegation-admissibility-is-scored-not-judged)) in writing. The question that
refuses the most work is **who eats the output** — if the honest answer is "it goes in the backlog,"
the measured completion rate on that class of item is roughly 2.5%, and writing a contract for it is
a way to feel productive rather than be productive. Stop here.

**Is the objective a question or a vibe?** A contract can only be held to a bar you can state. "Look
into X" is not a bar. "Does X hold under Y, and what would have to be true for it not to" is. If you
cannot write the bar, you are not ready to write the contract — that is what an interactive session
is for.

> **OPEN — undocumented.** How a given night gets chosen as an interactive **build day** versus an
> unattended **burn night** is not written down anywhere, including in the source material this repo
> was written from. It is currently a judgment call that lives in one person's head. This runbook
> assumes you have already decided you want an unattended run; it cannot tell you how to make that
> call, and it will not pretend to. See [PORTING.md](PORTING.md) for the same gap stated from the
> reader's side.

## Step 1 — Objective and Consumer

Fill `## Objective` and `## Consumer` **first**, and fill them from the requester's own words.

- **Quote verbatim** wherever the request exists in writing. The template says why: a paraphrase
  drifts across a multi-hour run in ways a quote does not. Your summary of what someone wanted is
  already one lossy hop away, and the run will make several more.
- `## Consumer` has two fields and the second one is the real gate: **what changes if the answer is
  no.** If nothing changes either way, the run is not decision-relevant and should not be running
  unattended. This is the same test as Step 0's named consumer, asked again now that you have written
  the objective — it is worth failing twice.

## Step 2 — the authority envelope

This is mechanism [#1](MECHANISMS.md#1-self-contained-contracts-with-an-authority-envelope) and it is
where the highest-consequence mistakes live.

1. **Write read paths as literal paths.** Never "search the workspace," never a glob that could
   expand into the whole tree. The worker's sandbox almost certainly does not restrict *reads* the way
   you assume — in the system this repo came from, reads were unrestricted and the boundary was
   entirely a convention enforced by scoping each job. Check your own runtime's actual read behavior
   rather than inheriting that assumption in either direction.
2. **Then open every listed path yourself and read it looking for leakage.** Not for correctness — for
   the answer. [F4](FAILURES.md#f4--the-blind-grader-was-handed-the-answer) is a grader that was blind
   in its prompt and sighted in its read-set, because a docstring in a permitted file stated the
   expected conclusion. Comments, test names, headers, and filenames all leak.
3. **Make the write target a single directory that does not exist yet.** A fresh directory turns a
   stray write into a visible error and doubles as your liveness signal in Step 8 — its creation is
   the first artifact proving the run really started
   ([F7](FAILURES.md#f7--an-entire-fleet-launch-dispatched-nothing-silently)).
4. **Fill the prohibited list explicitly** — config and hook changes, edits outside the write target,
   reading unlisted paths, installing anything. A prohibition you leave implicit is not a prohibition.

If web or search tooling is enabled, keep the template's clause requiring **proof the tool actually
fired this run** — a marker string in the run's own log, with one hit quoted in the output. And when
you check that log, dedupe: [F10](FAILURES.md#f10--a-web-search-evidence-count-was-inflated-roughly-4x-by-a-logging-bug)
is a marker double-print that inflated a search count roughly fourfold and made a quarter-done run
look healthy.

## Step 3 — Closed rulings, verbatim

`## Closed rulings` is where your already-settled decisions go, **quoted, not summarized**, so the
worker cannot re-open a discussion it was not present for. Include the euphemisms: a ruling that
"we are not adding a database" should also name the shapes that idea comes back wearing, or it comes
back wearing one.

Two things to get right:

- **These are injected into every contract unchanged.** They are not per-job. If you find yourself
  editing a closed ruling while writing a contract, you are making a decision that belongs in an
  interactive session, not in the document that is about to run unsupervised.
- **A breach bars shipping regardless of how good the finding looks.** The template notes this has
  happened for real and the finding still did not override the ruling. Write them knowing you will
  someday want to overrule them at 2am, and that the answer is no.

## Step 4 — Facts carried forward

Everything already settled that the run would otherwise burn budget rediscovering, with a source per
bullet. The discipline here is generosity: **if you already know it, hand it over.** Budget spent
re-deriving a fact you had is budget not spent on the actual question.

The test for this section: skim it and ask what the run will conclude if it *disbelieves* each
bullet. Anything load-bearing that you cannot cite is not a fact carried forward — it is an
assumption, and it belongs in the objective as something to check.

## Step 5 — Lanes, floors, and the preflight manifest

This is mechanism [#2](MECHANISMS.md#2-length-comes-from-floors-never-from-clocks) made concrete, and
[F1](FAILURES.md#f1--a-fully-rule-conformant-run-produced-almost-entirely-unsupported-output) is why
it exists: a run that broke no rule produced 14 records, 13 unsupported, because every rule governed
shape and none governed content.

1. **Split the work into independent lanes** and name each one's scope *and its fences* — what it
   covers and what it explicitly does not, so two lanes cannot quietly cover the same ground and
   report it twice.
2. **Set the floors per lane, never pooled.** Pick the minimum distinct sources and minimum primary
   sources each lane must produce. A pooled floor is satisfied by one strong lane carrying four empty
   ones, which is exactly the padding the floor was supposed to prevent.
3. **Keep the shortfall clause verbatim.** A lane that cannot meet its floor stops and states the
   shortfall, stays `unknown`, and never borrows from a sibling. Without that sentence, an unmet
   floor turns into invention rather than a reported gap.
4. **Require the preflight feasibility manifest as the run's first real step** — a few plausible
   primary sources named per lane, and the exact thing each is meant to cover. A lane whose manifest
   cannot be filled gets narrowed or merged **before** execution, with the narrowing stated. The
   floors measure quantity; the manifest is what makes quantity mean coverage.

The last one is the step most likely to get skipped and the one that most reliably saves a night. A
floor a lane's real material cannot fill does not produce depth — it produces adjacent-but-wrong
sources, confidently cited.

## Step 6 — keep the rule text; fill only the placeholders

The middle of the template — content verification, the `SOURCES.tsv`/`CLAIMS.tsv` join, numeric
producers, null and adverse outcomes, saturation receipts, quote-or-discard, test-the-gap — is
**rule text, not boilerplate to thin out.** Each block closed a specific real failure. Keep it
verbatim in your copy and fill only the `<...>` placeholders.

The reason is mechanical, not sentimental: the fold-back review in Step 9 audits against these rules
directly. If the rule text drifts between runs, the review has no stable thing to check, and every
run becomes its own bespoke standard.

Two adjustments are legitimate:

- **Delete a section only by deciding to reintroduce its failure**, consciously, in writing. The
  template's own header says stripping a section reintroduces what it closed. That can be the right
  call for a job whose shape genuinely does not touch it — say so in the contract rather than
  silently dropping it.
- **Prefer the smallest structure that meets the floor.** No speculative schema fields, no lanes you
  did not declare, no framework where a plain table works.

**Placeholder hazard, worth one paragraph.** The template's `<angle-bracket>` placeholders are safe
for a document a human fills in and unsafe the moment a script consumes one:
[F11](FAILURES.md#f11--a-secret-scrubbing-convention-leaked-a-live-credential) is a redaction
convention that leaked a live credential because a shell downstream read the angle bracket as a
redirect. If any part of your pipeline pipes contract text through a shell, switch your own
placeholder convention to a form with no meaning to any parser — and re-run your scrub check against
the **live tree** after changing it, not just against the file you edited.

## Step 7 — Phases, Outputs, and Completion criteria

Fill these three as one unit — they are the same statement at three altitudes, and they are where
the run's done-when actually lives (mechanism
[#11](MECHANISMS.md#11-the-8-step-job-prompt-skeleton)).

- **Phases** are ordered and each ends in an artifact. Keep the template's mapping phase, including
  its **blocked-by-a-closed-ruling** bucket: a run that finds nothing blocked by its own rulings
  either did not look, or the rulings never made it into context. That bucket is a check on your
  Step 3, and it is required rather than optional.
- **Outputs** name **exact paths and exact field names**, never "a report on X." The hashes file is
  written **last** and covers everything else — it is what freezes the run for review.
- **The ledger is born `proposed` and ends `proposed`.** The run never self-assigns a terminal state;
  it has nobody to check its own work against. But every row carries a `proposed_terminal` —
  `scheduled`, `rejected`, or `deferred` with a named trigger. A row with no proposed terminal is an
  unfinished run, not a maybe (mechanism [#8](MECHANISMS.md#8-the-ledger-is-the-output)).
- **Completion criteria are mechanical and checkable from the files alone.** Every line should be
  something a script can answer yes or no about without reading prose. And keep the template's ban on
  release-sounding vocabulary: the strongest verdict a structural check may emit is
  `STRUCTURALLY_COMPLETE`, because *present* and *true* are different claims and conflating them
  manufactured false confidence more than once (mechanism
  [#3](MECHANISMS.md#3-disk-is-the-only-truth)).

## Step 8 — the satisfiability pass

**This is the step that exists because of a specific fabrication, and it is the one to run last and
never skip.**

Read every clause in your finished contract and ask: **can the worker satisfy this alone, with what I
have given it?** Anything that requires a human who will be asleep, a file outside the read list, a
tool it does not have, or an approval nobody can grant at 3am is not a strict requirement. It is a
fabrication prompt. [F3](FAILURES.md#f3--a-run-fabricated-a-human-sign-off) is exactly this: a
contract demanded an evidence artifact that was structurally impossible to produce honestly, and the
run invented a human sign-off rather than report that its done-when was unreachable.

Then confirm the escape hatch is present: **explicit permission to report a null, negative, or
blocked result.** A run with no legitimate way to say "I could not" will find an illegitimate one.

## Step 9 — pre-launch mechanical checks

None of these are judgment calls. Run them every time.

1. **Rule-block assertion.** Check every required block is present **and appears exactly once**. A
   duplicate is evidence of a bad merge, not of extra safety. This is
   [F2](FAILURES.md#f2--9-of-11-contracts-silently-ran-on-a-stale-template-version) — 9 of 11
   contracts in one launch were silently running an older revision of the template, and every one of
   them looked fine.
2. **Negative control on the checker itself.** Run your completeness checker against a deliberately
   blank contract and watch it trip its missing-fields alarm. A check never seen to fail is an
   assumption wearing a script (mechanism
   [#4](MECHANISMS.md#4-every-instrument-needs-a-proven-negative-control)).
3. **Placeholder sweep.** Grep the finished contract for any remaining `<...>`. An unfilled
   placeholder is not a gap the run will flag — it is a literal string it may well try to satisfy.
4. **Budget receipt, same turn as launch.** Read remaining budget live from the provider immediately
   before dispatch and refuse below your floor with a distinct exit code. A figure you checked five
   minutes ago is a different figure (mechanism
   [#5](MECHANISMS.md#5-budget-receipts-are-same-turn-and-read-from-the-provider)).
5. **Environment sweep.** Confirm nothing in the terminal or OS can pause a run you are not watching.
   [F8](FAILURES.md#f8--a-terminal-accessibility-setting-killed-7-overnight-runs-in-one-night) is a
   default-on console setting that suspended 7 unattended runs in one night on a stray click — each
   alive, responsive, and producing nothing.

## Step 10 — launch, watch, and hand off to fold-back

Once it is running, the contract is finished and your job changes shape.

- **Watch liveness on a signal your probe cannot destroy** — byte growth over an interval, the freshly
  created output directory, a marker you planted at dispatch. Not modification time, not a
  process-exists check (mechanism
  [#6](MECHANISMS.md#6-liveness-is-read-from-a-signal-your-own-probe-cannot-destroy)).
- **Do not widen scope mid-run, and do not re-plan.** If you must widen, widen a **floor** — never
  add an objective to a document the run has already grounded itself in.
- **Review cold, in a fresh session, the next morning.** Not the context that spent the night on it.
  Three-state verdicts, append-only sidecar, frozen hashes, and a surviving refuted finding halts for
  a human (mechanism
  [#9](MECHANISMS.md#9-fold-back-review-is-a-separate-fresh-session-the-next-morning)).

---

## What is OPEN in this runbook

Stated plainly, because an honest gap is worth more than a confident invention:

1. **Build day vs. burn night.** How a session decides which loop tonight is has never been written
   down. Step 0 assumes the decision is already made.
2. **How many lanes, and what a floor should actually be.** The template requires you to pick numbers
   (`<N>` distinct sources, `<M>` primary). Nothing documents how those numbers were originally
   chosen, so this runbook cannot give you a formula. What it can tell you: set them per lane, set
   them before execution, and let the preflight manifest in Step 5 — not your intuition — tell you
   whether the number you picked is fillable.
3. **The authoring-to-launch interval.** No measured figure exists for how long writing a contract
   takes or should take, so any number here would be invented. What is measured is the constraint it
   sits inside: **contract supply is the binding limit** on how much unattended work gets done — not
   compute, not quota (see [LOOPS.md § Cost and scale, measured](LOOPS.md#cost-and-scale-measured)).
   A system that can run all night with nothing well-specified queued is idle no matter how much
   budget it has.

If you build a real answer to any of these for your own setup, that is new ground, not something you
missed in this repo.
