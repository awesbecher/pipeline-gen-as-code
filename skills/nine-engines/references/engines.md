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
Card: one GTM engineer, waterfall enrichment until the list bounces
under 2 percent, secondary domains warmed four to six weeks, tight
300-account lists, one signal-led opening line per contact, send caps
held at 30 to 50 per warmed mailbox per day. Rep touches replies only.
KPI: replies at 17 to 18 percent with advanced personalization, 7 to 9
with basic or none, against a 3.43 percent platform average; reply rate
falls with list size (5.8 percent under 50 contacts, 2.1 over 1,000).
The 400 to 500 sends a day for one operator is an operator heuristic.
Stack: Clay, Apollo, Instantly, HeyReach.

## 02 Product-Led Growth · weight 3 when it runs

Rule: self_serve "yes" and ACV under $50K: run_now. Self_serve "yes" at
enterprise ACV: instrument_now (PQL scoring; sales works the queue).
"partial": instrument_now (pick the entry model; reverse trial is the
default answer). "no": defer until a self-serve surface exists.
Card: the product is the SDR. Usage into Segment, PQL on seat velocity
(15 to 20 seats a quarter, an operator heuristic), domain consolidation,
SSO or SCIM attempts. Outreach references what the account did. KPI: 8
percent median free-to-paid, self-reported across 200 B2B products.
PQL-to-enterprise at 10 to 25 percent is an operator heuristic with no
resolvable source; do not present it as a benchmark. Stack: Segment,
Amplitude, Stripe.

## 03 Manual Outbound + Cold Calling · weight 3

Rule: run_now at ACV $25K and above. no_phone alone degrades it to
instrument_now at $50K+ (email and LinkedIn only), defer below.
no_email alone: still run_now at $25K+ on phone and LinkedIn, email
leg off. no_phone AND no_email together: defer; a LinkedIn-only
rep-led motion does not clear the cost bar. Under $25K ACV: defer;
engines 01 and 02 carry it.
Card: tier ladder, an operator heuristic (Dream-150 by hand, T1 calls
plus sequences, T2 automated, T3 email only); below-the-line calling:
practitioners first, then the decision maker quoting their words. Three
dial attempts per prospect on average; about 10 percent connect per dial
and about 25 percent per prospect. A team needing eight attempts has a
data problem, not a benchmark. KPI: 0.27 percent dial-to-meeting, about
one booked meeting per 370 dials; 4.6 percent of connected conversations
book. Size cold-calling capacity off the 0.27 percent. Stack: Clay,
Perplexity, Nooks, HubSpot. Full program: wesbecher.llc/pipeline.

## 04 ABM · weight 2 with reps

Rule: ACV $75K and above with at least one AE: run_now. Enterprise ACV
without reps: instrument_now (build list and signals; route later).
Below $75K: defer, signals still feed outbound.
Card: named list, one awareness stage per account (Identified → Aware →
Interested → Considering → Selecting), entry signals per stage, stage
decides the play. Suppress customers and open opps; never advance on one
signal. Two resolution levels, never conflated: company-level visitor
match runs 30 to 65 percent, person-level 8 to 15 percent. Size outreach
off the person-level rate. KPI: 25 to 40 percent of the list engaging
inside 90 days is an operator heuristic with no external source; judge
on stage progression. Stack: Clay, Ocean.io, RB2B, Jungler.

## 05 Community + Partner Led · weight 1

Rule: instrument_now in almost every case. Defer only on
no_community_capacity. Practitioner-facing or self-serve products lean
community-led; everyone else runs the partner lane (marketplace listing
plus two or three co-sell relationships).
Card: pick one lane; the value engine pays members before it pays you.
Quiet capture: who shows up, asks, brings a colleague. KPI: nothing this
quarter; channel clearing 25 percent of new business at the year mark is
graduation, an operator heuristic rather than an industry figure. Stack:
Slack, Circle, Luma.

## 06 Paid Media · weight 1

Rule: run_now only when ABM itself runs now AND monthly cash clears
about $8K. ABM deferred: no list, so paid is spray. ABM instrumenting:
the list exists but nobody routes yet, so paid waits. Under the cash
floor, spend fragments below the learning threshold. no_paid_budget:
defer.
Card: matched audiences at LinkedIn's published 300-member floor (the
1,500 ceiling is an operator heuristic); thought-leader ads on top,
proof to engagers, demo asks only at warm retargeting. Thought Leader
Ads are reported at 4.65 percent CTR and $0.51 CPC against 0.68 percent
and $2.42 for standard ads, all of it vendor-published, with no
cost-per-qualified-lead comparison anywhere. Speed to lead: book the
meeting on the form; the MIT study measured qualify odds dropping 21
times between a 5-minute and a 30-minute response, on 2007 data. KPI:
cycles 15 to 30 percent faster and 5 to 15 percent of pipeline are both
operator heuristics, not measured shares. Stack: LinkedIn Ads, Chili
Piper, Ergo.

## 07 SEO + AEO · weight 1

Rule: instrument_now, always. No fast mode exists.
Card: topic clusters, versus pages (the content type most correlated
with AI traffic; sites with 21 plus comparison pages show 900 percent
more median AI search sessions than sites with one to five, though
content explains only about 28 percent of the variance), question-shaped
headings, answers in first sentences, FAQ schema. Measure with the "how
did you hear about us" field and a fixed weekly prompt set; AI-referred
clicks often land as Direct because the platforms do not pass a
referrer, and no source quantifies how often. KPI: for B2B SaaS,
AI-referred visitors convert at 1.05x organic, which is parity, on 0.2
to 3 percent of sessions. Stack: Ahrefs, Claude, AirOps, Warmly.

## 08 Social Content · weight 1

Rule: run_now unless founder_wont_post; then defer (park it rather than
ghost-write badly).
Card: the founder's profile is the channel (2.60 percent engagement rate
against 1.74 percent for company pages, about 1.5x, on effectively equal
impressions; the quoted 5x comes from a 2023 seven-employee sample).
Three posts a week in one lane plus daily comments where the ICP argues.
Warm notes to repeat engagers referencing what they engaged with. KPI:
inbound conversations roughly tripling inside 60 days, and inbound
closing an order of magnitude better than cold, are both operator
heuristics with no external source. Stack: Claude, Jungler, RB2B, Ergo.

## 09 Events · weight 2

Rule: run_now at enterprise ACV ($75K+) with monthly cash $15K and
above. Blocked by no_events_budget. Otherwise defer: attend, do not
sponsor; a dinner beats a booth.
Card: the event starts four to six weeks out. Build the list from
speakers, exhibitors, signals; sequence the top tier with
session-specific angles (the 2 percent generic against near 10 percent
specific is an operator heuristic; the measured support is email
personalization at 17 to 18 percent against 7 to 9); pre-book half the
meetings, another operator rule; executive-hosted dinner off the floor
at $1,000 to $3,000 per qualified meeting against $1,500 to $3,000 for
a Tier 1 sponsorship; 24/48-hour follow-up SLA, also Andrew's. KPI:
published cost per qualified opportunity is $5K to $15K for disciplined
programs and $10K to $25K for average ones; the $2.5K to $5K Andrew
runs to sits below every published band and is an operator heuristic.
Event-touched deals close at 12.1 percent live and 13.8 virtual against
11.1 percent for other channels. Stack: Luma, Instantly, Clay, Ergo.

## The evidence rule that travels with every number above

Every range above resolves to a claim ID in docs/SOURCES.md with
source, evidence class, and confidence. Unsourced numbers are Andrew
operator heuristics and are labeled as such inline: the ACV and cash
thresholds, the 25 percent channel bar, the 300-account list rule, the
tier ladder, 400 to 500 sends a day, 15 to 20 seats a quarter, 10 to 25
percent PQL-to-enterprise, 25 to 40 percent list engagement, the 1,500
matched-account ceiling, 15 to 30 percent cycle acceleration, 5 to 15
percent of pipeline, tripling inbound in 60 days, inbound closing an
order of magnitude better than cold, the 2 versus 10 percent event
note, pre-booking half the meetings, the 24/48 SLA, and the $2.5K to
$5K per opportunity. Cite the claim ID when a plan quotes a number, and
never present a heuristic as an external benchmark.
