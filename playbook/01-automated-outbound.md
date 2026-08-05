# Engine 01 · Automated Outbound

One GTM engineer, waterfall-enriched data, warmed domains, and campaigns
that run at machine scale while a human approves every message that
leaves. The baseline layer for nearly every B2B company.

## The flow

↳ ICP model + campaign strategy
↳ Account sourcing + stakeholder mapping
↳ Copywriting, then campaign execution
↳ CRM sync + reporting

Runs on one GTM engineer and one sales rep.

## How the best run it

The teams that make this work treat it as an infrastructure problem first.
Secondary send domains, two to three mailboxes each, four to six weeks of
warmup before a single campaign, and send caps that live outside anyone's
enthusiasm. Data runs as a waterfall: Apollo sources the list, Clay
cascades three to five providers until the list bounces under 2 percent,
and AI research writes one specific opening line per contact from a real
signal. Verified lists bounce 1.53 percent against 2.55 percent
unverified, and Gmail requires a spam complaint rate under 0.30 percent.
A tight 300-account list beats a loose 3,000 every time, because reply
rate compounds into deliverability. Smartlead puts the safe ceiling at 30
to 50 sends per warmed mailbox per day, so Andrew's operating number of
400 to 500 sends a day for one operator is roughly ten mailboxes; the
mailbox math is sourced, the per-operator throughput is his heuristic.
The rep only touches replies.

## The number

Personalization sets the reply rate, and list size caps it. Advanced
personalization replies at 17 to 18 percent; basic or none replies at 7
to 9. Across 20 million sends the platform-wide average is 3.43 percent.
Campaigns under 50 contacts average 5.8 percent; campaigns over 1,000
average 2.1.

Sources: claims AO-1 to AO-5 in docs/SOURCES.md (evidence class and
confidence per claim; unsourced values are Andrew operator heuristics).

## Stack

Clay (enrichment waterfall) · Apollo (sourcing) · Instantly (sending) ·
HeyReach (LinkedIn execution)

## Run it when

Almost always. The mix engine defers it only when nobody owns it (no GTM
engineer and no AEs) and blocks it only on a no-email constraint.

## First 90 days

Weeks 1 to 4: buy secondary send domains, two to three mailboxes each,
start warmup. Build the ICP model and the first tight account list
through the enrichment waterfall.
Weeks 5 to 8: first campaigns live at low volume, one specific opening
line per contact from a real signal. Send caps hold no matter how good
week six feels.
Weeks 9 to 12: scale toward full operator throughput, one mailbox at a
time against the 30 to 50 sends a day ceiling. The rep works replies
only. Report on replies and meetings, never on sends.

## Tripwires

Replies sliding toward the 3.43 percent platform average while the
campaign claims to be personalized: stop and fix the list or the angle
before touching volume. Bounce rate above 2 percent: the waterfall is
broken; no sends until it is not.
