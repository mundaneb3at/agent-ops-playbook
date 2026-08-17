# PORTING.md — what you don't get for free

Read this before you assume any of this playbook drops into your own setup unchanged. The
mechanisms port. The specific machinery that makes them work in one particular setup does not, and
pretending otherwise is exactly the kind of overclaim this playbook argues against everywhere else.

## What this repo does NOT hand you

**A searchable backlog or handoff culture.** The "no slate, no launch" rule in
[LOOPS.md](LOOPS.md) presupposes you already have a way to accumulate, rank, and hand off
well-specified work items across sessions. If you don't have that yet, building it comes *before*
you can run an unattended burn night — a burn with nothing well-specified queued produces nothing,
regardless of how good the contract template is.

**A ranked-backlog producer.** The system this playbook was extracted from mines its ranked work
queue from years of one specific person's own accumulated notes, decisions, and open questions.
That producer is inherently personal — there is no generic version of it to hand you. Bring your
own.

**Portable scripts.** Every automation script in the source system (the dispatcher, the fleet
controller, the completeness checkers) is written against one specific machine's absolute paths
and one specific shell's quirks. None of that is included here on purpose — see the README's
"generalizable, not shippable" framing. Copy the **pattern** each script implements (a
quota-gated dispatcher that writes a structured run record; a fleet controller that watches
multiple concurrent jobs by output growth; a completeness checker with a negative control), not
literal source, especially if you're on a different OS or shell.

**A trust/access boundary between roles.** The source system's specific boundary — how much a
worker can read vs. write, what counts as a "safe" sandbox — is a decision made for that person's
specific risk tolerance and environment. It is explicitly enforced by **convention** (job
scoping), not by a real technical permission boundary, and that tradeoff was a conscious choice,
not an oversight. Design your own boundary; don't assume this one is calibrated for your risk
tolerance.

**Cost/routing economics.** The source system's framing of "one role is the cheap, expendable pool
and another is the expensive, judgment pool" is specific to one particular subscription structure
and inverts completely under a different pricing model. The part that actually generalizes is the
**two axes** — trust/access on one dimension, cost on the other — not which specific tool plays
which role. Re-derive your own mapping from your own actual pricing.

**Meaning without the failure stories.** The lettered/numbered sections in
[templates/burn-contract-template.md](templates/burn-contract-template.md) read as arbitrary
ceremony without the specific failure each one closed attached to it. This repo's v0.1 ships the
rules; the failure record that explains *why* each one exists is a stated v0.2 gap (see README's
roadmap) — until it lands, read the italic "why" notes inline in the template, and don't strip a
section just because it looks like boilerplate.

**Automation of the outside-advisor step.** The manual deep-research role is a human using a
consumer product in a browser, not an API call. Say that plainly to yourself before you design
around it — there is no hidden automation path being glossed over here, it genuinely requires a
person to sit down and run it.

## A known, honestly-stated gap in this playbook itself

Two things this system runs on are **not yet documented anywhere**, including in the source
material this repo was written from:

1. **How a session decides "tonight is an interactive build day vs. an unattended burn night."**
   That judgment call currently lives entirely in one person's head.
2. **The actual runbook for *authoring* a new contract from the template.** The template exists
   and is documented in detail; the process of turning a rough idea into a filled-in, ready-to-run
   contract has never itself been written down.

Both are real gaps, not oversights hidden from you. If you build either one for your own setup,
that's genuinely new ground, not something you missed in this repo.
