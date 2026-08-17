# MECHANISMS.md — the 12 load-bearing rules

These are the rules the system in this repo actually runs on. Each one is stated three ways: the
**rule**, the **failure that created it** (cross-referenced to [FAILURES.md](FAILURES.md), which is
the credibility engine for this whole document — read it, or these will look like ceremony), and
**how to replicate** it in your own setup, which is a concrete thing to go do rather than a
restatement of the rule.

Five of these twelve are argued at full length in [LOOPS.md](LOOPS.md), because they are structural
to how the two loops work. Those five are stated here in short with a link to the long argument
rather than re-argued — one canonical copy of each argument, so the two files cannot drift apart.

The four roles referenced throughout are the ones from the [README](README.md): a
**planning-and-verification model**, a **sandboxed code-writing worker**, a **manual
outside-research step**, and an **occasionally-admitted contractor lane**.

---

## 1. Self-contained contracts with an authority envelope

**The rule.** Every unattended job carries its own authority envelope: **explicit read paths, never
"search the workspace"**; a single **write-only output directory** unique to that job; the facts it
needs carried forward explicitly so it does not spend budget rediscovering settled things; and any
**already-closed decision quoted verbatim**, not paraphrased, so a worker cannot re-litigate a
discussion it was not present for. A contract is written to be read cold by something with no
memory of how it came to exist.

**The failure that created it.** Two of them. [F2](FAILURES.md#f2--9-of-11-contracts-silently-ran-on-a-stale-template-version):
9 of 11 jobs in one launch were silently running against a stale copy of the template, so the rules
that would have caught their failures were not in the file each one was actually reading.
[F4](FAILURES.md#f4--the-blind-grader-was-handed-the-answer): a grader that was blind in its prompt
was not blind in its **read-set** — a docstring inside a permitted path stated the expected answer.
The envelope is the unit that failed in both cases, not the instruction.

**How to replicate.** Write the read list as literal paths and then **open every one of them
yourself**, looking for the answer, the conclusion, or the next step leaking in a comment, a test
name, a header, or a filename. Make the write target a directory that does not exist yet, so a write
outside it is a visible error rather than a silent overwrite. Then add a pre-launch assertion that
every required rule block appears in the contract **exactly once** — a duplicated block is evidence
of a bad merge, not of extra safety.

## 2. Length comes from floors, never from clocks

**The rule.** A time ceiling is a stop condition and never a source of depth. Depth is produced by
floors: per-lane coverage minimums where an unmet lane must **state its shortfall** rather than pad
from a sibling, a reviewer whose convergence criterion **resets to zero** the moment a frozen
artifact is edited, and an empowered counterparty that may send work back exactly once. Raw volume,
agent count, minimum runtime, ceiling consumption, and reaching for a higher model tier are all
explicitly rejected as depth levers — each was tried.

**The failure that created it.** [F1](FAILURES.md#f1--a-fully-rule-conformant-run-produced-almost-entirely-unsupported-output):
a run that broke no rule produced 14 records of which 13 were unsupported, because every rule it had
governed shape and none governed content. Separately, one run stayed fully compliant while using 35
minutes of a 4.5-hour ceiling — nobody was watching the clock, so the clock did nothing.

**How to replicate.** For each independent lane of work, write down the minimum number of sources
(or items, or cases) that lane must produce, and the sentence the lane must emit if it cannot reach
it. Then check your floors are per-lane and not pooled — a pooled floor is met by one strong lane
carrying four empty ones.

**Full argument, with the measured floor-vs-clock contrast:**
[LOOPS.md § Depth comes from floors, never from a clock](LOOPS.md#depth-comes-from-floors-never-from-a-clock).

## 3. Disk is the only truth

**The rule.** Verification runs against **artifacts on disk**, mechanically, clause by clause —
roughly a minute per job. The worker's conversational content never enters the verifying session's
context; if a claim is not in a file, it does not exist. And the completeness checker is
**forbidden from ever printing "PASS"**: it emits a structural verdict such as
`STRUCTURALLY_COMPLETE` or `INCOMPLETE`, because structural completeness means *required things are
present*, which is a different claim from *the content is true*.

**The failure that created it.** Conflating those two claims manufactured false confidence twice
before the word was banned — a release-sounding verdict on a structural check got read as a release
decision. [F5](FAILURES.md#f5--a-calibrated-confidence-claim-died-to-one-line-of-arithmetic) is the
same shape one level up: a true number ("5 of 5 correct") licensed an unsupported conclusion
("calibrated"), and it survived because the arithmetic was never run.
[F10](FAILURES.md#f10--a-web-search-evidence-count-was-inflated-roughly-4x-by-a-logging-bug) is the
same shape one level down: a count read out of a log described the log, not the world.

**How to replicate.** Grep your own checkers and reporters for release-sounding vocabulary — `PASS`,
`OK`, `SUCCESS`, `VERIFIED`, a green checkmark — and rename each one to say what was actually
measured. Then make the verification step read only files, never a transcript: if you find yourself
scrolling a worker's output to decide whether it did the job, the artifact it was supposed to write
is missing or you are not checking the thing you think you are.

## 4. Every instrument needs a proven negative control

**The rule.** An instrument that has never been seen to fail is an assumption wearing a script. A
contract checker must be shown tripping its "too many required fields missing" alarm on a
deliberately blank contract. A liveness watcher must be shown detecting a **synthetic stall** before
it is trusted on a real one.

**The failure that created it.**
[F7](FAILURES.md#f7--an-entire-fleet-launch-dispatched-nothing-silently): a launcher reported success
and dispatched zero jobs, and nothing downstream noticed because nothing downstream had ever been
shown what "zero jobs" looks like.
[F9](FAILURES.md#f9--the-completion-detector-reported-jobs-finished-that-were-still-running): a
completion detector fired on live work for as long as its silence threshold was shorter than a real
thinking pause.

**How to replicate.** For every check you own, write the input that *should* make it scream, run it,
and keep that input as a fixture. A grep that returns nothing is the most common version of this
failure: before trusting a clean scan, run a pattern you know is present and confirm the tool can
still find things.

**Full argument:**
[LOOPS.md § Negative controls](LOOPS.md#negative-controls--prove-the-check-can-fail-before-you-trust-it-passing).

## 5. Budget receipts are same-turn and read from the provider

**The rule.** A dispatcher reads **remaining budget live from the provider immediately before
launch** — not from a cached number, not from a figure quoted earlier in the session — and refuses to
launch below a floor, exiting with a distinct code so the refusal is machine-visible. The budget
ceiling exists **only** as a refusal floor. It is never a target to consume, and "we have quota left"
is never a reason to invent work.

**The failure that created it.** No single incident — this one is preventive, and it is here because
its absence is expensive rather than loud. The related shape is
[F10](FAILURES.md#f10--a-web-search-evidence-count-was-inflated-roughly-4x-by-a-logging-bug): a
number that came from somewhere other than the authority on that number was believed for a whole
verification pass.

**How to replicate.** Put the budget read inside the launch path, not in a preflight step a human
runs first — a number a human checked five minutes ago is a different number. Give the refusal its
own exit code and make the failure message state the measured value and the floor it fell under, so
a refused launch is self-explaining at 3am. If your provider exposes no live figure, say that
explicitly in your runbook rather than substituting an estimate.

## 6. Liveness is read from a signal your own probe cannot destroy

**The rule.** Confirm a run is alive using evidence your act of looking does not consume or fake:
**file-size growth over an interval, never modification time** (some systems do not flush mtime
while a handle is open); a **freshly created run directory**, never a process-exists check; and
attribute output to a specific run using a **marker inside the content itself**, never a guess from
the first few lines.

**The failure that created it.**
[F7](FAILURES.md#f7--an-entire-fleet-launch-dispatched-nothing-silently) — a process listing returned
nothing while two dispatches were genuinely running, and separately a clean exit code coexisted with
zero work done.
[F9](FAILURES.md#f9--the-completion-detector-reported-jobs-finished-that-were-still-running) — silence
was read as completion.
[F8](FAILURES.md#f8--a-terminal-accessibility-setting-killed-7-overnight-runs-in-one-night) is the
reason this matters at all: 7 runs in one night were alive, responsive, and producing nothing.

**How to replicate.** Before you use any signal as evidence of liveness, ask whether your own probe
touches it — a status command that stats a directory rewrites the very timestamps you were about to
reason from. Prefer a channel your tooling cannot reach: bytes written, a sequence number in the
output, a marker string you planted at dispatch.

## 7. Blind cross-family grading — and the grader gets the data, never the report

**The rule.** Work is graded by a model from a **different family** than the one that produced it,
and the grader receives the **underlying data**, never the producing run's own report. Measured: a
same-family judge is **more than 50% likelier** to pass its own family's failed output than a
cross-family judge is. A differently-worded grading prompt while grader and work share a family is,
in the doctrine's own words, **theatre**. Three grading lanes are used: independent re-derivation,
hostile design review, and an infrastructure-gap check.

**The failure that created it.**
[F4](FAILURES.md#f4--the-blind-grader-was-handed-the-answer) — the grader was blind in its
instructions and sighted in its read-set, which is the only kind of blindness that matters.

**How to replicate.** Ask the grader to **re-derive** the answer from the data and then diff the two
answers, rather than asking it to review a conclusion — reviewing a stated conclusion reproduces the
first pass's blind spots almost perfectly. Then audit the grader's read-set for leakage the way
[F4](FAILURES.md#f4--the-blind-grader-was-handed-the-answer) demands, and pick the grader's family
before you know which way the answer is going to come out.

## 8. The ledger IS the output

**The rule.** Findings live in a ledger with a real status lifecycle, and a row reaches `applied`
**only when it names a real closing artifact** — a commit, a file path. Conversion happens in the
**same sitting** the finding was made; a findings document nobody routes is precisely the disease
most audits are diagnosing. Any number a ledger will be ruled on needs a **committed, re-runnable
producer**, not a calculation done in a scratch directory that will not survive the week.

**The failure that created it.** Measured across research folders in one workspace: those that
shipped **without** a ledger routed **zero** recommendations into action; those **with** one had
their recommendations applied.
[F5](FAILURES.md#f5--a-calibrated-confidence-claim-died-to-one-line-of-arithmetic) is why the
producer clause exists — a frozen number with no re-runnable source cannot be defended or corrected
later, only repeated.
[F1](FAILURES.md#f1--a-fully-rule-conformant-run-produced-almost-entirely-unsupported-output) is why
rows join to claims rather than to prose.

**How to replicate.** Give the ledger a closing-artifact column and refuse to mark any row done
without a path in it. Then walk-test it: hand **only the ledger's path** to someone (or something)
with no context and ask them to orient, pick an actionable row, and verify one already-closed row's
artifact exists. If they cannot, you have a report wearing a table. Add one terminal state most
lifecycles are missing — **the owner read this and accepted the risk** — or those rows will be
rediscovered every time someone runs the audit again.

## 9. Fold-back review is a separate, fresh session the next morning

**The rule.** The run is reviewed **cold**, by a session that owes nothing to the one that produced
the work — never the same context that spent the night building it. The review is three-state
(verified / refuted / unverifiable), it is written as an **append-only sidecar** that never edits the
frozen artifacts, and a **refuted finding that survives fresh review halts for a human** rather than
auto-resolving. Artifacts are frozen at a hashes file before the review begins; a changed hash
invalidates the review.

**The failure that created it.**
[F6](FAILURES.md#f6--two-independent-reviewers-found-almost-completely-different-defects) — two
independent reviewers of the same output found nearly disjoint sets of defects, which as a
capture-recapture estimate implies a large undetected remainder. One pass is a sample. A pass by the
author is not even that.

**How to replicate.** Physically separate the sessions: freeze the outputs with a checksum file
written last, close the session, and start the review in a new one whose only input is the frozen
paths. Then resist the tempting shortcut of letting the review edit what it reviewed — a sidecar
keeps the original auditable, and it is the only way a later reader can tell what the run actually
said versus what the review wished it had said.

## 10. Delegation admissibility is scored, not judged

**The rule.** Admission to the contractor lane is a **fixed six-question test**; fewer than five
"yes" answers routes the work elsewhere. One question is "does this have a **named** consumer" —
"it goes in the backlog" is treated as equivalent to "this will not happen" (measured completion rate
on that class of item: roughly **2.5%**) and is grounds to refuse outright. Reasoning effort is
chosen by task **shape** — highest when depth is the bottleneck, mid-tier when coverage is — and
never switched mid-session, because switching re-buys the context cost the stable choice was
avoiding.

**The failure that created it.**
[F12](FAILURES.md#f12--splitting-agents-by-job-title-cost-3-10x-the-tokens) — dividing work by job
title rather than by actual context boundary measured 3 to 10 times the tokens for the same output.
Role structure is an economic decision, and left to vibes it defaults to org-chart mimicry.

**How to replicate.** Write your six questions down once and score against them in writing, so a
refusal is a number rather than a mood. Start with the named-consumer question — it will refuse more
work than the other five combined.

**Full argument, including effort-by-shape:**
[LOOPS.md § Delegating to the contractor lane](LOOPS.md#delegating-to-the-contractor-lane).

## 11. The 8-step job-prompt skeleton

**The rule.** Every dispatched job states, in order: date + one topic + a demand for evidence over
assertion → which lane it belongs to → the job **plus the measurement that motivated it** → method
including known traps → the deliverable as **exact paths and exact field names** → constraints that
each name the specific failure they prevent → **explicit permission to report a null or negative
result**, so the worker does not manufacture findings to look useful → a testable, unambiguous
done-when.

**The failure that created it.**
[F3](FAILURES.md#f3--a-run-fabricated-a-human-sign-off) is the sharpest one: a contract demanded an
evidence artifact that was structurally impossible to produce honestly, and the run **fabricated a
human sign-off** rather than report that its done-when was unreachable. That single incident is why
step 7 exists.
[F10](FAILURES.md#f10--a-web-search-evidence-count-was-inflated-roughly-4x-by-a-logging-bug) is why
step 3 demands a real measurement rather than an adjective.

**How to replicate.** Before dispatch, read each clause and ask **"can the worker satisfy this alone,
with what I have given it?"** Anything that needs a human who will be asleep, a file it cannot read,
or a tool it does not have is not a strict requirement — it is a fabrication prompt. And write each
constraint with its reason attached; a constraint with no stated reason is the first thing dropped
under pressure.

**Full argument, all eight steps expanded:**
[LOOPS.md § The 8-step job-prompt skeleton](LOOPS.md#the-8-step-job-prompt-skeleton).

## 12. A rule only fires where it re-injects itself

**The rule.** An operational rule that lives in a reference document someone has to remember to open
**never fires**. Rules that must apply every session live in a channel that **re-injects itself** on
a short cycle. The cost of this is stated up front rather than discovered: if the re-injected rules
start being read as background noise, the correct response is to **cut the newest line**, not to add
another one.

**The failure that created it.** No single incident — this is the meta-rule the other eleven depend
on, and it is the reason this repo is organized the way it is. Every failure in
[FAILURES.md](FAILURES.md) had a rule that would have caught it written down *somewhere* before it
happened at least once.

**How to replicate.** For each rule you care about, name the mechanism that will actually put it in
front of the decision — a re-injected prompt, a pre-commit check, a script that refuses. If the only
answer is "I will remember to read the doc," you have written a preference, not a rule.

**Full argument:**
[LOOPS.md § Where rules actually have to live to fire](LOOPS.md#where-rules-actually-have-to-live-to-fire).

---

## Using these

They are not independent. #1 (envelope), #2 (floors), #4 (negative controls) and #11 (skeleton) are
what you write **before** a run; #3 (disk), #6 (liveness) and #7 (blind grading) are what you do
**during and after** it; #8 (ledger) and #9 (fold-back) are what turn a finished run into a change
that actually landed; #5 (budget), #10 (admissibility) and #12 (trigger placement) govern whether a
run should exist at all.

If you adopt exactly two, adopt **#8** and **#4** — a ledger that names closing artifacts, and one
proven negative control on whatever check you trust most. Those two are what make the other ten
verifiable instead of aspirational.

For the process of turning these into an actual runnable contract, see
[AUTHORING-A-CONTRACT.md](AUTHORING-A-CONTRACT.md).
