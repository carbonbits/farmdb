# Portal gap analysis

Cross-reference of `design-reference.md` screens against current `src/apps/web` state and
known Jira tickets. See design-reference.md for full per-screen field lists.

| Design screen | Jira ticket(s) | Codebase status | Key files | Notes |
|---|---|---|---|---|
| App shell & nav | WKLM-61 | **Built** — sidebar, sections, entitlement gates all match the mockup | `components/sidebar/*`, `app/(app)/layout.tsx` | Farm/org switcher, "Log activity" modal, notifications dropdown not yet built |
| Dashboard | WKLM-62 | Stub only ("Coming soon") | `app/(app)/dashboard/page.tsx` (8 lines) | |
| Fields & mapping | WKLM-63, CORE-145 | Stub only | `app/(app)/fields/page.tsx` (10 lines) | CORE-145 ("view a farm field", assignee Washington Karanja) is likely this epic's first story |
| Crops & fields | WKLM-64 | Stub only | `app/(app)/crops/page.tsx` | |
| Livestock & dairy | WKLM-65 | Stub only | `app/(app)/livestock/page.tsx` | |
| Tasks & calendar | WKLM-66 | Stub only | `app/(app)/tasks/page.tsx` | |
| Inventory | WKLM-67 | Stub only | `app/(app)/inventory/page.tsx` | |
| Finances & reports | WKLM-68 | Stub only (2 routes) | `app/(app)/finances/page.tsx`, `app/(app)/reports/page.tsx` | |
| Settings | WKLM-71, **CORE-295** (active) | **Not started** — no route, no nav entry, no gear-icon wiring at all | — (would be `app/(app)/settings/page.tsx`) | CORE-295 = Profile & account + Preferences tabs only; Farm details/Team/Notifications/Billing tabs are in-epic but not in this story |
| Farm connects | WKLM-69 (enterprise) | Stub only | `app/(app)/connects/page.tsx` | `organization` entitlement gate already wired in nav-config + `lib/entitlements` |
| Connect pricing | WKLM-70 (tier **unresolved**), CORE-293, CORE-294 | Stub only | `app/(app)/admin/pricing/page.tsx` | Do not build real pricing logic until tier question resolved; `platformAdmin` gate already wired |
| Cooperative / Accounts & treasury | **none found** | Not started, not in nav | — | No WKLM epic, no CORE story — flag to product before scoping work here |
| OSS packaging & self-hosted dist | WKLM-101, CORE-300 (Dockerfile) | Partial — docker-compose exists at repo root, no frontend prod Dockerfile yet | `docker-compose.yml` | |
| License-key entitlement mechanism | WKLM-102, CORE-303, CORE-304 | Stubbed shape only | `lib/entitlements/index.ts` | Comment in file already references WKLM-102/106-108; returns hardcoded `false` for both flags |
| Infrastructure Console (instances/registry/ingress/backups/audit/builder) | CORE-117/118/119, CORE-244/248, CORE-310–319, CORE-269/331 | Not started; separate product surface | — | Not part of the farmer-facing `src/apps/web` app scope |

## Biggest structural findings

1. **The shell is ahead of everything else.** `nav-config.ts` already mirrors the mockup's
   sidebar sections and entitlement gates exactly (WKLM-61 is essentially done). Every
   other screen is a literal `<h1>...</h1><p>Coming soon.</p>` stub — so this is a green-field
   build for all screen content, not a redesign of existing UI.
2. **No shared component library exists.** No shadcn/Radix/etc., no design tokens beyond
   scattered hardcoded hex values, no switch/tabs/pill/card components. CORE-295's
   acceptance criterion ("toggles use the shared switch component") implies one should
   exist — it doesn't yet. Building `Switch`, `Card`, `Pill`, `Tabs`, `SegmentedControl`,
   `FormField` as real shared components (mirroring the mockup's CSS catalog) is a
   prerequisite that will be hit again by literally every other screen, so it should be
   done once, early — not re-invented per-ticket.
3. **All WKLM epics have zero child stories/tasks** except where CORE already has
   overlapping stories (CORE-295 for part of Settings, CORE-145 for part of Fields,
   CORE-293/294 for part of Pricing). A full portal build would need epic breakdown into
   tickets before most of the work has a ticket to attach to — CORE-295 is the only
   fully-scoped, ready-to-build story right now.
4. **Cooperative/Accounts & treasury has no ticket at all** despite being fully designed —
   worth flagging to product rather than silently building or silently dropping it.
5. **WKLM-70 (Connect pricing) tier is explicitly unresolved** in its own epic
   description — CORE-293/294 exist but building real gating/pricing logic risks
   throwaway work until that product decision lands.
