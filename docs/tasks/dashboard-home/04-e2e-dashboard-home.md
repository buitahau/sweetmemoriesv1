# 04 E2E suite `e2e/dashboard-home`

**Status:** todo
**Side:** front-end
**Size:** S
**Dependencies:** [google-sign-in 10](../google-sign-in/10-e2e-google-sign-in.md), [03](03-sign-out.md)
**Feature spec:** [dashboard-home](../../features/dashboard-home.md)
**Mockup:** none

## Checklist

- [ ] Write one test per US-dashboard-home scenario using the google-sign-in 10 seeding helper (two Users for 1.3, two seeded sessions for 3.3)
- [ ] Set `SIGN_OUT_DELIVERED = True` in `e2e/dashboard-home/test_dashboard_home.py` once tasks 02 and 03 land (it un-skips the Sign out check in 1.1 and scenarios 3.1 to 3.3)
- [ ] Run the seeded cases for the first time against a personal Neon developer branch (see below); they have not been run yet

## Coverage

`e2e/dashboard-home/test_dashboard_home.py` was written during [task 01](01-protected-dashboard-route-and-loader.md): one test per scenario, plus one extra test.

| Scenario | Test | Run so far |
| --- | --- | --- |
| US-dashboard-home-1.1 | `test_US_dashboard_home_1_1_signed_in_user_sees_greeting` | no (needs seed DB; Sign out check needs 02/03) |
| US-dashboard-home-1.2 | `test_US_dashboard_home_1_2_dashboard_is_no_store_and_noindex` | no (needs seed DB) |
| US-dashboard-home-1.3 | `test_US_dashboard_home_1_3_no_data_about_another_user` | no (needs seed DB) |
| US-dashboard-home-1.4 | `test_US_dashboard_home_1_4_no_name_falls_back_to_hi_there` | no (needs seed DB) |
| US-dashboard-home-2.1 | `test_US_dashboard_home_2_1_anonymous_visitor_is_redirected` | yes, passes |
| US-dashboard-home-2.2 | `test_US_dashboard_home_2_2_forged_or_expired_cookie_is_redirected[forged]` / `[expired]` | forged: yes, passes; expired: no (needs seed DB) |
| US-dashboard-home-3.1 | `test_US_dashboard_home_3_1_sign_out_ends_session` | no (needs 02/03 and seed DB) |
| US-dashboard-home-3.2 | `test_US_dashboard_home_3_2_after_sign_out_dashboard_redirects[back]` / `[open]` | no (needs 02/03 and seed DB) |
| US-dashboard-home-3.3 | `test_US_dashboard_home_3_3_sign_out_ends_only_current_session` | no (needs 02/03 and seed DB) |
| Extra: task 01 Verification (security) | `test_T01_V1_loader_exposes_only_the_first_name` | no (needs seed DB) |

That is 9 scenarios plus 1 extra test, which checks that no email, full name, User id or session token leaks into the HTML. Until this task runs them, the seeded cases above are **unverified**, including task 01's 200 page, `no-store`, robots `noindex`, the "Hi there" fallback and the no-leak checks.

## Verification

- [ ] `pytest e2e/dashboard-home -rs` passes locally with no skips, against `pnpm start`, with `E2E_SEED_DATABASE_URL`, `E2E_SEED_NEON_ENDPOINT` and `E2E_BETTER_AUTH_SECRET` pointing at your own Neon developer branch (never the shared `.env` `DATABASE_URL`; see `e2e/README.md`)
