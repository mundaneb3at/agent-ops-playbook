# Job-prompt skeleton

The 8-step shape every job dispatched to a worker or a contractor should follow — assembled in
this order. This is the mechanical form of the loops described in [LOOPS.md](LOOPS.md); the
scoring test for whether a job belongs in the (occasional, high-cost) contractor lane at all lives
in [README.md](../README.md)'s role table.

**Never put angle-bracket placeholders in a block you're going to paste somewhere sensitive.** In
one real incident, an operator substituted a live credential into a placeholder but left the angle
brackets in; a downstream shell interpreted `<` as a redirect, and the credential leaked into a
transcript and had to be rotated immediately. Fill every placeholder completely, or delete the
line, before the prompt leaves your hands.

## The 8 steps

1. **Date, one topic, and a demand for evidence, not assertion.** State today's date explicitly
   (agents without a live clock will otherwise get date arithmetic wrong), name exactly one topic
   per job (don't bundle unrelated asks — see "one topic per dispatch" below), and require the
   response to ground claims in something checkable rather than confident recall. If you need the
   agent to report which model actually served the response, ask it to state that from hard
   evidence in its own transcript/logs — a UI confirmation message is not evidence of which model
   served a given turn; more than one real system has silently rerouted a model switch while still
   printing a success message.
2. **Which lane this belongs in.** Plan/verify, build, research, or contractor (see README's role
   table) — say so explicitly, because each lane has a different authority envelope and a
   different level of trust in its output.
3. **The job, plus the measurement that motivated it.** A real number beats an adjective — "fix the
   slow query" is worse than "the query took 4.2s against a 200ms budget, fix it."
4. **Method, including any known trap it must avoid.** If a prior job of this shape got something
   wrong (conflated two things that needed separate verdicts, missed a null result, etc.), name the
   trap explicitly rather than trusting the new job to avoid it on its own.
5. **The deliverable, as an exact file path and exact field/column names.** Never "a report on X" —
   name the file, name the schema.
6. **Hard constraints, each one naming what it prevents.** A constraint stated with no reason
   attached is the first thing to get quietly dropped when the job runs into friction.
7. **Honest framing — name the acceptable null result.** State explicitly that a negative or
   "nothing found" result is a valid, useful outcome, so the job doesn't manufacture a finding just
   to look productive.
8. **Done-when — a testable, unambiguous condition.** Ideally something a completely different
   session could walk in and verify without needing the original context.

## One topic per dispatch

Don't sideline a second ask into the same job because it's convenient — a job that's actually
scoped to one topic is easier to verify, easier to hand off, and doesn't let a weak answer on
topic B hide inside an otherwise-good answer on topic A.
