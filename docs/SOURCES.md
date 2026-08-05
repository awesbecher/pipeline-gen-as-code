# Benchmark source registry

Every quantitative claim in this repository is indexed here with a
source, a sample, a method, an evidence class, and a confidence rating.
Claims with no external source are labeled ANDREW OPERATOR HEURISTIC:
numbers Andrew Wesbecher uses to run pipeline, offered as defensible
starting points, not published research.

**Verification pass: 2026-08-05.** Every URL in this file was fetched
successfully on that date and the numbers below were read off the page,
not off a summary of the page. Rows marked UNVERIFIED had no resolvable
primary source; each one carries either a specific replacement source
or a demotion to operator heuristic. No URL in this file was inferred,
reconstructed, or guessed.

## Evidence classes

| Class | Meaning |
|---|---|
| first-party study | The publisher analyzed its own platform or CRM data and disclosed sample size, period, and inclusion rules |
| industry report | Aggregated data across many companies, published by a named organization, sample disclosed |
| survey | Self-reported answers from named respondents; subject to recall and selection bias |
| vendor content | A tool vendor's playbook or benchmark page, often with the vendor's own product in the numerator |
| case study | A named company's published result, single instance |
| operator heuristic | Andrew's operating number. No external source. Argue with it; it is a knob |

## How to read confidence

**high** means a disclosed sample, a disclosed method, and no obvious
incentive for the publisher to inflate the number. **medium** means one
of those three is missing or the publisher sells against the number.
**low** means the number is directionally useful and quantitatively
unsupported. **stated as judgment** means it is Andrew's number and is
not offered as evidence at all.

## What changed in this pass

Eleven claims failed verification and have been demoted or rewritten.
Six claims were verified but at a materially different magnitude than
the prior registry stated. Those are called out inline in the Correction
column. Two of the corrections matter enough for a board conversation:
dial-to-meeting (MO-3) was off by roughly a factor of ten, and visitor
deanonymization (ABM-1) conflated company-level match with person-level
match.

Every market statistic expires for planning purposes on 2027-08-05 and
should be revalidated before reuse.

---

## Engine 01 · Automated Outbound

| ID | Claim as verified | Source | URL | Sample, cohort, method | Class | Confidence | Correction |
|---|---|---|---|---|---|---|---|
| AO-1 | Cold email reply rate is a function of list size and personalization depth, not send volume. Advanced personalization runs 17 to 18 percent reply; basic or none runs 7 to 9 percent. Campaigns under 50 contacts average 5.8 percent; campaigns over 1,000 contacts average 2.1 percent. Platform-wide average is 3.43 percent. | "Cold Email Statistics Based on Sending Over 20M Cold Emails," Margaret Sikora, Woodpecker, published 2026-02-24, updated 2026-06-23 | https://woodpecker.co/blog/cold-email-statistics/ | Over 20 million emails sent through the Woodpecker platform. First-party platform data, method disclosed, reply classification described. | first-party study | high | Prior registry cited an unresolvable vendor domain and a 6 to 12 percent band. The band is real at the top of the distribution but is not the average. |
| AO-1b | Corroborating dataset: average cold email reply rate 3.7 percent; hyper-personalized campaigns under 200 prospects reach 15 to 20 percent while campaigns over 500 prospects sit near 8 percent. | "13 Cold Email Statistics 2026 (Based on Analyzing 53M+ Cold Emails)," Dhruv Patel, Saleshandy, published 2026-06-07, updated 2026-08-04 | https://www.saleshandy.com/blog/cold-email-statistics/ | 53.1 million cold emails and 60,000 sequences sent through Saleshandy, January to June 2026, across Google Workspace, Microsoft 365, Zoho, custom SMTP and Azure. Reply classification by AI, method disclosed. | first-party study | high | Second independent platform confirms the list-size effect. Two platforms, 73 million emails, same direction. |
| AO-2 | The operating bar is bounce rate, not a verification percentage. Keep bounce under 2 percent. Verified lists bounce 1.53 percent against 2.55 percent unverified, a 40 percent reduction. Gmail requires spam complaint rate under 0.30 percent and recommends staying under 0.10 percent for senders above 5,000 messages a day. | Saleshandy (above) for the bounce delta; "Email sender guidelines," Google Workspace Admin Help, for the platform requirement | https://www.saleshandy.com/blog/cold-email-statistics/ and https://support.google.com/a/answer/81126 | Saleshandy: 53.1M emails. Google: normative platform policy, not a study. | first-party study plus platform policy | high | Prior claim of "verifies emails at 95 percent plus" was sourced to an unresolvable domain and sets a bar that still permits a 5 percent bounce, which is above the deliverability line. Cite the bounce bar instead. |
| AO-3 | Warm a new sending domain over 4 to 6 weeks before running full volume: 5 to 10 sends a day at the start, stepping up. | "Cold Email Benchmark Report 2026," Instantly, updated 2026-01-12, data period 2025-01-01 to 2025-12-18 | https://instantly.ai/cold-email-benchmark-report-2026 | Billions of cold email interactions across thousands of active Instantly workspaces. Aggregated and anonymized; workspace count not disclosed. | vendor content, first-party data | medium | Verified at the stated 4 to 6 weeks. Smartlead's independent guidance is 2 to 3 weeks of pure warmup then a ramp to full volume by week 4, so 4 to 6 weeks is the conservative end of a real range. |
| AO-4 | UNVERIFIED as an external benchmark. Reframed: at Smartlead's documented safe ceiling of 30 to 50 sends per warmed mailbox per day, 400 to 500 daily sends is roughly 10 mailboxes. The mailbox math is sourced; the one-operator throughput figure is not. **ANDREW OPERATOR HEURISTIC.** | "How Many Cold Emails Can You Send Per Day Per Inbox," Smartlead, published 2026-07-13, for the mailbox ceiling only | https://www.smartlead.ai/blog/how-many-cold-emails-per-day | Smartlead cites Woodpecker's 20M-email analysis: 20 to 49 sends a day produced 5.7 percent reply, 50 to 99 dropped to 3.1 percent. The per-operator throughput number has no source. | operator heuristic, with a sourced constraint | stated as judgment | Prior registry presented 400 to 500 sends per operator as a vendor benchmark. It is not one. The mailbox constraint underneath it is real. |
| AO-5 | A tight 300-account list beats a loose 3,000. **ANDREW OPERATOR HEURISTIC.** | Corroborated, not sourced, by Woodpecker and Saleshandy above | https://woodpecker.co/blog/cold-email-statistics/ | Woodpecker: 5.8 percent reply under 50 contacts against 2.1 percent over 1,000. Saleshandy: 15 to 20 percent under 200 prospects against 8 percent over 500. | operator heuristic | stated as judgment, now with independent corroboration | Upgraded from bare assertion. Two platform datasets show reply rate falling monotonically with list size. |

---

## Engine 02 · Product-Led Growth

| ID | Claim as verified | Source | URL | Sample, cohort, method | Class | Confidence | Correction |
|---|---|---|---|---|---|---|---|
| PLG-1 | Median free-to-paid conversion is 8 percent. Free trial without a credit card: 4 to 6 percent good, 10 to 15 percent great. Free trial requiring a card: 25 to 35 percent good. Freemium with signup: 3 to 5 percent good. | "The SaaS Conversion Report: A new look at free-to-paid conversion," ChartMogul with ProductLed and Growth Unhinged, January 2026 | https://chartmogul.com/reports/saas-conversion-report/ | 200 B2B software products. Typeform survey fielded January 2026 asking what percentage of leads or free signups convert to paying within 6 months. | survey | medium | Verified at 8 percent. Downgraded from "industry report" to "survey": these are self-reported operator answers, not instrumented product data. That matters for a board reader. |
| PLG-2 | UNVERIFIED. No resolvable primary source reports a 10 to 25 percent PQL-to-enterprise conversion band. The prior citation domain does not resolve. Gainsight's PQL benchmark page reports only that free trials using PQLs convert 2.8x better than those that do not, sourced to the 2022 Product-Led Growth Index, with no sample disclosed and the benchmark itself behind a form. **Recommendation: demote to ANDREW OPERATOR HEURISTIC and strip the implied external authority.** | "Benchmark: Product qualified lead (PQL) conversion rates," Gainsight, last modified 2024-06-07 (the closest resolvable adjacent source, and it does not support the claim) | https://www.gainsight.com/resource/benchmark-product-qualified-lead-pql-conversion-rates/ | Not disclosed. Cites Product-Led Growth Index 2022; sample not published. | vendor content | low | The 10 to 25 percent band should not be cited as a benchmark in any board-facing plan. |
| PLG-3 | Airtable runs a reverse trial: 14 days of the Pro plan, then default to Free if the user does not upgrade. | "Reverse trials: The PLG strategy that combines freemium and free trial," Kyle Poyar, Growth Unhinged, 2026-04-23 | https://www.growthunhinged.com/p/your-guide-to-reverse-trials | Direct quote from Lauryn Isford, Head of Growth at Airtable. Single company, named practitioner, mechanism claim only. | case study | high for the mechanism, not applicable for magnitude | Verified. Note that the article publishes no conversion lift for reverse trials. Do not attach a number to this claim. |
| PLG-4 | Cursor was reported at 36 percent free-to-paid, roughly ten times the freemium norm, at 360,000 paying users and $276 average annual spend by early 2025. | "Deconstructing Cursor's Growth Playbook: $4M to $2B ARR in 18 Months," Sophie Buonassisi and the GTMfund team, The GTMnow Newsletter, 2026-05-01 | https://thegtmnewsletter.substack.com/p/deconstructing-cursor-growth-playbook-4m-to-2b-arr | Single company. GTMnow attributes the 36 percent to Sacra, a third-party research firm, not to Cursor. The "ten times the norm" comparison is the author's own. | case study, third-party estimate relayed | low to medium | Verified that GTMnow published it. Not verified that Cursor published it. This is a relayed estimate about a private company and should be cited as such. |
| PLG-5 | UNVERIFIED. No resolvable source reports seat velocity of 15 to 20 seats a quarter as a company-forming signal. The prior citation domain does not resolve. **Recommendation: demote to ANDREW OPERATOR HEURISTIC.** | none found | not applicable | not applicable | operator heuristic | stated as judgment | Remove the implied external authority. This is a threshold Andrew watches, not a published signal. |

---

## Engine 03 · Manual Outbound and Cold Calling

| ID | Claim as verified | Source | URL | Sample, cohort, method | Class | Confidence | Correction |
|---|---|---|---|---|---|---|---|
| MO-1 | Connect rate per dial is about 10 percent. Connect rate per unique prospect across multiple attempts is about 25 percent. | "B2B Cold Calling Benchmarks 2026: Belkins Data Study," Michael Maximoff, Belkins, 2026-06-26 | https://belkins.io/blog/cold-calling-benchmarks | 175,000+ dials placed through Belkins' Nooks dialer across calendar year 2025, plus five anonymized HubSpot campaign exports. Method fully disclosed, including an acknowledgment that campaign data skews to harder verticals. | first-party study | high | **Corrected.** Prior claim said "average connect rate about 5 percent; top quartile 13 on verified mobiles" and attributed it to Cognism. Cognism publishes neither a 5 percent average nor a top-quartile split. Belkins measures 9.9 percent per dial and 24.5 percent per prospect. |
| MO-1b | Vendor-internal comparison: Cognism's own SDRs answered at 13.3 percent on cold calls; their AEs at 14.4 percent on warm. | "State of Outbound 2026: From Volume to Precision," Cognism | https://www.cognism.com/reports/state-of-outbound-2026 | 110 AEs and SDRs across UK, US, EMEA, DACH and France. 451,895 calls, 149,376 emails, 39,679 booked meetings, 573,425 tasks. Sourced from Gong, Outreach and Salesforce. | vendor content, first-party data | medium | Cognism sells verified mobile data and this is a report on Cognism's own team using Cognism data. The report says so: "All data reflects Cognism's internal outbound teams and may not generalise." Cite it as a vendor ceiling, not a market average. |
| MO-2 | Belkins observed an average of three dial attempts per prospect, producing a 24.5 percent connect rate per prospect. | Belkins (above) | https://belkins.io/blog/cold-calling-benchmarks | 175,000+ dials, calendar 2025. | first-party study | high | **Corrected.** Prior claim of "about eight attempts to reach one person" has no resolvable source. The measured figure is three. If a team needs eight, that is a data-quality finding, not a benchmark. |
| MO-3 | Roughly 370 dials produce one booked meeting, about 0.27 percent dial-to-meeting. Of conversations that connect, 4.6 percent produce a booked meeting. | Belkins (above) | https://belkins.io/blog/cold-calling-benchmarks | 175,000+ dials, calendar 2025, agency cold outbound. | first-party study | high | **Corrected, and this is the largest error in the prior registry.** Prior claim said dial-to-meeting runs 2 to 3 percent, coached teams 5 to 8 percent. Measured cold outbound is about 0.27 percent, roughly ten times lower. Cognism's internal team shows a far higher rate (39,679 meetings on 443,209 calls) but that pool mixes AE warm calling with SDR cold. Any plan built on 2 to 3 percent dial-to-meeting will overstate cold-calling capacity by an order of magnitude. |
| MO-4 | Dream-150 / T1 / T2 / T3 tier ladder. **ANDREW OPERATOR HEURISTIC**, structure borrowed from common outbound practice. | No resolvable primary source for the specific tier counts. | not applicable | not applicable | operator heuristic | stated as judgment | Prior registry credited an unresolvable vendor domain. The structure is Andrew's; the label is now honest. |
| MO-5 | $25K ACV floor for a rep-led motion. **ANDREW OPERATOR HEURISTIC** (mix.js threshold, a knob). | none | not applicable | not applicable | operator heuristic | stated as judgment | Unchanged. |

---

## Engine 04 · ABM

| ID | Claim as verified | Source | URL | Sample, cohort, method | Class | Confidence | Correction |
|---|---|---|---|---|---|---|---|
| ABM-1 | Company-level visitor identification matches 30 to 65 percent of US B2B traffic, averaging near 65 percent at the top. Person-level identification matches 5 to 20 percent, averaging about 15 percent. RB2B specifically is listed at roughly 40 to 55 percent company match and 8 to 15 percent person match. | "Website Visitor Identification Match Rates: What Every Vendor Won't Tell You," Alan Zhao, Warmly, 2026-03-30 | https://www.warmly.ai/p/blog/visitor-identification-match-rates | Warmly production data across 9M+ monthly website visits and 1,600+ organizations. Vendor comparison table is Warmly's own compilation, not an independent audit. The author acknowledges accuracy gaps found by a Gartner auditor. | vendor content, first-party data | medium | **Corrected, and materially.** Prior claim said "RB2B-class tools resolve 40 to 70 percent of B2B office traffic." That number is the company-level match rate. RB2B is a person-level tool and resolves 8 to 15 percent. Planning outreach volume off 40 to 70 percent person-level resolution will overstate reachable contacts by four to seven times. |
| ABM-2 | UNVERIFIED. No resolvable source reports that 25 to 40 percent of a named account list engages within 90 days. Demand Gen Report's 2026 ABM Benchmark Survey, the largest published ABM benchmark this pass found, publishes adoption and satisfaction data but no account-engagement rate. **Recommendation: demote to ANDREW OPERATOR HEURISTIC.** | "2026 Account Based Marketing (ABM) Benchmark Survey Findings," James Hickey, Demand Gen Report, 2026-05-27 (checked and does not support the claim) | https://www.demandgenreport.com/blog/2026-account-based-marketing-abm-benchmark-survey-findings-abm-moves-beyond-pilot-stage-with-ai-powering-smarter-execution/52996/ | Respondent count not disclosed on the public summary page. Reports 80 percent ABM adoption, 52 percent meeting expectations, 23 percent exceeding. | survey | low | Do not cite 25 to 40 percent as an external benchmark. |
| ABM-3 | Buyers reach first vendor contact at about 61 percent of their journey, down from 69 percent a year earlier, roughly 6 to 7 weeks sooner. Average cycle length fell from 11.3 months to 10.1 months. Buying groups average 10 or more people on typical $250K deals. The vendor contacted first wins 8 times out of 10, but wins only 57 percent of the time when the buyer had no prior leader in mind. | "The B2B Buyer Experience Report for 2025," 6sense with 2X, MarketOne, LeadFabric and Green Hat | https://6sense.com/science-of-b2b/buyer-experience-report-2025/ | Nearly 4,000 survey responses plus 766 in a companion survey, approximately 4,766 buyers. Technology 42 percent, services 38 percent, manufacturing 14 percent. Median purchase cost $200K to $400K. | industry report, survey-based | high | Verified and strengthened. This replaces the vague "awareness-stage operating system" citation with a specific, large, disclosed dataset. The 57 percent finding is the honest caveat: first contact correlates with preference more than it creates it. |
| ABM-4 | $75K ACV floor for ABM. **ANDREW OPERATOR HEURISTIC** (mix.js threshold, a knob). | none | not applicable | not applicable | operator heuristic | stated as judgment | Unchanged. |

---

## Engine 05 · Community and Partner Led

| ID | Claim as verified | Source | URL | Sample, cohort, method | Class | Confidence | Correction |
|---|---|---|---|---|---|---|---|
| CP-1 | The Wiz Integration Network reached 300 partner integrations, having moved from 100 to 200 to 300 since it launched three years earlier. | "Wiz Integration Network Hits 300 Partner Integrations," Daphna Dayan, Katerina Greenstein, Tivan Bilder and Nadav Tzuker, Wiz, 2026-07-21 | https://www.wiz.io/blog/wiz-integration-network-reaches-300 | Single company, first-party announcement. | case study | high for the count, medium for the interpretation | Verified with a direct URL and a date. One nuance the prior card missed: these integrations feed the Wiz Security Graph as external connections, they are not features built inside the product. |
| CP-2 | dbt Labs marketplace transactions grew more than 190 percent year over year. | "dbt Labs Launches Reimagined Global Partner Ecosystem Program to Accelerate Strategic Growth," dbt Labs, 2025-08-20 | https://www.getdbt.com/blog/dbt-labs-launches-reimagined-global-partner-ecosystem-program | Single company, first-party press release. No measurement window, no absolute base, no definition of "transaction." | case study, company announcement | medium | Verified verbatim. A growth percentage with no denominator is a marketing number. Cite it as directional evidence that the motion works, never as a benchmark. |
| CP-3 | Channel clearing 25 percent of new business as the graduation bar. **ANDREW OPERATOR HEURISTIC.** | none | not applicable | not applicable | operator heuristic | stated as judgment | Unchanged. |

---

## Engine 06 · Paid Media

| ID | Claim as verified | Source | URL | Sample, cohort, method | Class | Confidence | Correction |
|---|---|---|---|---|---|---|---|
| PM-1 | Thought Leader Ads are reported at 4.65 percent CTR and $0.51 CPC against 0.68 percent CTR and $2.42 CPC for standard LinkedIn ads. No cost-per-qualified-lead comparison is published anywhere this pass found. | "Thought Leader Ads benchmarks (2026, updated monthly)," Magnetite, last revised 2026-06-11 | https://magnetite.ai/thought-leader-ads-benchmarks | No spend volume, account count, or campaign duration disclosed. Magnetite states the figures come from Fractional Demand and ZenABM reports plus LinkedIn industry benchmarks, and warns that "headline CPC and CTR figures come from vendors whose business benefits from the format looking good." | vendor content | low | **Reworded.** Prior claim asserted "roughly double the click-through at about half the cost per qualified lead." The CTR gap in the published data is about seven times, not two, and no CPL figure exists at all. The honest version: the CTR advantage is widely reported and comes entirely from vendors selling the format. Treat as direction, not gospel, which is what the source itself recommends. |
| PM-2 | UNVERIFIED. No resolvable source supports a 15 to 30 percent sales-cycle acceleration from paid media run against a named list. The closest published cycle-compression evidence is for events, not paid. **Recommendation: strike the number and state the mechanism qualitatively, or demote to ANDREW OPERATOR HEURISTIC.** | Nearest adjacent evidence, which is about events and not paid: Vendelux "Event Marketing Statistics 2026," reporting 31 percent of marketers observing a 20 to 30+ day cycle decrease | https://vendelux.com/event-marketing/event-marketing-statistics | Vendelux 2026 B2B Events Survey, 120+ B2B marketing and events leaders. Self-reported. | survey | low | Do not cite 15 to 30 percent for paid media. |
| PM-3 | UNVERIFIED. No resolvable source supports "paid carries 5 to 15 percent of pipeline" as a benchmark. The prior citation domain does not resolve. **Recommendation: demote to ANDREW OPERATOR HEURISTIC** (it is a budget-allocation opinion, not a measured share). | none | not applicable | not applicable | operator heuristic | stated as judgment | Strip the implied external authority. |
| PM-4 | LinkedIn's hard floor is 300 members: "The minimum audience size that can be used in a campaign is 300." Maximum CSV upload is 300,000 hashed email addresses. Initial matching takes up to 48 hours. | "Matched Audiences Overview," LinkedIn Marketing API documentation, Microsoft Learn, li-lms-2026-02 | https://learn.microsoft.com/en-us/linkedin/marketing/matched-audiences/matched-audiences?view=li-lms-2026-02 | Normative platform documentation, not a study. | platform documentation | high for the 300 floor | Verified against LinkedIn's own docs, which is stronger than the prior vendor citation. The 1,500-account upper bound in the prior claim has no source and is **ANDREW OPERATOR HEURISTIC**. LinkedIn publishes no typical match rate for uploaded company lists. |
| PM-5 | About $8K a month as the spend floor before fragmentation. **ANDREW OPERATOR HEURISTIC** (mix.js threshold, a knob). | none | not applicable | not applicable | operator heuristic | stated as judgment | Unchanged. |
| PM-6 | Speed to lead is the highest-leverage variable in inbound routing. Odds of qualifying a lead drop 21 times between a 5-minute and a 30-minute response. Odds of contacting a lead drop 100 times over the same interval. After 20 hours, additional dials reduce the ability to contact and qualify. | "MIT Lead Response Management Study," James Oldroyd PhD (MIT Sloan) and Dave Elkington (InsideSales.com), 2007-10-16 | https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf | 3 years of data across 6 companies, 15,000+ leads and 100,000+ call attempts, analyzed from InsideSales.com system data. | industry report, academic co-author | high for the effect, medium for the magnitude today | **Upgraded source.** Prior registry cited an unresolvable vendor speed-to-lead page. This is the primary study every vendor page relays. It is from 2007 and predates the current buying environment, so cite the direction with confidence and the multipliers with a date stamp. The co-author was the vendor's CEO, which is a disclosed conflict. |

---

## Engine 07 · SEO and AEO

| ID | Claim as verified | Source | URL | Sample, cohort, method | Class | Confidence | Correction |
|---|---|---|---|---|---|---|---|
| SEO-1 | Versus pages are the content type most correlated with AI search traffic, at roughly double the next-best type (Spearman rank correlation 0.65). B2B sites with 21 or more comparison pages show 900 percent more median AI search sessions than sites with one to five. | "The Content That Predicts B2B AI Traffic Most: Versus Pages," Ross Hudgens, Siege Media, 2026-06-01 | https://www.siegemedia.com/research/versus-pages | 116 B2B GA4 properties, 1,112 transactional pages. Spearman rank correlation plus Pearson on log-transformed values. AI traffic from ChatGPT, Perplexity, Claude, Gemini, Copilot and Meta AI over a trailing 90 days. | first-party study | high | Verified with sample, method and correlation coefficient. Carry the caveat: content explains only about 28 percent of the variance. Brand authority and category fit account for roughly 72 percent. Also, 53 of 116 properties had zero comparison pages detected, partly a URL-pattern limitation. |
| SEO-2 | **See the reconciliation section below.** No single universal AI-to-organic conversion multiplier is supported by the evidence. For a B2B SaaS audience the relevant published figure is 1.05x median, effectively parity. | Two datasets, both fetched. See below. | see below | see below | see below | see below | The prior "around five times organic" claim is not supportable for this repo's audience. |
| SEO-3 | AI-referred clicks commonly land in GA4 as Direct because AI platforms do not consistently pass referrer information. The mechanism is real. The magnitude is not published. | "How to Track, Measure, and Boost AI Referral Traffic," Carlos Silva with Christine Skopec, Semrush, 2025-09-02 | https://www.semrush.com/blog/ai-referral-traffic/ | No sample, no study, no percentage. Semrush states the mechanism as analysis, not measurement. | vendor content | high for the mechanism, not applicable for magnitude | **Reworded.** Prior claim said "most AI-referred traffic shows up as Direct." No resolvable source quantifies "most." State the mechanism, keep the self-reported attribution field on the demo form as the fix, and do not attach a percentage. |
| SEO-4 | Vanta's Collections architecture is the reference case: framework-specific subfolders, dense internal linking, and comparison depth. The SOC 2 Collection alone draws 10.6K organic visits a month with 475K backlinks. Collections total 22.8K monthly visits at over $177K a month in traffic value. 64.7 percent of Vanta's top-3 keyword rankings come from these subfolders. Top pages carry internal links in the thousands on a site of roughly 725 distinct pages. 2,603 of 3,620 tracked keywords trigger AI Overviews. | "How Vanta's $517K/month SEO Moat Translates Into AI Visibility," Nathan Ojaokomo, Foundation Marketing, 2026-07-16 | https://foundationinc.co/lab/vanta-breakdown | Single company. All traffic and keyword figures are Ahrefs third-party estimates, not Vanta first-party analytics. | case study, third-party estimated data | medium | Verified with a direct URL and date. The traffic numbers are Ahrefs estimates. Cite the architecture as the lesson and the numbers as approximate. |

### SEO-2 reconciliation: AI-referred conversion rates

Two datasets make different claims. Both were fetched on 2026-08-05.
Neither supports a universal multiplier.

**Dataset A: Siege Media, 2026.** "AI Traffic Conversion Rates: Are They
Really 7x Better?" by Marianna Mankle, published 2026-06-30, at
https://www.siegemedia.com/research/ai-traffic-conversion-rates.
Siege screened over 120 properties and kept 78 websites with AI-referral
traffic and usable conversion tracking. Data came from first-party GA4
accounts between 2026-01-01 and 2026-05-31, using GA4 session
KeyEventRate as the conversion metric. Inclusion required at least 250
AI sessions and 1,000 organic sessions with non-zero conversions on both
channels. Ratios above 3x were grouped to stop a single outlier from
moving a category.

Result: AI-referred visitors converted at **1.26x** traditional traffic
overall. By category: Finance 1.67x, Consumer and local services 1.29x,
Travel and real estate 1.27x, **B2B SaaS 1.05x**, E-commerce 1.01x. AI
traffic was 0.2 to 3 percent of total sessions on most sites. Siege
attributes the inflated "7x" narrative to Similarweb and argues those
figures come from a narrow slice of high-intent retail.

**Dataset B: the 14.2 versus 2.8 chain.** Authoricy's page at
https://authoricy.com/blog/ai-search-statistics-2026 states "AI search
traffic converts at 14.2% versus 2.8% for Google organic, a 5.1x
advantage" and attributes it to "Stackmatix, 2025 (analysis of 12 million
visits)." That attribution does not hold up. Following it produced three
findings:

1. **Stackmatix does not publish that number.** Stackmatix's own AEO
   conversion benchmark page at
   https://www.stackmatix.com/blog/aeo-conversion-rate (published
   2026-03-11) reports 6.8 percent average conversion for AI answer
   citations against 2 to 3 percent for traditional organic. It cites
   "early industry data," discloses no sample size, no period, and no
   conversion definition, and makes no reference to a 12-million-visit
   analysis.
2. **The 12-million-visit figure belongs to a different party.**
   RankScience's "Why Google Still Matters: The Real Data Behind AI
   Search Hype," Dana Davis, 2025-10-09, at
   https://www.rankscience.com/blog/ai-search-vs-google-traffic-data,
   reports 14.2 percent against 2.8 percent and attributes the 12
   million visits to a Superprompt analysis. RankScience discloses no
   site count, no period, and no statistical controls, and labels its
   own extrapolations "back-of-the-envelope."
3. **There is one resolvable primary behind the 14.2 versus 2.8 pair,
   and it is not Stackmatix.** Opollo's "The 2026 AI Search Benchmark
   Report," Steven Morey, published 2026-02-22 and modified 2026-03-08,
   at https://opollo.com/blog/the-2026-ai-search-benchmark-report/,
   states "AI visitors converted at an average rate of 14.2%. Google's
   organic traffic conversion rate was 2.8%." Sample: 312 IT and
   technology **services** firms across North America, Australia and the
   UK, from $2M regional MSPs to $80M cybersecurity consultancies.
   Period: January 2025 through January 2026. Conversion was defined as
   qualified enquiries only, meaning booked consultations, demo requests
   and validated contact submissions, from GA4 referral data plus CRM
   attribution with manual traffic classification. Firms under 10 AI
   sessions a month were excluded and outliers above 35 percent were
   removed.

**Corrections to the brief that initiated this check.** The Siege Media
summary was accurate on every point: 120+ screened, 78 with usable data,
1.26x median overall, 1.05x for B2B SaaS. The Authoricy summary was
accurate that the page relays 14.2 versus 2.8 and credits Stackmatix
with a 12-million-visit analysis, but the underlying attribution is
wrong at the source, not in the summary. Stackmatix published neither
the number nor the study. Two things got fused into one citation. One
more detail: Siege frames its rebuttal against Similarweb's 7x, not
against the 5x figure, so the two papers are not arguing with each other
directly.

**What to cite.** For a B2B SaaS reader, use Siege Media's 1.05x. It is
the only figure in this entire chain that is segment-matched to the
audience, measured on first-party GA4 with disclosed inclusion rules,
and published by a party with no product to sell against the result.
The 14.2 versus 2.8 pair is real and traceable to Opollo, but Opollo's
cohort is IT services and MSPs selling consulting engagements, where a
"conversion" is a booked consultation. That is a different funnel with a
different denominator.

**The operating statement.** AI referral volume is small, roughly 0.2 to
3 percent of sessions, and its conversion advantage over organic ranges
from parity in B2B SaaS to about 1.7x in finance depending on segment.
Anyone quoting a single multiplier above 2x for B2B SaaS is quoting a
retail or IT-services cohort. Instrument AI referrals because the
segment is growing and because versus-page architecture (SEO-1) pays on
both surfaces, not because the traffic converts five times better. It
does not.

Evidence class for SEO-2: **first-party study** (Siege Media) for the
1.05x B2B SaaS figure, confidence **high**. **Industry report**
(Opollo) for the 14.2 versus 2.8 IT-services figure, confidence
**medium**, cohort mismatch flagged. The Authoricy relay is **vendor
content**, confidence **low**, and should not be cited.

---

## Engine 08 · Social Content

| ID | Claim as verified | Source | URL | Sample, cohort, method | Class | Confidence | Correction |
|---|---|---|---|---|---|---|---|
| SC-1 | Personal LinkedIn profiles outperform company pages on engagement rate: 2.60 percent against 1.74 percent, roughly a 1.5x advantage. Impressions per post are effectively equal (817.67 against 812.64). Individuals also post more often, 3.05 times a week against 2.74. | "2026 LinkedIn Statistics for Social Media Marketers," Metricool, published 2026-04-23, updated 2026-05-22 | https://metricool.com/linkedin-statistics/ | Metricool 2026 LinkedIn Study and 2026 Social Media Study. Sample size not disclosed on the public page. Cross-account platform data. | vendor content, first-party platform data | medium | **Corrected.** Prior claim said "roughly three times the engagement." The largest cross-account dataset available shows 1.5x on engagement rate and parity on impressions. Refine Labs' widely cited 5x figure at https://www.refinelabs.com/article/personal-linkedin-engagement-vs-company-page is from 2023 and compares 7 employees against one company page at a single agency. The direction is well established. The 3x magnitude is not. |
| SC-2 | UNVERIFIED. No resolvable source reports that founder-led content programs triple inbound conversations within 60 days. The prior citation domain does not resolve. **Recommendation: demote to ANDREW OPERATOR HEURISTIC and strip the implied external authority.** | none | not applicable | not applicable | operator heuristic | stated as judgment | Remove the 60-day tripling claim from any board-facing plan. |
| SC-3 | UNVERIFIED. No resolvable source supports "inbound closes an order of magnitude better than cold." **ANDREW OPERATOR HEURISTIC**, and it was already partly labeled as one. | none | not applicable | not applicable | operator heuristic | stated as judgment | The vendor half of the prior "vendor content plus heuristic" label is now removed. This is entirely Andrew's number. |

---

## Engine 09 · Events

| ID | Claim as verified | Source | URL | Sample, cohort, method | Class | Confidence | Correction |
|---|---|---|---|---|---|---|---|
| EV-1 | RSAC Conference 2026 drew 43,500+ attendees, 600+ exhibitors, 700+ speakers across 570+ sessions, from more than 100 countries. | "RSAC Conference Closes 35th Annual Flagship Event Backed by The Power of Community," RSA Conference LLC, 2026-03-27 | https://www.rsaconference.com/library/press-release/2026-closing-release | Official event organizer figures. | first-party announcement | high for attendance | Verified against the organizer's own release, which is stronger than the prior vendor citation. The second half of the prior claim, that this reduces to "under 2,000 real targets," is **ANDREW OPERATOR HEURISTIC**: it depends entirely on the ICP filter and no source publishes it. |
| EV-2 | UNVERIFIED. No resolvable source reports generic pre-event outreach replying at 2 percent against roughly 10 percent for session-specific outreach. Vendelux's event statistics page, which claims to be verified data, publishes no pre-event outreach reply rates at all. **Recommendation: demote to ANDREW OPERATOR HEURISTIC.** The underlying personalization effect is separately supported by AO-1 (Woodpecker: 17 to 18 percent with advanced personalization against 7 to 9 percent basic). | Checked and does not support the claim: "Event Marketing Statistics 2026," Stefan Deeran, Vendelux, 2026-05-27 updated 2026-06-16 | https://vendelux.com/event-marketing/event-marketing-statistics | Vendelux 2026 B2B Events Survey, 120+ B2B marketing and events leaders. | survey | low | The specific 2 versus 10 pair has no source. The direction is supported by email personalization data, which is a different channel. |
| EV-3 | Published cost per qualified opportunity from events: $5,000 to $15,000 for disciplined programs, $10,000 to $25,000 for average programs. Cost per qualified meeting: $1,500 to $3,000 for a high-density Tier 1 sponsorship with full motion, $1,000 to $3,000 for curated dinners. | "B2B Event Marketing Benchmarks: The Operator's Reference," Stefan Deeran, Vendelux, published 2026-05-27, modified 2026-06-16 | https://vendelux.com/event-marketing/b2b-event-marketing-benchmarks | Over 2,500 B2B buyer conversations across 30 months plus aggregated program data from teams running events at scale. Per-metric sample sizes, company counts and total spend are not disclosed. | vendor content, operator-aggregated | medium | **Reworded.** Prior claim said booth-first runs $8K to $12K per opportunity and ICP-first with pre-booking runs $2.5K to $5K. No source publishes that split. The published bands are higher and are cut by program discipline, not by booth-versus-pre-book. Andrew's $2.5K to $5K figure sits below every published band and is **ANDREW OPERATOR HEURISTIC**. |
| EV-4 | UNVERIFIED as a rate. Vendelux reports pre-booked meeting counts in absolute terms, 80 to 200 per major show, and publishes no percentage. The prior "40 of 85" reference program has no resolvable source. **Recommendation: keep the operating rule (pre-book at least half) as ANDREW OPERATOR HEURISTIC and drop the reference program.** | Vendelux (above) for the absolute counts only | https://vendelux.com/event-marketing/b2b-event-marketing-benchmarks | See EV-3. | operator heuristic | stated as judgment | The rule is good practice. It is not a published benchmark. |
| EV-5 | Partially supported. Vendelux prices curated dinners at $1,000 to $3,000 per qualified meeting against $1,500 to $3,000 for Tier 1 sponsorship, so dinners are at worst equal and at best cheaper per meeting. No source supports the claim that the host's title decides acceptance. | Vendelux (above) | https://vendelux.com/event-marketing/b2b-event-marketing-benchmarks | See EV-3. Vendelux explicitly does not compare booth-led against targeted programs. | vendor content | low | **Split.** The cost-per-meeting comparison is weakly supported. The host-title claim is **ANDREW OPERATOR HEURISTIC**. |
| EV-6 | 24-hour hot-lead and 48-hour full follow-up SLA. **ANDREW OPERATOR HEURISTIC**, with the underlying decay curve supported by PM-6. | MIT Lead Response Management Study (see PM-6) | https://25649.fs1.hubspotusercontent-na2.net/hub/25649/file-13535879-pdf/docs/mit_study.pdf | 6 companies, 15,000+ leads, 100,000+ call attempts, 2007. | operator heuristic, sourced decay curve | stated as judgment | The specific 24 and 48 hour lines are Andrew's. The finding that response odds collapse within hours, not days, is measured. |
| EV-7 | Supporting context, new in this pass: event-touched deals convert from creation to closed-won at 12.1 percent for live events and 13.8 percent for virtual, against 11.1 percent for other channels. Events produce about 6.5 percent of closed deals on far fewer created deals (live 64,240 and virtual 42,987 against 1.6 million for other channels). | "The State of Event Marketing in 2025 So Far," Amulya Vadrevu, HockeyStack Labs, 2025-11-06 | https://www.hockeystack.com/lab-blog-posts/the-state-of-event-marketing-in-2025-so-far | 2,642,337 deals with event touchpoints across 198 B2B SaaS companies, January 2024 to September 2025, North America and Europe. Linear attribution, equal credit across touchpoints. | first-party study | high | New claim ID. This is the strongest event dataset found this pass and it is the right number to put in front of a board: events are a small share of created pipeline that closes at a modestly better rate. Linear attribution is a disclosed modeling choice that flatters multi-touch channels. |

---

## Model constants (all Andrew's operating model)

These are not benchmarks and were never presented as such. They are the
knobs in the model, tested for reproducibility in `engine/`.

| ID | Constant | Where | Class | External context found this pass |
|---|---|---|---|---|
| CAP-1 | Funnel: 16 percent meeting-to-qual, 27 percent qual-to-POV, 81 percent POV-to-win | engine.js FUNNEL | **ANDREW OPERATOR HEURISTIC**, tested for reproducibility | none directly comparable |
| CAP-2 | Steady-state anchor: $1.0M per ramped AE at $120K ACV on a 178-day cycle | engine.js ANCHOR | **ANDREW OPERATOR HEURISTIC**, tested | Optifai's 939-company pipeline study puts the overall B2B SaaS median cycle at 84 days and enterprise above $100K ACV at 90 to 180+ days. At $120K ACV, 178 days sits at the long end of the published enterprise band but inside it. https://optif.ai/learn/questions/sales-cycle-length-benchmark/ (updated 2026-04-20, Q2 2025 to Q1 2026, CRM timestamp analysis of won deals, 25th to 75th percentile ranges). Lightly corroborated. |
| CAP-3 | Ramp vector: $0 / $125K / $225K / $250K per tenure quarter | engine.js RATES x profile | **ANDREW OPERATOR HEURISTIC**, tested | Lative reports 9 to 12 months to 80 percent of quota for enterprise, 5 to 7 for mid-market, 3 to 4 for SMB, with no sample size disclosed. https://lative.ai/blog/sales-ramp-time/ (2026-06-03). A four-quarter ramp to full productivity is consistent with the enterprise band. Directionally corroborated, not validated. |
| CAP-4 | 30 percent haircut from gross capacity to net-new ARR | engine.js DEFAULTS.adv.haircut | **ANDREW OPERATOR HEURISTIC** | none found |
| CAP-5 | Support ratios: 2.5 AEs per SE and per BDR; leadership thresholds | engine.js DEFAULTS.adv | **ANDREW OPERATOR HEURISTIC** | none found |
| MIX-1 | 85/15 run/instrument budget split and every ACV or cash threshold | mix.js | **ANDREW OPERATOR HEURISTIC**, knobs by design | none found |

---

## Sources that did not resolve

The following domains were cited in the previous registry and produced
no fetchable page supporting the claim attributed to them during this
pass: levityleads.com, scalingtechnologypartners.com, coldicp.com,
udit.co, saleshive.com (for the specific attempt and dial-to-meeting
figures), abmatic.ai, steerads.com, nicodigital.com, growthengineer.ai,
averi.ai, connectsafely.ai, luminik.io, samaaro.com. Every claim that
rested on one of them has been re-sourced, rewritten, or demoted above.

## Numbers that trace to a single unverifiable post

Three widely repeated figures in this space collapse under one hop of
scrutiny and are flagged so nobody re-adds them:

- **AI conversion 14.2 versus 2.8 attributed to Stackmatix.** Stackmatix
  never published it. See the SEO-2 reconciliation.
- **Cold call dial-to-meeting at 2 to 3 percent.** Repeated across
  vendor blogs with no primary. Belkins' 175,000-dial study measures
  about 0.27 percent.
- **Person-level visitor identification at 40 to 70 percent.** That is
  the company-level match rate. Person-level runs 8 to 15 percent.

## What this registry does not claim

None of these figures are predictions for your company. The studies
describe other cohorts in other periods; the heuristics describe how
Andrew operates. Sample sizes are disclosed above so a reader can judge
weight rather than take a number on faith. Validate against your own
funnel before building a forecast on any of them.
