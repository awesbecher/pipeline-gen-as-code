# Benchmark source registry

Current state only. Every quantitative claim in this repository is
indexed here with what the claim says today, its source, a resolvable
URL where one exists, the sample and cohort and method behind it, an
evidence class, a confidence rating, and the date the source was last
read. Claims with no resolvable external source are labeled ANDREW
OPERATOR HEURISTIC: numbers Andrew Wesbecher uses to run pipeline,
offered as defensible starting points, not published research.

Every URL in this file was fetched and read on 2026-08-05. The numbers
were read off the page, not off a summary of the page. No URL here was
inferred, reconstructed, or guessed. A claim with no resolvable source
carries no URL and says it is an operator heuristic.

Correction history lives in [EVIDENCE-AUDIT.md](EVIDENCE-AUDIT.md):
what each claim said before, what changed and why, which cited domains
stopped resolving, and which widely repeated numbers failed to trace.
Read it before re-adding a number this registry dropped.

Every market statistic expires for planning purposes on 2027-08-05 and
should be revalidated before reuse.

## Evidence classes

| Class | Meaning |
|---|---|
| first-party study | The publisher analyzed its own platform or CRM data and disclosed sample size, period, and inclusion rules |
| industry report | Aggregated data across many companies, published by a named organization, sample disclosed |
| survey | Self-reported answers from named respondents; subject to recall and selection bias |
| vendor content | A tool vendor's playbook or benchmark page, often with the vendor's own product in the numerator |
| platform documentation | A platform's own normative rules. Binding, not measured |
| case study | A named company's published result, single instance |
| operator heuristic | Andrew's operating number. No external source. Argue with it; it is a knob |

## How to read confidence

**high** means a disclosed sample, a disclosed method, and no obvious
incentive for the publisher to inflate the number. **medium** means one
of those three is missing or the publisher sells against the number.
**low** means the number is directionally useful and quantitatively
unsupported. **stated as judgment** means it is Andrew's number and is
not offered as evidence at all.

---

## Engine 01 · Automated Outbound

| ID | Claim | Source | URL | Sample, cohort, method | Class | Confidence | Read |
|---|---|---|---|---|---|---|---|
| AO-1 | Cold email reply rate is a function of list size and personalization depth, not send volume. Advanced personalization runs 17 to 18 percent reply; basic or none runs 7 to 9 percent. Campaigns under 50 contacts average 5.8 percent; campaigns over 1,000 contacts average 2.1 percent. Platform-wide average is 3.43 percent. | "Cold Email Statistics Based on Sending Over 20M Cold Emails," Margaret Sikora, Woodpecker, published 2026-02-24, updated 2026-06-23 | https://woodpecker.co/blog/cold-email-statistics/ | Over 20 million emails sent through the Woodpecker platform. First-party platform data, method disclosed, reply classification described. | first-party study | high | 2026-08-05 |
| AO-1b | Corroborating dataset: average cold email reply rate 3.7 percent; hyper-personalized campaigns under 200 prospects reach 15 to 20 percent while campaigns over 500 prospects sit near 8 percent. Two platforms, 73 million emails, same direction on list size. | "13 Cold Email Statistics 2026 (Based on Analyzing 53M+ Cold Emails)," Dhruv Patel, Saleshandy, published 2026-06-07, updated 2026-08-04 | https://www.saleshandy.com/blog/cold-email-statistics/ | 53.1 million cold emails and 60,000 sequences sent through Saleshandy, January to June 2026, across Google Workspace, Microsoft 365, Zoho, custom SMTP and Azure. Reply classification by AI, method disclosed. | first-party study | high | 2026-08-05 |
| AO-2 | The operating bar is bounce rate, not a verification percentage. Keep bounce under 2 percent. Verified lists bounce 1.53 percent against 2.55 percent unverified, a 40 percent reduction. Gmail requires spam complaint rate under 0.30 percent and recommends staying under 0.10 percent for senders above 5,000 messages a day. | Saleshandy (above) for the bounce delta; "Email sender guidelines," Google Workspace Admin Help, for the platform requirement | https://www.saleshandy.com/blog/cold-email-statistics/ and https://support.google.com/a/answer/81126 | Saleshandy: 53.1M emails. Google: normative platform policy, not a study. | first-party study plus platform documentation | high | 2026-08-05 |
| AO-3 | Warm a new sending domain over 4 to 6 weeks before running full volume: 5 to 10 sends a day at the start, stepping up. This is the conservative end of a published range; shorter ramps are published by other vendors. | "Cold Email Benchmark Report 2026," Instantly, updated 2026-01-12, data period 2025-01-01 to 2025-12-18 | https://instantly.ai/cold-email-benchmark-report-2026 | Billions of cold email interactions across thousands of active Instantly workspaces. Aggregated and anonymized; workspace count not disclosed. | vendor content, first-party data | medium | 2026-08-05 |
| AO-4 | One operator runs 400 to 500 cold sends a day. **ANDREW OPERATOR HEURISTIC.** The mailbox constraint underneath it is sourced: Smartlead documents a safe ceiling of 30 to 50 sends per warmed mailbox per day, so 400 to 500 daily sends is roughly 10 warmed mailboxes. The per-operator throughput figure itself has no source and is not a vendor benchmark. | "How Many Cold Emails Can You Send Per Day Per Inbox," Smartlead, published 2026-07-13, for the mailbox ceiling only | https://www.smartlead.ai/blog/how-many-cold-emails-per-day | Smartlead relays Woodpecker's 20M-email analysis: 20 to 49 sends a day produced 5.7 percent reply, 50 to 99 dropped to 3.1 percent. The per-operator throughput number has no sample. | operator heuristic, with a sourced constraint | stated as judgment | 2026-08-05 |
| AO-5 | A tight 300-account list beats a loose 3,000. **ANDREW OPERATOR HEURISTIC**, corroborated in direction by two platform datasets. | Corroborated, not sourced, by Woodpecker and Saleshandy above | https://woodpecker.co/blog/cold-email-statistics/ | Woodpecker: 5.8 percent reply under 50 contacts against 2.1 percent over 1,000. Saleshandy: 15 to 20 percent under 200 prospects against 8 percent over 500. Reply rate falls monotonically with list size in both. The specific 300 number is Andrew's. | operator heuristic, with independent corroboration | stated as judgment | 2026-08-05 |

---

## Engine 02 · Product-Led Growth

| ID | Claim | Source | URL | Sample, cohort, method | Class | Confidence | Read |
|---|---|---|---|---|---|---|---|
| PLG-1 | Median free-to-paid conversion is 8 percent. Free trial without a credit card: 4 to 6 percent good, 10 to 15 percent great. Free trial requiring a card: 25 to 35 percent good. Freemium with signup: 3 to 5 percent good. | "The SaaS Conversion Report: A new look at free-to-paid conversion," ChartMogul with ProductLed and Growth Unhinged, January 2026 | https://chartmogul.com/reports/saas-conversion-report/ | 200 B2B software products. Typeform survey fielded January 2026 asking what percentage of leads or free signups convert to paying within 6 months. These are self-reported operator answers, not instrumented product data, which is why the class is survey and not industry report. | survey | medium | 2026-08-05 |
| PLG-2 | PQL-to-enterprise conversion of 10 to 25 percent. **ANDREW OPERATOR HEURISTIC.** No resolvable source reports this band. Gainsight's PQL benchmark page, the closest adjacent page found, reports only that free trials using PQLs convert 2.8x better than those that do not, and it does not support the band. Do not present 10 to 25 percent as a benchmark in any board-facing plan. | None for the claim. Gainsight, "Benchmark: Product qualified lead (PQL) conversion rates," last modified 2024-06-07, checked and does not support it | https://www.gainsight.com/resource/benchmark-product-qualified-lead-pql-conversion-rates/ (adjacent, does not support the claim) | The 10 to 25 percent band has no sample. Gainsight discloses none either: it cites the 2022 Product-Led Growth Index, whose sample is unpublished, and gates the benchmark behind a form. | operator heuristic | stated as judgment | 2026-08-05 |
| PLG-3 | Airtable runs a reverse trial: 14 days of the Pro plan, then default to Free if the user does not upgrade. Mechanism only. The article publishes no conversion lift, so attach no number to this claim. | "Reverse trials: The PLG strategy that combines freemium and free trial," Kyle Poyar, Growth Unhinged, 2026-04-23 | https://www.growthunhinged.com/p/your-guide-to-reverse-trials | Direct quote from Lauryn Isford, Head of Growth at Airtable. Single company, named practitioner, mechanism claim only. | case study | high for the mechanism, not applicable for magnitude | 2026-08-05 |
| PLG-4 | Cursor was reported at 36 percent free-to-paid, roughly ten times the freemium norm, at 360,000 paying users and $276 average annual spend by early 2025. Cursor did not publish this; GTMnow relayed it. | "Deconstructing Cursor's Growth Playbook: $4M to $2B ARR in 18 Months," Sophie Buonassisi and the GTMfund team, The GTMnow Newsletter, 2026-05-01 | https://thegtmnewsletter.substack.com/p/deconstructing-cursor-growth-playbook-4m-to-2b-arr | Single company. GTMnow attributes the 36 percent to Sacra, a third-party research firm, not to Cursor. The "ten times the norm" comparison is the author's own. A relayed estimate about a private company. | case study, third-party estimate relayed | low to medium | 2026-08-05 |
| PLG-5 | Seat velocity of 15 to 20 seats a quarter inside one account marks a company-forming signal. **ANDREW OPERATOR HEURISTIC.** No published source reports this threshold. It is a line Andrew watches, not a benchmark. | none | not applicable | No sample. | operator heuristic | stated as judgment | – |

---

## Engine 03 · Manual Outbound and Cold Calling

| ID | Claim | Source | URL | Sample, cohort, method | Class | Confidence | Read |
|---|---|---|---|---|---|---|---|
| MO-1 | Connect rate per dial is about 10 percent (measured 9.9). Connect rate per unique prospect across multiple attempts is about 25 percent (measured 24.5). | "B2B Cold Calling Benchmarks 2026: Belkins Data Study," Michael Maximoff, Belkins, 2026-06-26 | https://belkins.io/blog/cold-calling-benchmarks | 175,000+ dials placed through Belkins' Nooks dialer across calendar year 2025, plus five anonymized HubSpot campaign exports. Method fully disclosed, including an acknowledgment that campaign data skews to harder verticals. | first-party study | high | 2026-08-05 |
| MO-1b | Vendor-internal comparison: Cognism's own SDRs answered at 13.3 percent on cold calls; their AEs at 14.4 percent on warm. Cite it as a vendor ceiling, not a market average. | "State of Outbound 2026: From Volume to Precision," Cognism | https://www.cognism.com/reports/state-of-outbound-2026 | 110 AEs and SDRs across UK, US, EMEA, DACH and France. 451,895 calls, 149,376 emails, 39,679 booked meetings, 573,425 tasks. Sourced from Gong, Outreach and Salesforce. Cognism sells verified mobile data and the report covers Cognism's own team using Cognism data; the report states the data "may not generalise." | vendor content, first-party data | medium | 2026-08-05 |
| MO-2 | Belkins observed an average of three dial attempts per prospect, producing the 24.5 percent connect rate per prospect. A team that needs eight attempts has a data-quality problem, not a benchmark. | Belkins (above) | https://belkins.io/blog/cold-calling-benchmarks | 175,000+ dials, calendar 2025. | first-party study | high | 2026-08-05 |
| MO-3 | Roughly 370 dials produce one booked meeting, about 0.27 percent dial-to-meeting. Of conversations that connect, 4.6 percent produce a booked meeting. | Belkins (above) | https://belkins.io/blog/cold-calling-benchmarks | 175,000+ dials, calendar 2025, agency cold outbound. Cognism's internal team reports a far higher rate (39,679 meetings on 443,209 calls), but that pool mixes AE warm calling with SDR cold and is not comparable. | first-party study | high | 2026-08-05 |
| MO-4 | Dream-150 / T1 / T2 / T3 tier ladder. **ANDREW OPERATOR HEURISTIC**, structure borrowed from common outbound practice. No resolvable source publishes the specific tier counts. | none | not applicable | No sample. | operator heuristic | stated as judgment | – |
| MO-5 | $25K ACV floor for a rep-led motion. **ANDREW OPERATOR HEURISTIC** (mix.cjs threshold, a knob). | none | not applicable | No sample. | operator heuristic | stated as judgment | – |

---

## Engine 04 · ABM

| ID | Claim | Source | URL | Sample, cohort, method | Class | Confidence | Read |
|---|---|---|---|---|---|---|---|
| ABM-1 | Company-level visitor identification matches 30 to 65 percent of US B2B traffic, averaging near 65 percent at the top. Person-level identification matches 5 to 20 percent, averaging about 15 percent. RB2B specifically is listed at roughly 40 to 55 percent company match and 8 to 15 percent person match. Plan outreach volume off the person-level number, not the company-level one. | "Website Visitor Identification Match Rates: What Every Vendor Won't Tell You," Alan Zhao, Warmly, 2026-03-30 | https://www.warmly.ai/p/blog/visitor-identification-match-rates | Warmly production data across 9M+ monthly website visits and 1,600+ organizations. The vendor comparison table is Warmly's own compilation, not an independent audit. The author acknowledges accuracy gaps found by a Gartner auditor. | vendor content, first-party data | medium | 2026-08-05 |
| ABM-2 | 25 to 40 percent of a named account list engages within 90 days. **ANDREW OPERATOR HEURISTIC.** No resolvable source publishes an account-engagement rate like this. Demand Gen Report's 2026 ABM Benchmark Survey, the largest published ABM benchmark found this pass, carries adoption and satisfaction data only. Do not cite 25 to 40 percent as an external benchmark. | None for the claim. "2026 Account Based Marketing (ABM) Benchmark Survey Findings," James Hickey, Demand Gen Report, 2026-05-27, checked and does not support it | https://www.demandgenreport.com/blog/2026-account-based-marketing-abm-benchmark-survey-findings-abm-moves-beyond-pilot-stage-with-ai-powering-smarter-execution/52996/ (adjacent, does not support the claim) | The 25 to 40 percent figure has no sample. Demand Gen Report does not disclose respondent count on the public summary page; it reports 80 percent ABM adoption, 52 percent meeting expectations, 23 percent exceeding. | operator heuristic | stated as judgment | 2026-08-05 |
| ABM-3 | Buyers reach first vendor contact at about 61 percent of their journey, down from 69 percent a year earlier, roughly 6 to 7 weeks sooner. Average cycle length fell from 11.3 months to 10.1 months. Buying groups average 10 or more people on typical $250K deals. The vendor contacted first wins 8 times out of 10, but wins only 57 percent of the time when the buyer had no prior leader in mind. | "The B2B Buyer Experience Report for 2025," 6sense with 2X, MarketOne, LeadFabric and Green Hat | https://6sense.com/science-of-b2b/buyer-experience-report-2025/ | Nearly 4,000 survey responses plus 766 in a companion survey, approximately 4,766 buyers. Technology 42 percent, services 38 percent, manufacturing 14 percent. Median purchase cost $200K to $400K. The 57 percent finding is the honest caveat: first contact correlates with preference more than it creates it. | industry report, survey-based | high | 2026-08-05 |
| ABM-4 | $75K ACV floor for ABM. **ANDREW OPERATOR HEURISTIC** (mix.cjs threshold, a knob). | none | not applicable | No sample. | operator heuristic | stated as judgment | – |

---

## Engine 05 · Community and Partner Led

| ID | Claim | Source | URL | Sample, cohort, method | Class | Confidence | Read |
|---|---|---|---|---|---|---|---|
| CP-1 | The Wiz Integration Network reached 300 partner integrations, having moved from 100 to 200 to 300 since it launched three years earlier. These integrations feed the Wiz Security Graph as external connections; they are not features built inside the product. | "Wiz Integration Network Hits 300 Partner Integrations," Daphna Dayan, Katerina Greenstein, Tivan Bilder and Nadav Tzuker, Wiz, 2026-07-21 | https://www.wiz.io/blog/wiz-integration-network-reaches-300 | Single company, first-party announcement. | case study | high for the count, medium for the interpretation | 2026-08-05 |
| CP-2 | dbt Labs marketplace transactions grew more than 190 percent year over year. Directional evidence that the motion works, never a benchmark: a growth percentage with no denominator is a marketing number. | "dbt Labs Launches Reimagined Global Partner Ecosystem Program to Accelerate Strategic Growth," dbt Labs, 2025-08-20 | https://www.getdbt.com/blog/dbt-labs-launches-reimagined-global-partner-ecosystem-program | Single company, first-party press release. No measurement window, no absolute base, no definition of "transaction." | case study, company announcement | medium | 2026-08-05 |
| CP-3 | Channel clearing 25 percent of new business as the graduation bar. **ANDREW OPERATOR HEURISTIC.** | none | not applicable | No sample. | operator heuristic | stated as judgment | – |

---

## Engine 06 · Paid Media

| ID | Claim | Source | URL | Sample, cohort, method | Class | Confidence | Read |
|---|---|---|---|---|---|---|---|
| PM-1 | Thought Leader Ads are reported at 4.65 percent CTR and $0.51 CPC against 0.68 percent CTR and $2.42 CPC for standard LinkedIn ads. No cost-per-qualified-lead comparison is published anywhere this pass found. The CTR advantage is widely reported and comes entirely from vendors selling the format. Treat it as direction, not gospel. | "Thought Leader Ads benchmarks (2026, updated monthly)," Magnetite, last revised 2026-06-11 | https://magnetite.ai/thought-leader-ads-benchmarks | No spend volume, account count, or campaign duration disclosed. Magnetite states the figures come from Fractional Demand and ZenABM reports plus LinkedIn industry benchmarks, and warns that "headline CPC and CTR figures come from vendors whose business benefits from the format looking good." | vendor content | low | 2026-08-05 |
| PM-2 | Paid media run against a named account list shortens the sales cycle. **ANDREW OPERATOR HEURISTIC**, stated as a mechanism with no number attached. No resolvable source measures cycle acceleration from paid media. Attach no percentage to this claim. | None for paid media. Nearest adjacent published evidence is about events, not paid: "Event Marketing Statistics 2026," Vendelux, reporting 31 percent of marketers observing a 20 to 30+ day cycle decrease | https://vendelux.com/event-marketing/event-marketing-statistics (different channel, does not support the claim) | Vendelux 2026 B2B Events Survey, 120+ B2B marketing and events leaders, self-reported. Events, not paid media. The paid-media mechanism has no sample. | operator heuristic | stated as judgment | 2026-08-05 |
| PM-3 | Paid carries 5 to 15 percent of pipeline. **ANDREW OPERATOR HEURISTIC.** This is a budget-allocation opinion, not a measured share, and no resolvable source publishes it as a benchmark. | none | not applicable | No sample. | operator heuristic | stated as judgment | – |
| PM-4 | LinkedIn's hard floor is 300 members: "The minimum audience size that can be used in a campaign is 300." Maximum CSV upload is 300,000 hashed email addresses. Initial matching takes up to 48 hours. The 1,500-account working upper bound is **ANDREW OPERATOR HEURISTIC**; LinkedIn publishes no typical match rate for uploaded company lists. | "Matched Audiences Overview," LinkedIn Marketing API documentation, Microsoft Learn, li-lms-2026-02 | https://learn.microsoft.com/en-us/linkedin/marketing/matched-audiences/matched-audiences?view=li-lms-2026-02 | Normative platform documentation, not a study. | platform documentation | high for the 300 floor, stated as judgment for the 1,500 bound | 2026-08-05 |
| PM-5 | About $8K a month as the spend floor before fragmentation. **ANDREW OPERATOR HEURISTIC** (mix.cjs threshold, a knob). | none | not applicable | No sample. | operator heuristic | stated as judgment | – |
| PM-6 | Speed to lead is the highest-leverage variable in inbound routing. Odds of qualifying a lead drop 21 times between a 5-minute and a 30-minute response. Odds of contacting a lead drop 100 times over the same interval. After 20 hours, additional dials reduce the ability to contact and qualify. Cite the direction with confidence and the multipliers with a date stamp. | "MIT Lead Response Management Study," James Oldroyd PhD (MIT Sloan) and Dave Elkington (InsideSales.com), 2007-10-16 | https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf | 3 years of data across 6 companies, 15,000+ leads and 100,000+ call attempts, analyzed from InsideSales.com system data. Published 2007, so it predates the current buying environment. The co-author was the vendor's CEO, a disclosed conflict. | industry report, academic co-author | high for the effect, medium for the magnitude today | 2026-08-05 |

---

## Engine 07 · SEO and AEO

| ID | Claim | Source | URL | Sample, cohort, method | Class | Confidence | Read |
|---|---|---|---|---|---|---|---|
| SEO-1 | Versus pages are the content type most correlated with AI search traffic, at roughly double the next-best type (Spearman rank correlation 0.65). B2B sites with 21 or more comparison pages show 900 percent more median AI search sessions than sites with one to five. | "The Content That Predicts B2B AI Traffic Most: Versus Pages," Ross Hudgens, Siege Media, 2026-06-01 | https://www.siegemedia.com/research/versus-pages | 116 B2B GA4 properties, 1,112 transactional pages. Spearman rank correlation plus Pearson on log-transformed values. AI traffic from ChatGPT, Perplexity, Claude, Gemini, Copilot and Meta AI over a trailing 90 days. Carry the caveats: content explains only about 28 percent of the variance, and 53 of 116 properties had zero comparison pages detected, partly a URL-pattern limitation. | first-party study | high | 2026-08-05 |
| SEO-2 | No single universal AI-to-organic conversion multiplier is supported. For a B2B SaaS audience the figure to use is 1.05x, effectively parity. See the SEO-2 note below. | Siege Media for the B2B SaaS figure; Opollo for the IT-services figure | https://www.siegemedia.com/research/ai-traffic-conversion-rates | See the SEO-2 note below for both samples and methods. | first-party study (Siege) for 1.05x; industry report (Opollo) for the IT-services pair | high for 1.05x in B2B SaaS; medium for the Opollo pair, cohort mismatch flagged | 2026-08-05 |
| SEO-3 | AI-referred clicks commonly land in GA4 as Direct because AI platforms do not consistently pass referrer information. The mechanism is real; the magnitude is not published. Keep the self-reported attribution field on the demo form as the fix, and attach no percentage. | "How to Track, Measure, and Boost AI Referral Traffic," Carlos Silva with Christine Skopec, Semrush, 2025-09-02 | https://www.semrush.com/blog/ai-referral-traffic/ | No sample, no study, no percentage. Semrush states the mechanism as analysis, not measurement. | vendor content | high for the mechanism, not applicable for magnitude | 2026-08-05 |
| SEO-4 | Vanta's Collections architecture is the reference case: framework-specific subfolders, dense internal linking, and comparison depth. The SOC 2 Collection alone draws 10.6K organic visits a month with 475K backlinks. Collections total 22.8K monthly visits at over $177K a month in traffic value. 64.7 percent of Vanta's top-3 keyword rankings come from these subfolders. Top pages carry internal links in the thousands on a site of roughly 725 distinct pages. 2,603 of 3,620 tracked keywords trigger AI Overviews. Cite the architecture as the lesson and the numbers as approximate. | "How Vanta's $517K/month SEO Moat Translates Into AI Visibility," Nathan Ojaokomo, Foundation Marketing, 2026-07-16 | https://foundationinc.co/lab/vanta-breakdown | Single company. All traffic and keyword figures are Ahrefs third-party estimates, not Vanta first-party analytics. | case study, third-party estimated data | medium | 2026-08-05 |

### SEO-2 note: AI-referred conversion rates

Two datasets, both read on 2026-08-05, measure different cohorts.
Neither supports a universal multiplier.

**Siege Media, the segment-matched figure.** "AI Traffic Conversion
Rates: Are They Really 7x Better?" by Marianna Mankle, published
2026-06-30, at
https://www.siegemedia.com/research/ai-traffic-conversion-rates.
Siege screened over 120 properties and kept 78 websites with
AI-referral traffic and usable conversion tracking. Data came from
first-party GA4 accounts between 2026-01-01 and 2026-05-31, using GA4
session KeyEventRate as the conversion metric. Inclusion required at
least 250 AI sessions and 1,000 organic sessions with non-zero
conversions on both channels. Ratios above 3x were grouped to stop a
single outlier from moving a category. Result: AI-referred visitors
converted at 1.26x traditional traffic overall. By category: Finance
1.67x, Consumer and local services 1.29x, Travel and real estate 1.27x,
**B2B SaaS 1.05x**, E-commerce 1.01x. AI traffic was 0.2 to 3 percent
of total sessions on most sites.

**Opollo, a different funnel.** "The 2026 AI Search Benchmark Report,"
Steven Morey, published 2026-02-22 and modified 2026-03-08, at
https://opollo.com/blog/the-2026-ai-search-benchmark-report/, states
"AI visitors converted at an average rate of 14.2%. Google's organic
traffic conversion rate was 2.8%." Sample: 312 IT and technology
services firms across North America, Australia and the UK, from $2M
regional MSPs to $80M cybersecurity consultancies. Period: January 2025
through January 2026. Conversion was defined as qualified enquiries
only, meaning booked consultations, demo requests and validated contact
submissions, from GA4 referral data plus CRM attribution with manual
traffic classification. Firms under 10 AI sessions a month were
excluded and outliers above 35 percent were removed.

**What to cite.** For a B2B SaaS reader, use Siege Media's 1.05x. It is
the only figure segment-matched to this audience, measured on
first-party GA4 with disclosed inclusion rules, and published by a party
with no product to sell against the result. The 14.2 versus 2.8 pair is
real and traceable to Opollo, but Opollo's cohort is IT services and
MSPs selling consulting engagements, where a conversion is a booked
consultation. That is a different funnel with a different denominator.

**The operating statement.** AI referral volume is small, roughly 0.2 to
3 percent of sessions, and its conversion advantage over organic ranges
from parity in B2B SaaS to about 1.7x in finance depending on segment.
Anyone quoting a single multiplier above 2x for B2B SaaS is quoting a
retail or IT-services cohort. Instrument AI referrals because the
segment is growing and because versus-page architecture (SEO-1) pays on
both surfaces, not because the traffic converts five times better. It
does not. The attribution chain behind the widely repeated 14.2 versus
2.8 relay is documented in [EVIDENCE-AUDIT.md](EVIDENCE-AUDIT.md).

---

## Engine 08 · Social Content

| ID | Claim | Source | URL | Sample, cohort, method | Class | Confidence | Read |
|---|---|---|---|---|---|---|---|
| SC-1 | Personal LinkedIn profiles outperform company pages on engagement rate: 2.60 percent against 1.74 percent, roughly a 1.5x advantage. Impressions per post are effectively equal (817.67 against 812.64). Individuals also post more often, 3.05 times a week against 2.74. The direction is well established; the often-quoted 3x to 5x magnitude is not. | "2026 LinkedIn Statistics for Social Media Marketers," Metricool, published 2026-04-23, updated 2026-05-22 | https://metricool.com/linkedin-statistics/ | Metricool 2026 LinkedIn Study and 2026 Social Media Study. Sample size not disclosed on the public page. Cross-account platform data. The widely cited 5x figure from Refine Labs (https://www.refinelabs.com/article/personal-linkedin-engagement-vs-company-page) is from 2023 and compares 7 employees against one company page at a single agency. | vendor content, first-party platform data | medium | 2026-08-05 |
| SC-2 | Founder-led content programs roughly triple inbound conversations within 60 days. **ANDREW OPERATOR HEURISTIC.** No resolvable source reports this. Keep it out of board-facing plans and never present it as a benchmark. | none | not applicable | No sample. | operator heuristic | stated as judgment | – |
| SC-3 | Inbound closes an order of magnitude better than cold. **ANDREW OPERATOR HEURISTIC.** No resolvable source supports the magnitude. This is entirely Andrew's number. | none | not applicable | No sample. | operator heuristic | stated as judgment | – |

---

## Engine 09 · Events

| ID | Claim | Source | URL | Sample, cohort, method | Class | Confidence | Read |
|---|---|---|---|---|---|---|---|
| EV-1 | RSAC Conference 2026 drew 43,500+ attendees, 600+ exhibitors, 700+ speakers across 570+ sessions, from more than 100 countries. The working reduction to "under 2,000 real targets" is **ANDREW OPERATOR HEURISTIC**: it depends entirely on the ICP filter and no source publishes it. | "RSAC Conference Closes 35th Annual Flagship Event Backed by The Power of Community," RSA Conference LLC, 2026-03-27 | https://www.rsaconference.com/library/press-release/2026-closing-release | Official event organizer figures. The target-count reduction has no sample. | first-party announcement, with an operator heuristic on the reduction | high for attendance, stated as judgment for the reduction | 2026-08-05 |
| EV-2 | Session-specific pre-event outreach replies far better than generic pre-event outreach. **ANDREW OPERATOR HEURISTIC.** No resolvable source reports a 2 percent versus 10 percent pair, or any pre-event outreach reply rate. Attach no numbers to this claim. The underlying personalization effect is separately measured in a different channel by AO-1 (Woodpecker: 17 to 18 percent with advanced personalization against 7 to 9 percent basic). | None for the claim. "Event Marketing Statistics 2026," Stefan Deeran, Vendelux, 2026-05-27 updated 2026-06-16, checked and publishes no pre-event outreach reply rates | https://vendelux.com/event-marketing/event-marketing-statistics (checked, does not support the claim) | Vendelux 2026 B2B Events Survey, 120+ B2B marketing and events leaders. The reply-rate pair has no sample. | operator heuristic | stated as judgment | 2026-08-05 |
| EV-3 | Published cost per qualified opportunity from events: $5,000 to $15,000 for disciplined programs, $10,000 to $25,000 for average programs. Cost per qualified meeting: $1,500 to $3,000 for a high-density Tier 1 sponsorship with full motion, $1,000 to $3,000 for curated dinners. Cost is cut by program discipline, not by booth versus pre-book. Andrew's $2.5K to $5K per opportunity target sits below every published band and is **ANDREW OPERATOR HEURISTIC**. | "B2B Event Marketing Benchmarks: The Operator's Reference," Stefan Deeran, Vendelux, published 2026-05-27, modified 2026-06-16 | https://vendelux.com/event-marketing/b2b-event-marketing-benchmarks | Over 2,500 B2B buyer conversations across 30 months plus aggregated program data from teams running events at scale. Per-metric sample sizes, company counts and total spend are not disclosed. | vendor content, operator-aggregated | medium | 2026-08-05 |
| EV-4 | Pre-book at least half the meetings before a show. **ANDREW OPERATOR HEURISTIC.** No source publishes a pre-booking rate. Vendelux reports pre-booked meetings in absolute terms only, 80 to 200 per major show. Run the rule because it works; do not cite it as a benchmark and do not attach a reference program to it. | Vendelux (above) for the absolute counts only | https://vendelux.com/event-marketing/b2b-event-marketing-benchmarks | See EV-3. The 50 percent rule has no sample. | operator heuristic, with a sourced absolute count | stated as judgment | 2026-08-05 |
| EV-5 | Curated dinners beat Tier 1 sponsorships on cost per qualified meeting, and the host's title drives acceptance. **ANDREW OPERATOR HEURISTIC** on both halves. Vendelux prices dinners at $1,000 to $3,000 per qualified meeting against $1,500 to $3,000 for Tier 1 sponsorship, so the bands overlap and dinners are at best cheaper, at worst equal. Reading that overlap as an advantage is Andrew's call. No source addresses host title at all. | Vendelux (above) for the two price bands only | https://vendelux.com/event-marketing/b2b-event-marketing-benchmarks | See EV-3. Vendelux explicitly does not compare booth-led against targeted programs. The host-title claim has no sample. | operator heuristic, with a sourced price band | stated as judgment | 2026-08-05 |
| EV-6 | 24-hour hot-lead and 48-hour full follow-up SLA. **ANDREW OPERATOR HEURISTIC.** The specific hour lines are Andrew's; the decay curve underneath them is measured in PM-6. | MIT Lead Response Management Study (see PM-6) | https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf | 6 companies, 15,000+ leads, 100,000+ call attempts, 2007. The 24 and 48 hour lines have no sample. | operator heuristic, with a sourced decay curve | stated as judgment | 2026-08-05 |
| EV-7 | Event-touched deals convert from creation to closed-won at 12.1 percent for live events and 13.8 percent for virtual, against 11.1 percent for other channels. Events produce about 6.5 percent of closed deals on far fewer created deals (live 64,240 and virtual 42,987 against 1.6 million for other channels). Events are a small share of created pipeline that closes at a modestly better rate. | "The State of Event Marketing in 2025 So Far," Amulya Vadrevu, HockeyStack Labs, 2025-11-06 | https://www.hockeystack.com/lab-blog-posts/the-state-of-event-marketing-in-2025-so-far | 2,642,337 deals with event touchpoints across 198 B2B SaaS companies, January 2024 to September 2025, North America and Europe. Linear attribution, equal credit across touchpoints, a disclosed modeling choice that flatters multi-touch channels. | first-party study | high | 2026-08-05 |

---

## Model constants (all Andrew's operating model)

These are not benchmarks and were never presented as such. They are the
knobs in the model, tested for reproducibility in `engine/`.

| ID | Constant | Where | Class | External context |
|---|---|---|---|---|
| CAP-1 | Funnel: 16 percent meeting-to-qual, 27 percent qual-to-POV, 81 percent POV-to-win | engine.cjs FUNNEL | **ANDREW OPERATOR HEURISTIC**, tested for reproducibility | none directly comparable |
| CAP-2 | Steady-state anchor: $1.0M per ramped AE at $120K ACV on a 178-day cycle | engine.cjs ANCHOR | **ANDREW OPERATOR HEURISTIC**, tested | Optifai's 939-company pipeline study puts the overall B2B SaaS median cycle at 84 days and enterprise above $100K ACV at 90 to 180+ days. At $120K ACV, 178 days sits at the long end of the published enterprise band but inside it. https://optif.ai/learn/questions/sales-cycle-length-benchmark/ (updated 2026-04-20, Q2 2025 to Q1 2026, CRM timestamp analysis of won deals, 25th to 75th percentile ranges, read 2026-08-05). Lightly corroborated. |
| CAP-3 | Ramp vector: $0 / $125K / $225K / $250K per tenure quarter | engine.cjs RATES x profile | **ANDREW OPERATOR HEURISTIC**, tested | Lative reports 9 to 12 months to 80 percent of quota for enterprise, 5 to 7 for mid-market, 3 to 4 for SMB, with no sample size disclosed. https://lative.ai/blog/sales-ramp-time/ (2026-06-03, read 2026-08-05). A four-quarter ramp to full productivity is consistent with the enterprise band. Directionally corroborated, not validated. |
| CAP-4 | 30 percent haircut from gross capacity to net-new ARR | engine.cjs DEFAULTS.adv.haircut | **ANDREW OPERATOR HEURISTIC** | none found |
| CAP-5 | Support ratios: 2.5 AEs per SE and per BDR; leadership thresholds | engine.cjs DEFAULTS.adv | **ANDREW OPERATOR HEURISTIC** | none found |
| MIX-1 | 85/15 run/instrument budget split and every ACV or cash threshold | mix.cjs | **ANDREW OPERATOR HEURISTIC**, knobs by design | none found |
| MIX-2 | CAC ordering used to sequence investment: PLG cheapest at scale, then community and partner led, then SEO and AEO | Framing only, in the portfolio card and the engine reference. Not encoded in mix.cjs and it drives no verdict | **ANDREW OPERATOR HEURISTIC**, an operator ranking | none. No study ranks these engines on CAC. Cost basis below |

### MIX-2 cost basis

The ranking is marginal cash cost per new customer and nothing else.
Marginal cash means the incremental dollars leaving the bank account to
acquire the next customer through that engine: media spend, tooling,
data, agency fees, event costs.

The basis excludes product engineering to build and maintain the
self-serve motion, founder time, editorial and design labor, and the
cost of owning a community. Those are real costs and on the three
engines this ranking calls cheap they are usually the largest line. Load
them back in and the ordering can invert.

This is an operator ranking Andrew uses to decide what to instrument
first. It is not a measured CAC study, no source measures it, and none
is claimed. Treat it as a hypothesis about sequencing, not a finding
about cost.

**Kill criterion.** Price each engine fully loaded once a quarter:
marginal cash plus the salaried and founder hours it consumed, divided
by new customers attributed to it. If a fully loaded engine in the
cheap three costs more per new customer than the funded outbound
engines for two consecutive quarters, the ranking is wrong for that
company. Change the mix and record the override.

### Operating hypotheses behind the portfolio shorthand

The playbook cards use compressed phrases for these three engines. Each
phrase reduces to a falsifiable hypothesis with a kill criterion. State
the hypothesis in any board-facing plan; the shorthand is shorthand.

**Founder-led social is cheap, not free.** Hypothesis: the engine runs
on founder time of 3 to 5 hours a week plus tooling under $500 a month,
with no paid media and no agency. Kill criterion: if holding the cadence
needs a paid ghostwriter or editor, or more than 8 founder hours a week
for two consecutive months, stop calling it cheap. Price the founder
hours at a loaded rate, compare cost per booked meeting against the
funded paid engine, and cut whichever loses.

**SEO compounds for a bounded period, it does not pay forever.**
Hypothesis: a published page keeps producing qualified sessions for at
least 12 months after its last edit without incremental cash spend. Kill
criterion: if median qualified sessions per page in a cohort fall more
than half within two quarters of the last edit, or if holding position
requires a refresh cycle costing more than the original page, the
engine is recurring editorial spend and should be budgeted as such.

**Steady cadence is a testable bet against bursts.** Hypothesis: three
posts a week held for a full quarter produces more inbound conversations
than the same total post count published in bursts. Kill criterion: run
both arms in the same lane for one quarter. If the burst arm books equal
or more first meetings, drop the cadence rule.

---

## What this registry does not claim

None of these figures are predictions for your company. The studies
describe other cohorts in other periods; the heuristics describe how
Andrew operates. Samples are disclosed above so a reader can judge
weight rather than take a number on faith. Validate against your own
funnel before building a forecast on any of them.

For what these claims used to say, which sources failed, and why each
demotion happened, read [EVIDENCE-AUDIT.md](EVIDENCE-AUDIT.md).
