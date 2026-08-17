# agent-ops-playbook

A written doctrine for running a small fleet of AI agents under real operational discipline —
budgets, verification gates, and a failure ledger — instead of ad hoc prompting.

This is not a framework and not a tool you install. It is the set of rules one person actually
runs, session after session, to get multi-hour AI work done unattended and trust the result
without re-reading it end to end. The rules exist because something broke without them; each one
is stated as a rule plus the specific failure that created it.

## The shape of it, in one paragraph

Four roles, never more: a **planning-and-verification model** that scopes work, grills its own
assumptions, and checks finished output against disk — never the model that also wrote the output.
A **sandboxed code-writing worker** that can read broadly but writes only inside an explicit output
directory. A **manual outside-research step** — a human-driven deep-research product, not an API —
for grounding claims in real, cited sources. And an **occasionally-admitted contractor lane** for
the rare job that is genuinely too large for a normal context window, gated by a scoring test so it
doesn't become a dumping ground. Work runs in one of two loops, described in full in
[LOOPS.md](LOOPS.md):

- **Interactive build day** — a same-session loop of plan → research → capture → build → audit →
  repeat, with a human in it at every step.
- **Burn night** — an unattended, multi-hour overnight run against a pre-written slate of
  contracts, verified cold the next morning by a fresh session that owes nothing to the run that
  produced the work.

## Why this is worth reading

Most "AI agent orchestration" advice stops at "give it a good prompt." This playbook is about
everything that has to be true *around* the prompt before you can leave a fleet running overnight
and trust what it hands back: how depth actually gets produced (never a clock), why verification
has to happen against files on disk and never against a transcript, why the model that grades work
can't be the same family as the model that wrote it, and why a finding that never becomes a
committed artifact in the same sitting effectively never happened.

None of it is exotic. All of it was earned by something failing first.

## What's in this repo

- **[MECHANISMS.md](MECHANISMS.md)** — the twelve load-bearing rules the whole system runs on
  (contract authority envelopes, floor-governed depth, disk-as-truth verification, negative controls,
  blind cross-family grading, and the rest), each stated as the rule, the specific failure that
  created it, and how to replicate it in your own setup.
- **[FAILURES.md](FAILURES.md)** — the failure record itself: twelve real incidents, what each one
  cost, and which rule closed the gap. Read this one first if you are skeptical — it is what makes
  the mechanisms legible instead of looking like ceremony.
- **[AUTHORING-A-CONTRACT.md](AUTHORING-A-CONTRACT.md)** — the process for turning a rough idea into
  a runnable contract, keyed to the template's own sections, including the pre-launch checks and an
  explicit list of what is still undocumented.
- **[LOOPS.md](LOOPS.md)** — both loops, phase by phase, with the measured numbers behind the
  design choices (why depth comes from floors and never from a ceiling, what a floor-governed run
  looks like against a clock-governed one, real per-burn cost).
- **[templates/](templates/)** — the artifacts you actually copy: a hardened contract template, a
  findings ledger with a real status lifecycle, a research-prompt skeleton, deep-research prompt
  starters, a capture-receipt schema, and a small evidence-integrity library with tests.
- **[PORTING.md](PORTING.md)** — read this before you try to adopt any of it. What a stranger does
  *not* get for free, stated honestly, so you don't go looking for a slate-producer or a backlog
  culture that this repo cannot hand you.

If you only have five minutes, read [FAILURES.md](FAILURES.md) and PORTING.md's "what you don't
get" list — those two are the difference between this being a checklist you can act on and a
management-consulting document you nod at and forget.

## Roadmap

Still open, and deliberately not faked: a generalized version of the dispatch tooling. The scripts
this doctrine runs on are absolute-path, single-platform, and full of traps specific to one shell —
[PORTING.md](PORTING.md) explains why porting them as-is would be worse than not porting them. A
handful of things this system genuinely runs on are also still undocumented — chiefly how a night
gets chosen as a build day versus a burn night — and they are listed honestly in
[PORTING.md](PORTING.md) and in
[AUTHORING-A-CONTRACT.md](AUTHORING-A-CONTRACT.md#what-is-open-in-this-runbook) rather than papered
over.

## License

MIT — see [LICENSE](LICENSE).
