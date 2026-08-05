# Engine 02 · Product-Led Growth

The product is the SDR. Usage streams into the warehouse, PQL scoring
finds the companies forming inside the accounts, and sales works a queue
the product filled. Needs a self-serve surface to exist at all.

## The flow

↳ Entry model (freemium, free trial, reverse trial)
↳ Signup experience, self-serve or sales-assisted
↳ Product usage sync + segmentation
↳ PQL scoring on seat thresholds and feature gates
↳ Viral loops (referrals, upsells, community)

## How the best run it

The entry model is a packaging decision, not a default. Airtable runs a
reverse trial: fourteen days of the paid tier, then a real free plan,
which keeps the user relationship alive after the trial ends. Airtable
publishes no conversion lift for the mechanism, so do not attach a number
to it. Cursor gated nothing and let power users hit usage limits;
free-to-paid was reported at 36 percent, roughly ten times the freemium
norm, though that figure is a third-party estimate relayed by GTMnow, not
a Cursor disclosure. Either way, the product is the SDR: usage streams
into Segment, and the PQL definition is the whole game. Seat velocity,
domain consolidation, and an SSO or SCIM attempt are the signals that
mean a company is forming inside the account. Andrew watches 15 to 20
seats added in a quarter as the trigger; that threshold is his operator
heuristic, not a published signal. The outreach that converts references exactly what
the account did; cold "book a demo" against a PQL wastes the signal.

## The number

Median free-to-paid is 8 percent, self-reported by 200 B2B software
products. PQL-to-enterprise at 10 to 25 percent is an Andrew operator
heuristic; no resolvable source publishes that band, so keep it out of
board-facing plans as a benchmark.

Sources: claims PLG-1 to PLG-5 in docs/SOURCES.md (evidence class and
confidence per claim; unsourced values are Andrew operator heuristics).

## Stack

Segment (usage sync) · Amplitude (product analytics) · Stripe (billing
and conversion)

## Run it when

Self-serve product under a $50K ACV: run it now, full weight. Self-serve
under an enterprise motion: instrument PQL scoring and let sales work the
queue. Partial self-serve: define the entry model first (reverse trial is
the default answer). No self-serve surface: defer until one exists.

## First 90 days

Weeks 1 to 4: pick the entry model deliberately. Wire signup, activation,
and usage events into Segment.
Weeks 5 to 8: write the PQL definition from the signals above and score
the existing base. Route the first queue to a named owner.
Weeks 9 to 12: outreach templates that reference exactly what the account
did. Measure PQL-to-conversation, then PQL-to-pipe.

## Tripwires

Free-to-paid far under the 8 percent self-reported median: the entry model or the
activation path is wrong; fix packaging before funding promotion. PQLs
aging unworked in the queue: the engine is generating and nobody is
harvesting; that is a staffing decision, not a product problem.
