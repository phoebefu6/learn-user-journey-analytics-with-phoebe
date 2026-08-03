# learn-user-journey-analytics-with-phoebe - source coverage map

Built 2026-08-03, directly from verified sources (course-taking loop paused).
Course #2 of the ecom cluster (metrics -> USER-JOURNEY -> traffic -> campaign).
Same store + month as learn-ecommerce-metrics: Mango Lane.

## Journey canon (NEW numbers layered on course #1's canon - NEVER drift)

Course #1 base (unchanged): 240K UV, 360K sessions, 144K PDP sessions (40% pen),
36K cart (25%), 16.2K checkout (45%), 9,720 orders (60% completion), 2.7% session CR,
$68 AOV, $660,960 GMV.

### Entry mix (sessions by landing screen, python-verified to reproduce 144K PDP)
| Entry | Sessions | Share | Reach-PDP rate | PDP sessions |
|---|---|---|---|---|
| Home | 180,000 | 50% | 20% | 36,000 |
| PDP direct (deeplink/ads/push) | 54,000 | 15% | 100% | 54,000 |
| PLP/category | 54,000 | 15% | 50% | 27,000 |
| Search landing | 36,000 | 10% | 75% | 27,000 |
| Other (account/orders/support) | 36,000 | 10% | 0% | 0 |
| **Total** | **360,000** | | | **144,000** exactly |

### Paths (within-session discovery, of the 144K PDP sessions)
- Search path: 43,200 (30%), path CR 12% -> 5,184 orders
- Browse path: 100,800 (70%), path CR 4.5% -> 4,536 orders
- Sum 9,720 exactly. Ratio 2.67x - inside the verified industry range (below).

### PDP engagement (b5)
- Engaged PDP sessions (gallery 2+ / reviews / size guide): 72,000 (50%), CR 9% -> 6,480 orders
- Plain PDP sessions: 72,000, CR 4.5% -> 3,240 orders. Sum 9,720 exactly. Ratio 2x.

### Checkout micro-funnel (b6, GA4 checkout-journey shaped)
begin_checkout 16,200 -> add_shipping_info 14,580 (90%) -> add_payment_info 12,150
(83.3% = exactly 5/6) -> purchase 9,720 (80%). Product = 60% completion exactly.

### journey-live.js lever ladder (b4, hard-coded on the page, verified live in browser)
| Rung | Fix | Gate delta | Orders | CR | GMV | vs base |
|---|---|---|---|---|---|---|
| 0 | baseline | - | 9,720 | 2.70% | $660,960 | - |
| 1 | Smarter search & nav | PDP pen 40->43% | 10,449 | 2.90% | $710,532 | +7.5% |
| 2 | + Richer PDP | ATC 25->28% | 11,703 | 3.25% | $795,796 | +20.4% |
| 3 | + Persistent cart | start 45->50% | 13,003 | 3.61% | $884,218 | +33.8% |
| 4 | + One-page checkout | completion 60->66% | 14,304 | 3.97% | $972,639 | +47.2% |

## Verified source facts (research pass 2026-08-03; credibility flagged)

### GA4 explorations (fetched-primary)
- Path exploration (answer/9317498): tree graph of sequences; forward AND backward pathing;
  node types: Event name, Page title, Page path, Screen name, Screen class; top 5 nodes/step
  default, max 20; metrics event count + total users.
- Funnel exploration (answer/9327974): open (enter any step) vs closed (enter at step 1,
  DEFAULT); max 10 steps; up to 4 segments; "show elapsed time" between steps; "next action"
  top-5 breakdown; standard vs trended funnel.

### Screen + landing + source (fetched-primary)
- screen_view auto-logged on Activity/UIViewController change; params firebase_screen_class +
  firebase_screen_id; manual screen_name/screen_class; SwiftUI needs manual logging.
  Web equivalent page_view (enhanced measurement).
- Landing page = first page of session; Entrances = count of sessions whose first event
  happened on that page/screen.
- First user source/medium (user-scoped, first-ever visit) vs session source/medium
  (per-session) vs event-scoped (key events, data-driven attribution).

### Site search (fetched-primary + flagged)
- view_search_results event + search_term param; default query params q,s,search,query,keyword;
  unique_search_term=1 per unique in-session string.
- Search-vs-browse conversion: TEACH AS RANGE "vendor and analyst studies put search users at
  1.8-6x browse conversion": Econsultancy 2.77% vs 4.63% (~1.8x, secondary-relayed);
  Forrester 2-3x (secondary, old); Nacho/Algolia 2019 Amazon 6x, Walmart 2.4x, Etsy 3x
  (secondary, defunct panel). "Searchers 15% of visitors, 45% of revenue" = LOW credibility,
  say "commonly cited". Mango Lane's 2.67x sits mid-range - say so.

### Baymard checkout (fetched-primary)
- Cart abandonment 70.22% (50 studies); $260B US+EU recoverable via checkout design.
- Checkout abandonment REASONS (2025 wave, ex-just-browsing): extra costs 40%, delivery slow
  20%, card trust 19%, account required 18%, too long/complicated 17%, errors 17%, returns
  policy 13%, no upfront total 12%, card declined 10%, few payment methods 9%.
  NOTE older waves show 48%/24% - cite "Baymard 2025 survey wave" explicitly.
- Checkout length: avg 5.1 steps, 11.3 form fields shown, ideal ~8 fields (2024 benchmark);
  field count matters more than step count.
- Cart vs checkout abandonment distinction: cart includes ~42-43% just-browsing.

### PDP engagement (mixed credibility)
- Spiegel Research Center 2017 (fetched-primary, academic, with PowerReviews): product with
  5 reviews = 270% GREATER purchase likelihood vs 0 reviews (NOT "displaying reviews lifts
  270%"); higher-priced +380%; Verified Buyer badge +15%; ratings sweet spot 4.0-4.7 (5.0
  reads fake); benefit plateaus after ~5 reviews.
- Baymard: 56% of users' first PDP action = explore images (search-confirmed, premium primary).
- Fit/size = #1 apparel return reason, ~53-70% by source (McKinsey 70%) - teach as range,
  NO precise "size guide reduces returns X%" number exists.

### Push / re-engagement (vendor data - flag as such)
- Airship (681B pushes, 3B users): rich/image push +56% direct opens; segmentation lifts
  push-attributed purchases 4-72% (up to 350%); push-receiving users ~3x 90-day retention.
- CleverTap: avg push CTR 2.74%, +38% with emoji.
- NO credible deeplink-vs-organic conversion benchmark exists - teach Airship's "direct open"
  vs "influenced open" metric names instead of inventing one.

## Per-session coverage

### Leader track
| Session | Covers | Sources |
|---|---|---|
| a1 The journey, not the funnel | session-as-story, screens vs gates, entry-to-order anatomy | GA4 path exploration ✓ |
| a2 Entry points | entry mix, landing quality, push/deeplink re-engagement, source scoping | GA4 landing/entrances ✓, Airship ◐ vendor |
| a3 Search vs browse | two roads to PDP, search converts 1.8-6x (range, flagged), merchandising both paths | Algolia/Econsultancy ◐, GA4 search events ✓ |
| a4 The PDP decision room | images first (56%), reviews math (Spiegel), fit info + returns | Spiegel ✓ academic, Baymard ◐ |
| a5 The last mile | checkout reasons list (Baymard 2025), 5.1 steps / 11.3 fields, trust signals | Baymard ✓ |
| a6 Journey priorities | reach x severity x confidence ritual, WBR integration, experiment handoff | internal + Littledata ◐ |

### Analyst track
| Session | Covers | Sources |
|---|---|---|
| b1 Map the journey | screen map, screen_view/page_view instrumentation, entry canon table | Firebase screens ✓, GA4 ✓ |
| b2 Entry-point analytics | entrances, landing report, reach-PDP by entry, bounce by entry, source scopes | GA4 ✓ |
| b3 Path analysis | GA4 path exploration mechanics, search vs browse canon, path CR math | GA4 ✓, search stats ◐ range |
| b4 Flow simulator (SIM) | journey-live.js ladder, fixes as gate deltas, compounding | canon ✓, verified live |
| b5 PDP engagement | engaged vs plain canon (2x), Spiegel review math, image-first, size guidance | Spiegel ✓, Baymard ◐ |
| b6 Checkout micro-funnel | GA4 checkout journey steps + canon chain, Baymard reasons + field counts | GA4 ✓, Baymard ✓ |
| b7 Diagnose a journey leak (SIM) | reverse workflow on the flow + course #1 tree, screen-level finding | internal ✓ |
| b8 Journey scorecard | journey KPI spec rows, WBR page, handoff, series pointer | internal ✓ |

## Not covered by design
- Traffic acquisition itself (ecom course #3), campaign measurement (#4)
- A/B testing the fixes (learn-experimentation-with-phoebe)
- Attribution credit (learn-marketing-attribution-with-phoebe)
- Session replay tooling, heatmaps (tool-specific, out of scope)
- SQL path queries (learn-sql / metric-decomposition)

## Re-verify before delivery
- Baymard reasons table re-benchmarks by survey wave; GA4 exploration UI moves.
- Airship/CleverTap vendor numbers refresh annually.
