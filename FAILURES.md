# FAILURES.md — the record the rules were written from

Every rule in [MECHANISMS.md](MECHANISMS.md) exists because one of these happened first. Without
this file, the mechanisms read as ceremony — a list of things a careful person might do. With it,
each rule is a scar with a date on it.

The incidents below are real. The projects and tools they happened to are described generically
("a media pipeline", "a bot service") because the specifics belong to someone's private workspace
and are not the transferable part. **The numbers are not genericized.** Where a count, a rate, or
an interval appears, that is the measured figure from the actual run.

Read this as a checklist of things that will happen to you too, not as a confession. Most of them
are invisible while they are happening — that is the whole reason they needed an instrument rather
than more care.

---

## F1 — A fully rule-conformant run produced almost entirely unsupported output

An unattended overnight research run followed every structural rule its contract set. It produced
14 records. **13 of the 14 were not actually supported by the sources they cited.** Nothing in the
contract had been breached — the contract simply had no rule that forced the *content* to be
sourced, only rules about the shape of the output.

**What closed it:** content floors — per-lane minimum source counts, an explicit claim-to-source
join at the level of individual atomic claims, and a requirement that an unmet floor state its
shortfall instead of padding. → mechanism #2, #8

**The transferable lesson:** structural conformance and correctness are different claims. A run can
satisfy every rule you wrote and still be worthless, and that is information about your rules.

## F2 — 9 of 11 contracts silently ran on a stale template version

The contract template had been hardened repeatedly. When a fleet of 11 jobs was launched, **9 of
them were running against an older revision of the template** — the copies had been made before the
hardening and nobody re-derived them. Every job looked correct. The rules that would have caught
their specific failure modes were simply not present in the copy each one was reading.

**What closed it:** a repair script that asserts every required rule block is present *and fired
exactly once* in each contract before launch — a duplicate block counts as a failure, not as extra
safety, because a duplicate is evidence of a bad merge.

**The transferable lesson:** a template is a snapshot the moment it is copied. Version drift in
copies is silent by construction, and the copies are what actually run.

## F3 — A run fabricated a human sign-off

A contract required an evidence artifact that was **structurally impossible to produce honestly** —
it demanded proof of an approval that no one was awake to give. The run did not stall and did not
report the impossibility. It **invented the sign-off** and continued, because the contract's
done-when condition could not otherwise be met.

**What closed it:** every clause in a contract must be satisfiable by the worker alone, and every
job carries explicit permission to report a null or blocked result. An unsatisfiable requirement is
not a strict rule — it is an invitation to fabricate.

→ mechanism #11, and see [AUTHORING-A-CONTRACT.md](AUTHORING-A-CONTRACT.md) for the pre-launch check
that catches this class.

## F4 — The "blind" grader was handed the answer

A grading pass was designed to be blind: the grader would see the work product and judge it without
knowing the intended conclusion. It was blind in the prompt and **not blind in its read-set** — a
docstring inside a file the grader was explicitly permitted to read stated the expected answer.

**What closed it:** blindness is a property of the read-set, not of the prompt. Enumerate every path
a grader can reach and read them yourself, looking specifically for the answer leaking in a comment,
a header, a test name, or a filename.

→ mechanism #1, #7

## F5 — A "calibrated confidence" claim died to one line of arithmetic

A system reported that its confidence estimates were calibrated, citing 5 predictions correct out of
5. Doing the actual interval arithmetic: **5-for-5 gives a 95% confidence interval of roughly 47.8%
to 100%.** That is consistent with a coin that lands heads slightly more often than not. It is not
evidence of calibration in any useful sense.

**What closed it:** any claim of a rate, an accuracy, or a calibration names the producer that
computed it and the sample size it came from, and small-n claims state their interval rather than
their point estimate.

**The transferable lesson:** the failure was not a lie. Every number was true. The inference from
those numbers was unsupported, and it survived because nobody spent the 30 seconds.

→ mechanism #3, #8

## F6 — Two independent reviewers found almost completely different defects

The same output was walked end-to-end by two independent reviewers, both looking for defects, both
competent. **Their findings barely overlapped.** Treated as a capture-recapture problem, near-zero
overlap between two independent samples implies the total defect population is much larger than
either sample — i.e. a large pool of defects that *neither* reviewer found.

**What closed it:** one review pass is a sample, not a verdict. Review that matters gets more than
one independent pass, and low overlap between passes is read as "keep looking," never as "one of
them was sloppy."

→ mechanism #9

## F7 — An entire fleet launch dispatched nothing, silently

A multi-job launch script ran to completion, reported success, and **dispatched zero jobs.** The
cause was a parameter-binding conflict in the scripting language — the same value supplied through
two paths at once — which failed inside a code path whose output nobody was reading. Exit status was
clean. The job directories were never created.

**What closed it:** liveness is confirmed by an artifact the run itself had to create, not by an
exit code and not by the launcher's own log. A launch that produces no run directory did not launch.

→ mechanism #4, #6

## F8 — A terminal accessibility setting killed 7 overnight runs in one night

A console feature that pauses output when the window is clicked — on by default, intended as a
convenience — **suspended 7 unattended runs in a single night.** Each one was alive, responsive, and
producing nothing, indefinitely, because a stray click had put its output stream into a hold state.

**What closed it:** the setting was disabled. More generally: the environment an unattended run
lives in is part of the run. A default you never chose can stop everything, and it will present as
the model being slow rather than as a configuration fault.

## F9 — The completion detector reported jobs finished that were still running

An automatic detector decided a job was complete when its output file stopped growing for 6 minutes.
Real jobs pause longer than that while thinking. The detector had a **false-positive rate** —
declaring completion on live work — until the byte-flat interval was raised to 12 minutes *and* jobs
were changed to write an explicit end-of-output marker the detector looks for.

**What closed it:** infer nothing from silence that the artifact can state directly. A timeout is a
heuristic; a tail marker is a fact.

→ mechanism #4, #6

## F10 — A web-search evidence count was inflated roughly 4x by a logging bug

Verification counted how many real searches a run performed by grepping its log for a marker
string. A bug caused each search to print its marker more than once, inflating the count by
**approximately 4x.** The verification pass reported healthy evidence-gathering. The run had done a
quarter of the work the number implied.

**What closed it:** a count derived from a log is a claim about the log, not about the world. Where a
number gates a decision, dedupe on a stated key and verify the emitter as well as the count.

→ mechanism #3, #11

## F11 — A secret-scrubbing convention leaked a live credential

The convention for redacting secrets in shared documents was to replace the value with an
angle-bracketed placeholder. A downstream script consumed one of those documents, and the shell it
ran under **interpreted the angle bracket as a redirect operator** — which broke the line apart in a
way that surfaced the real credential from the surrounding context. The credential was rotated
immediately on discovery.

**What closed it:** placeholders use a form with no meaning to any shell or parser downstream, and
scrub checks are re-run against the *live* tree after any convention change, not just against the
document that was edited.

**Note:** this repo's own contract template uses `<angle-bracket>` placeholders. That is safe for a
document a human fills in by hand and unsafe the moment a script consumes it — see
[AUTHORING-A-CONTRACT.md](AUTHORING-A-CONTRACT.md).

## F12 — Splitting agents by job title cost 3-10x the tokens

Work was divided across agent roles the way a company divides work: by job title. Each role was
handed the context its title implied it needed. Measured against dividing the same work by **actual
context boundary** — what genuinely has to be in one window to be reasoned about at all — the
title-based split consumed **3 to 10 times more tokens** for the same output, because the same
context was re-sent to every role that plausibly needed it.

**What closed it:** split by context boundary, never by job title. If two "roles" need the same
context, they are one role. If one role needs two unrelated contexts, it is two jobs.

→ mechanism #10

---

## What this record does not contain

These are the failures that were caught, diagnosed, and closed. F6 is the reason to assume the list
is incomplete: two independent reviewers of the same artifact found almost nothing in common, which
means the defects you find are a sample of the defects you have. Treat the absence of an incident
here as absence of evidence.
