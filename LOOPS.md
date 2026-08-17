# The two loops

Everything in this playbook runs through one of two loops. Pick the loop by whether a human is
going to sit with the work as it happens, or whether it needs to survive a human being asleep.

Both loops share the same four roles (see [README.md](README.md)):

| Role | What it does | What it must never do |
|---|---|---|
| Planner/verifier | Scopes work, grills its own assumptions, checks finished output against disk | Invent busywork to fill spare capacity; set new goals mid-run; touch its own spend-authorization file |
| Worker | Writes all code and artifacts, sandboxed to a write-only output directory | Write outside that directory; be trusted on its own say-so |
| Outside-advisor | Manual, human-driven deep research for grounding claims in real sources | Pretend to be an API call — it is a person using a product |
| Contractor | Occasional large-context or high-stakes jobs, admitted by a scoring test | Get used by default because it "seems more capable" |

The worker's read/write asymmetry — broad read access, narrow write access — is enforced by
**convention** (explicit job scoping), not a real permission boundary. State that plainly to
yourself before you rely on it. See [PORTING.md](PORTING.md) for why this matters when you design
your own version.

---

## Loop 1 — interactive build day

A same-session loop, human present at every phase. Six phases, and phase 6 feeds back into
phase 1 — this is a loop, not a pipeline with an end.

1. **Plan / diagnose / grill** *(planner/verifier)* — scope the actual problem, pressure-test the
   plan against your own assumptions, and end the phase with one written question specific enough
   that a stranger could go research it. If the phase doesn't produce that question, it isn't done.
2. **Deep research** *(worker, with network access)* — a path-scoped research brief, gated by a
   script that checks the brief only touches the paths it was given (see
   [templates/job-prompt-skeleton.md](templates/job-prompt-skeleton.md)). After the draft comes
   back, run a citation-risk audit on it before trusting a single claim.
3. **Capture** *(planner/verifier)* — decisions go into a ledger (see
   [templates/ledger-template.md](templates/ledger-template.md)), not into a report nobody
   re-reads. **Index decisions, not documents.** This step is explicitly unproven at scale — of
   roughly 30 research drafts run through this system, exactly one was ever promoted into shipped
   work. Say that plainly rather than oversell the loop's throughput.
4. **Build** *(worker, verified by planner/verifier)* — the worker writes; the planner/verifier
   checks the result against the contract, bounded to two correction rounds. A third round means
   the contract itself was wrong, not that the worker needs one more try.
5. **Audit** *(a fresh session, not the one that built)* — told explicitly to **refute, not
   review**. A review that finds nothing wrong is worthless; a refute pass that finds nothing wrong
   after genuinely trying is evidence. The audit must produce a section that states which of its
   own refutation attempts failed — i.e. which claims survived an honest attempt to break them.
6. **Loop** — whatever the audit surfaced becomes the next cycle's open question, back to phase 1.

## Loop 2 — burn night

An unattended, multi-hour overnight run. No human present between step 3 and step 7. Everything
that would normally be a human judgment call has to be pre-decided or pre-scripted before the run
starts, because there is nobody to ask at 3am.

1. **Slate** — a ranked list of contracts, each one built from the hardened template (see
   [templates/burn-contract-template.md](templates/burn-contract-template.md)) and passed through a
   completeness checker before launch, including a **negative control**: an intentionally blank
   contract must trip the checker's alarm, or the checker isn't actually checking anything. **No
   slate, no launch** — a burn never starts on a partially-ranked or partially-built queue.
2. **Contracts** — each contract carries an explicit authority envelope (exact read paths, a
   write-only output directory, facts already settled quoted verbatim so the worker can't
   re-litigate a closed decision it wasn't present for), and states its own completion criteria in
   testable, mechanically-checkable terms.
3. **Fire** — launch each driver (paste-per-driver, or a one-shot script for a batch). Each driver
   gets its own hidden process/port so drivers can't collide.
4. **Babysit** — watched by **output file byte-growth over time**, never by a process-exists check
   and never by a file's last-modified timestamp. Some environments don't flush an open file
   handle's mtime promptly, and a process list can read empty even while two real dispatches are
   actively running — both were measured failure modes of the naive checks. Growth-over-time is the
   one signal a stalled or crashed driver can't fake.
5. **Widen** — if a driver finishes early and there's real capacity left, widen the in-flight work
   using pre-declared **floors** (minimum coverage a lane must hit) — never a clock. A ceiling never
   produces length; nobody is watching it at 3am, so it does nothing.
6. **Watch** — arm a phone-notification watcher, proven against a synthetic stall before you trust
   it on a real run (see "negative controls," below).
7. **Fold back** — the next morning, in a **fresh session that ran none of the burn**, apply a
   three-state refute pass to every claim (`VERIFIED` / `REFUTED` / `UNVERIFIABLE`, never a binary
   pass/fail) and write an append-only release-review document. The burn's own output files are
   frozen at a hashes file the moment the burn ends; nothing — including the release review —
   edits them afterward. A `REFUTED` finding halts release for a human decision; it does not
   auto-resolve.

### Depth comes from floors, never from a clock

This is the single most load-bearing design choice in the whole system, so it gets its own
section. **A time ceiling never produces length or depth on its own** — it is a stop condition,
not a target. Depth has to be produced by something that actually forces more work to happen:

- **Per-lane coverage floors** — a minimum source count (or equivalent) per independent lane of
  work, where an unmet floor is **required to state the shortfall explicitly**, never silently
  padded from a different lane.
- **A reviewer whose convergence criterion resets to zero the instant a frozen artifact is
  edited** — so "looks done" can't be gamed by editing after the check already passed.
- **An empowered counterparty that may send work back exactly once** — a bounded correction loop,
  not an unbounded one.

Explicitly **rejected** as depth levers, because each one was tried and produced nothing real:
raw output volume, agent count, a minimum runtime, ceiling consumption for its own sake, or
switching to a higher model/effort tier as a substitute for actually doing more work.

**Measured contrast, same class of task:** a floor-governed night produced 36 user-visible turns
and 1,430 tool calls; a clock-governed night on comparable work produced 6 turns and 112 tool
calls. Same wall-clock ceiling in both cases — the floor is what did the work, not the clock.
Separately, one run stayed fully rule-compliant while running only 35 minutes against a 4.5-hour
ceiling: nobody was watching the clock, so the clock did nothing on its own.

### Negative controls — prove the check can fail before you trust it passing

Any instrument that is supposed to catch a problem needs to be shown catching a *known* problem
before you trust its silence on a real run:

- A contract-completeness checker must be shown tripping its "too many required fields missing"
  alarm on a deliberately blank/broken contract.
- A liveness watcher must be shown correctly detecting a **synthetic stall** before it is trusted
  to detect a real one.

A check that has never been seen to fail is not a check — it's an assumption wearing a script.

### Cost and scale, measured

- A single burn runs **40–65 minutes** at the highest reasoning-effort tier available.
- A burn consumes roughly **3% of a weekly AI-usage quota** (measured against one specific
  subscription's weekly allotment — your own ratio will differ, but the order of magnitude is
  useful as a sanity check).
- The **binding constraint on how much gets done is contract supply** — having enough
  well-specified, pre-vetted work queued up — not compute, not RAM, not model quota. A fast unattended
  system with nothing well-specified to run overnight is idle regardless of how much budget it has.

### Delegating to the contractor lane

The contractor role (see README) exists for the rare job that genuinely needs a whole corpus in
one context window, or is otherwise too large/high-stakes for the normal worker. Admission is a
**fixed six-question scoring test**, not a vibe call — score below five yes-answers and the work
routes to the normal worker instead, full stop. One of the six questions is explicitly "is there a
**named** consumer for this output" — "it goes in the backlog" is treated as equivalent to "this
will not get done" (measured completion rate on that kind of backlog item: roughly 2.5%), and is
grounds to refuse the job outright rather than run it anyway.

Reasoning effort/tier for a job is chosen by the **shape of the task**, not by how generous you
feel: the highest tier when depth or nuance is the actual bottleneck (open-ended design, an
argument that has to survive adversarial refutation), a middle tier when raw coverage across many
similar items is the bottleneck (a high-effort model deliberating per item runs out of window
before it runs out of items — a half-covered coverage job is worth close to nothing). Effort is
**never switched mid-session** — a switch re-buys the standing context/cache cost the stable
choice was avoiding.

### The 8-step job-prompt skeleton

Every job dispatched to the worker or the contractor states, in this order:

1. **Date, one topic, and a demand for evidence, not assertion** — the worker must ground claims in
   something checkable, never its own confident recall.
2. **Which lane this belongs in** — plan/verify, build, research, or contractor — so its authority
   envelope is unambiguous.
3. **The actual job, plus the measurement that motivated it** — a real number beats an adjective.
4. **Method, including known traps to avoid** — anything a prior run got wrong on a similar job.
5. **The deliverable as an exact file path and exact field/column names** — never "a report on X."
6. **Constraints, each one naming the specific failure it prevents** — a constraint with no stated
   reason invites being silently dropped under pressure.
7. **Explicit permission to report a null or negative result** — so the worker doesn't manufacture
   a finding just to look useful.
8. **A testable, unambiguous done-when condition.**

### Where rules actually have to live to fire

A rule that only exists in a reference document someone has to remember to open effectively never
fires. Operational rules that matter every session need to live somewhere that **re-injects
itself** on a short cycle (every few turns, every session start), not in a hub document you're
trusting yourself to re-read. The known cost of this: if the re-injected rules start getting
ignored as background noise, that's the signal to cut the newest one, not to add more.
