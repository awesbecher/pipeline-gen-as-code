# The nine decision rules and compressed operating cards

These are the same rules `engine/mix.js` encodes, stated for use by hand
when the engine directory is not available. Verdicts: run_now (staff and
fund this quarter), instrument_now (start the slow flywheel with a small
allocation), defer (revisit at the named gate), blocked (a stated
constraint rules it out). Budget: run_now engines share 8500 basis
points by weight and instrument_now engines split 1500, exactly
apportioned with unallocated cash reported. The split is a starting
allocation hypothesis, not a forecast.

The CAC verdict that frames all nine: PLG is the cheapest at scale, then
Community + Partner Led, then SEO and AEO. Those take months to
instrument. The other 6 you can turn on this quarter.

## 01 Automated Outbound · weight 2

Rule: run_now for nearly everyone. Defer only if nobody owns it (no GTM
engineer and no AEs). Blocked by no_email.
Card: one GTM engineer, waterfall enrichment to 95 percent verification,
secondary domains warmed four to six weeks, tight 300-account lists, one
signal-led opening line per contact, send caps held. Rep touches replies
only. KPI: replies at 6 to 12 percent enriched; 1 to 3 unenriched burns
the domain. Stack: Clay, Apollo, Instantly, HeyReach.

## 02 Product-Led Growth · weight 3 when it runs

Rule: self_serve "yes" and ACV under $50K: run_now. Self_serve "yes" at
enterprise ACV: instrument_now (PQL scoring; sales works the queue).
"partial": instrument_now (pick the entry model; reverse trial is the
default answer). "no": defer until a self-serve surface exists.
Card: the product is the SDR. Usage into Segment, PQL on seat velocity
(15 to 20 seats a quarter), domain consolidation, SSO or SCIM attempts.
Outreach references what the account did. KPI: 8 percent median
free-to-paid; PQL-to-enterprise 10 to 25 percent when worked. Stack:
Segment, Amplitude, Stripe.

## 03 Manual Outbound + Cold Calling · weight 3

Rule: run_now at ACV $25K and above. no_phone alone degrades it to
instrument_now at $50K+ (email and LinkedIn only), defer below.
no_email alone: still run_now at $25K+ on phone and LinkedIn, email
leg off. no_phone AND no_email together: defer; a LinkedIn-only
rep-led motion does not clear the cost bar. Under $25K ACV: defer;
engines 01 and 02 carry it.
Card: tier ladder (Dream-150 by hand, T1 calls plus sequences, T2
automated, T3 email only); below-the-line calling: practitioners first,
then the decision maker quoting their words. Eight attempts to reach one
person; verified mobiles move connect rates from 5 to 13 percent. KPI: 2
to 3 percent dial-to-meeting, 5 to 8 coached on clean data. Stack: Clay,
Perplexity, Nooks, HubSpot. Full program: wesbecher.llc/pipeline.

## 04 ABM · weight 2 with reps

Rule: ACV $75K and above with at least one AE: run_now. Enterprise ACV
without reps: instrument_now (build list and signals; route later).
Below $75K: defer, signals still feed outbound.
Card: named list, one awareness stage per account (Identified → Aware →
Interested → Considering → Selecting), entry signals per stage, stage
decides the play. Suppress customers and open opps; never advance on one
signal. KPI: 25 to 40 percent of the list engaging inside 90 days,
judged on stage progression. Stack: Clay, Ocean.io, RB2B, Jungler.

## 05 Community + Partner Led · weight 1

Rule: instrument_now in almost every case. Defer only on
no_community_capacity. Practitioner-facing or self-serve products lean
community-led; everyone else runs the partner lane (marketplace listing
plus two or three co-sell relationships).
Card: pick one lane; the value engine pays members before it pays you.
Quiet capture: who shows up, asks, brings a colleague. KPI: nothing this
quarter; channel clearing 25 percent of new business at the year mark is
graduation. Stack: Slack, Circle, Luma.

## 06 Paid Media · weight 1

Rule: run_now only when ABM itself runs now AND monthly cash clears
about $8K. ABM deferred: no list, so paid is spray. ABM instrumenting:
the list exists but nobody routes yet, so paid waits. Under the cash
floor, spend fragments below the learning threshold. no_paid_budget:
defer.
Card: matched audiences 300 to 1,500 accounts; thought-leader ads on
top, proof to engagers, demo asks only at warm retargeting. Speed to
lead: book the meeting on the form. KPI: cycles 15 to 30 percent faster,
5 to 15 percent of pipeline. Stack: LinkedIn Ads, Chili Piper, Ergo.

## 07 SEO + AEO · weight 1

Rule: instrument_now, always. No fast mode exists.
Card: topic clusters, versus pages (the strongest AI-traffic predictor;
21 plus comparison pages is the tier to reach), question-shaped headings,
answers in first sentences, FAQ schema. Measure with the "how did you
hear about us" field and a fixed weekly prompt set; AI traffic hides in
Direct. KPI: AI-referred visitors convert around five times organic.
Stack: Ahrefs, Claude, AirOps, Warmly.

## 08 Social Content · weight 1

Rule: run_now unless founder_wont_post; then defer (park it rather than
ghost-write badly).
Card: the founder's profile is the channel (roughly three times company-
page engagement). Three posts a week in one lane plus daily comments
where the ICP argues. Warm notes to repeat engagers referencing what
they engaged with. KPI: inbound conversations roughly triple inside 60
days. Stack: Claude, Jungler, RB2B, Ergo.

## 09 Events · weight 2

Rule: run_now at enterprise ACV ($75K+) with monthly cash $15K and
above. Blocked by no_events_budget. Otherwise defer: attend, do not
sponsor; a dinner beats a booth.
Card: the event starts four to six weeks out. Build the list from
speakers, exhibitors, signals; sequence the top tier with
session-specific angles (generic replies at 2 percent, specific near
10); pre-book half the meetings; executive-hosted dinner off the floor;
24/48-hour follow-up SLA. KPI: ICP-first runs $2.5K to $5K per
opportunity against $8K to $12K booth-first. Stack: Luma, Instantly,
Clay, Ergo.

## The evidence rule that travels with every number above

Every range above resolves to a claim ID in docs/SOURCES.md with
source, evidence class, and confidence. Unsourced numbers (the ACV
and cash thresholds, the 25 percent channel bar, the 300-account
list rule) are Andrew operator heuristics, labeled as such. Cite the
claim ID when a plan quotes a number.
