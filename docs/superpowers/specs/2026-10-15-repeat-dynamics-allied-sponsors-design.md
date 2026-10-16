# Repeat finished dynamics and reuse allied sponsors

Date: 2026-10-15

## Problem and decision
Finished dynamics should be repeatable with fresh winners and participation history. The sponsor picker currently uses only legacy brands and omits the separate allied-logo library.
Repeat makes an independent draft with copied editable rules and cleared eligibility_dynamic_id; results, counts, IDs and legacy raffle relationships never transfer.
List active logos from the existing authorized admin-logos endpoint, deduplicate by accent-insensitive name against legacy brands and keep selected historical brands available. Store logo sponsorship in existing config.sponsor_logo_id, while retaining sponsor_brand_id for legacy records; no schema changes.

## Mobile, performance and security
Maintain 390px first, keyboard support, 44px touch targets and existing visual hierarchy/sidebar. Fetch logo catalog only on admin dynamics mount. No new dependencies. Do not change OTP, registrations, QR, public endpoints or landing cache.

## Out of scope
No replaying old results, automatic scheduling, timer, schema consolidation, migration or modification to public game display.