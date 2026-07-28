# Wakulima design reference

Source: `docs/design/Wakulima Farm Management.html` — a self-contained "dc-runtime"
mockup bundle (base64/gzip assets unpacked at runtime; not readable by grep/cat directly,
see extraction notes at bottom). Decoded once here; this doc is the durable reference —
prefer this over re-decoding the bundle.

The mockup is a single fake-SPA: one React class component (`class Component extends
DCLogic`) with a `state.route` switch and inline template using `{{ }}` placeholders /
`<sc-if>` / `<sc-for>`. It also imports a second, separate mockup doc for the platform/ops
console (see "Infrastructure Console" section).

## Design tokens

```css
--ink:#20160f      /* primary text, sidebar bg */
--brown:#3f2d22
--muted:#75583f    --muted2:#957a5c
--tan:#b49a78       --line:#eadfcb
--canvas:#f8f2e5    /* page bg */
--card:#fcf8f0      --sand:#f4ead4
--green:#346b41  --green2:#3e7e4c  --greendk:#2c5a38   /* primary/brand */
--gold:#c98a2b   --terra:#b46038   --watch:#b8862b     /* accent/status */
```
Fonts: **Hanken Grotesk** (`ui-sans-serif` UI body), **Spectral** (`.serif`, used for
headings/large numerals), **IBM Plex Mono** (`.mono`, used for account numbers, small caps
labels). Base font-size 14px, line-height 1.45.

Current codebase (`src/apps/web`) hardcodes similar-but-not-identical hex values inline
(e.g. `#F5EDE0`, `#20160F`, `#6B5B45`) with Tailwind arbitrary values, no shared tokens.
Rebuilding these as Tailwind theme tokens / CSS vars matching the palette above is a
prerequisite for every screen, not just Settings.

## Shared component/class catalog (informal design system in the mockup)

| Class | Purpose |
|---|---|
| `.btn` / `.btn.ghost` / `.btn.sm` | Primary (green) / secondary (white outline) / small button |
| `.switch` / `.switch.on` | Toggle switch — 42×24 pill, dot slides via `::after` + `translateX(18px)`. **This is what CORE-295's "shared switch component" acceptance criterion refers to.** |
| `.seg` + `.segbtn` / `.segbtn.on` | Segmented control (2-way choice, e.g. Metric/Imperial) |
| `.tabbar` + `.tab` / `.tab.on` | Pill tab bar (used for field record tabs, connects sub-tabs) |
| `.pill` + `.pill.ok/.watch/.neutral/.high` | Status badge, color-coded |
| `.card` / `.card.warm` | White / tinted-sand content card, 16px radius |
| `.setnav-item` / `.setnav-item.on` | Settings left-nav tab item |
| `.setcard`, `.setcard-h`, `.setcard-s` | Settings content card + heading + subtext |
| `.setrow`, `.setrow-t`, `.setrow-s` | Settings row (label + sublabel + trailing control) |
| `.fld`, `.flabel`, `.finput` | Form field wrapper / label / input (white bg, 10px radius, green focus ring) |
| `.fldgrid`, `.grid2/3/4` | Responsive field/card grid |
| `.roletag` / `.roletag.owner` | Team member role badge |
| `.fsw-tile` (+ `.ft-a/b/c/d`) | Avatar-initial tile, color-rotated by index |
| `.dangercard` | Red-bordered destructive-actions card (e.g. Archive farm) |
| `.kpi`, `.kval`, `.klabel`, `.ksub` | KPI stat card |
| `.chipgrid` | Grid of selectable chips (activity-log modal) |
| `.modalwrap`, `.modal`, `.modalhead/body/foot` | Modal shell |

Full CSS lives in the bundle's `<style>` block if exact values are needed beyond this
catalog; not reproduced here in full to keep this doc short.

## Routes (`state.route`)

Breadcrumb/nav map (verbatim from the mockup's Component class):
```
dashboard:['Overview','Dashboard']
fields:['Production','Fields & mapping']
crops:['Production','Crops & fields']
livestock:['Production','Livestock']
tasks:['Operations','Tasks & calendar']
inventory:['Operations','Inventory']
finances:['Money','Finances']
reports:['Money','Reports']
settings:['Account','Settings']
connects:['Organization','Farm connects']
pricing:['Platform admin','Connect pricing']
coop:['Cooperative','Accounts & treasury']
```
Plus a `console` route (`isConsole`) that embeds the separate Infrastructure Console
mockup via `<dc-import>` — no breadcrumb entry, likely an internal/ops-only route not
meant for the farmer-facing nav.

App shell: dark (`--ink` bg) left sidebar, sections = Overview / Production / Operations /
Money / Organization (gated) / Platform admin (gated) — **already matches the real
codebase's `nav-config.ts` section-for-section**, including the same two entitlement
gates (`organization`, `platformAdmin`). Sidebar has a farm switcher and org switcher
(dropdowns with avatar tiles `.fsw-tile`/`.og-a/b/c`), a collapse toggle, and a "Log
activity" quick-add button that opens a modal (`logOpen` state) with activity-type chips,
field/animal picker, date, quantity, unit, notes. Topbar/user row has a gear icon
(`goSettings`) — this is the only entry point to Settings; there's no dedicated sidebar
nav item for it in the mockup either (it hangs off the user avatar / topbar icon, not the
left nav sections).

### Dashboard
Greeting header + date/farm/season line, "View tasks" + "Log activity" buttons. 4 KPI
cards (Active fields, Milk today, Open tasks, Net this month). Two-column body: Today's
tasks (checkable rows w/ priority dot) + Recent activity feed | Weather card (7-day
strip) + Alerts card.

### Fields & mapping
Split view: left = interactive farm map (clickable plot buttons w/ crop+area label,
legend chip, layers control, scale bar), right = selected-field detail card (name, status
pill, area/soil/slope/drainage/elevation/last-soil-test grid) + tabbed records list
(plantings/inputs/tasks/yields/costs — generic "tabs"/"activeRecords" per field).

### Crops & fields (crop register)
Grid of crop cards: name, variety, area, growth-stage pill, progress bar, fields list,
season, expected harvest + next action, "Map" button (deep-links back to Fields).

### Livestock & dairy
3 herd-summary cards (count + metric pill). Milk production 7-day bar chart + stat row
(today/7-day avg/month/coop rate). Herd health alerts list. Dairy register table (animal
name+tag, breed, status pill, note).

### Tasks & calendar
Week strip (Mon–Sun mini calendar with task chips per day, today highlighted). 3 columns:
Today / This week / Later, each a checkable task list with priority dot + context text.

### Inventory
Single table/list: item name + qty, category, stock-level bar, status pill. "Restock
order" button.

### Finances
4 KPI cards (Income, Expenses, Net, Coop balance). Recent transactions list (date, desc,
category, signed amount). Cost breakdown stacked bar + legend. Coop payout summary card.

### Reports
Grid of report cards: Season summary (stats + "Open report"), Milk yield trend
(sparkline bars), Cost per crop (list), Export data (CSV/PDF buttons), Profit & loss
(3-stat row), Records health (progress bar, "94% logged").

### Settings (→ CORE-295 scope is Profile + Preferences only; full screen has 6 tabs)
Left nav (`setCats`, icon+label, active state) + right panel (`setpanel`), one `<sc-if>`
per tab:
- **Profile & account** (`profile`, default tab): "Your profile" card — avatar tile +
  "Change photo" button, fields Full name / Role / Email / Phone, "Save changes". Second
  card "Password & security": Password row w/ "Change password" button + last-changed
  text, **Two-factor authentication** switch row ("Require an SMS code when signing in"),
  **Login alerts** switch row ("Notify me of new device sign-ins").
- **Farm details** (`farm`): farm identity header, fields Farm name / County-region /
  Total area / Primary enterprise / Established / Currency (select), "Save farm details".
  Danger-zone card: "Archive this farm".
- **Team & roles** (`team`): member list (avatar tile, name, email, role tag), "Invite
  member" button.
- **Notifications** (`notify`): matrix table — rows = categories (Pest & disease, Inventory
  & reorder, Payments & finance, Weather warnings, Task reminders, Livestock health),
  columns = In-app/SMS/Email switches. Plus a standalone "Quiet hours" switch row.
- **Billing & plan** (`billing`): plan/usage box (plan name, farms used, price), Next
  billing date, Payment method, Billing history rows each with an action button.
- **Preferences** (`prefs`, **CORE-295's second tab**): Measurement units (Metric/Imperial
  segmented control), Language (select: English/Kiswahili), Date format (select, 3
  formats), Start week on (Monday/Sunday segmented control), **Weekly digest email**
  switch row ("Summary of farm activity every Monday").

State backing all of this: `settingsTab` (active tab key), `tog` (generic toggle-state
map keyed by string, read via a `tog(key, defaultVal)` helper that returns `{cls, onClick}`
— i.e. every switch in the mockup is driven by one small reusable helper, not bespoke
state per toggle), `units` (`metric`/`imperial`), `weekStart` (`mon`/`sun`).

### Farm connects (`connects`, org-gated)
Intro text + stat row (`connectStats`) + 2-tab bar ("Connects you hold" / "Access to your
farms"). Card per connect: farm identity, status pill, shared-scope chips
(dataset+access-level), assignee block (user avatar or "AI agent" icon, expiry countdown,
Reassign/Edit-scopes buttons) or an empty "Assign to a user or AI agent" CTA with a
"seat paid but unassigned" warning, subscription block (plan/price, days-left bar,
action button).

### Connect pricing (`pricing`, platform-admin-gated — **tier unresolved per WKLM-70,
do not build against an assumed tier**)
Stat row + "Priced datasets" list (name, category, price, trend sparkline+arrow) with a
selected-scope detail: big line/area chart (price over season w/ floor/ceiling dashed
lines, harvest marker, today marker, peak annotation), sliding-scale control card (Base
price / Seasonal multiplier / Floor / Ceiling inputs + demand-sensitivity range slider,
Save draft / Schedule change), Scheduled changes list, stakeholder-notify bar with
"Notify now" button. Maps to CORE-293 (scope selector & chart) and CORE-294 (sliding-scale
controls & schedule/notify).

### Cooperative — Accounts & treasury (`coop`)
**Not present anywhere in the current nav-config or Jira (WKLM/CORE) — no ticket found
for this screen.** Pooled account hero (balance, in/out this month, reserve ratio), quick
actions list, stat row, member accounts table (chips filter, avatar/account/balance/status
columns), recent activity feed, pending advances list (approve/decline).

## Infrastructure Console (separate nested mockup, `Wakulima Infrastructure Console.dc.html`)

A **distinct admin/ops tool**, not the farmer-facing app — embedded via `<dc-import>` at
the farmer app's hidden `console` route. Its own `Component` with `state.view` (not
`route`) and this nav:
```
instances  — Farm instances     (per-tenant provisioning list: name, org, hostname,
                                  status Running/Provisioning/Suspended, tier, last-deploy,
                                  commit sha)
settings   — Instance settings
builder    — Farm builder       (new-instance form: name, county, area, region,
                                  blueprint type, tier)
registry   — Plugin registry
ingress    — Ingress & TLS
backups    — Backups
audit      — Audit log
```
This maps to the **CORE** (not WKLM) infra/platform tickets already found: CORE-244
(Infrastructure nav), CORE-248 (Clusters dashboard), CORE-310–319 (svc-application-
management endpoints: deployments, deployment targets, ingress, environments, infra,
plugins, info), CORE-117/118/119 (plugin ecosystem/registry), CORE-331/269 (data-api
provisioning/Ducklake). **Out of scope for the farmer portal (WKLM) work** — separate
product surface, separate epic thread.

## Extraction method (for future reference, don't redo unless the design file changes)
The bundle is `<script type="__bundler/manifest">` (base64+gzip assets keyed by uuid),
`<script type="__bundler/template">` (JSON-string HTML template with uuid placeholders),
`__bundler/ext_resources` (named external refs, incl. the nested console doc), decoded via
plain Python (`json.loads` + `base64.b64decode` + `gzip.decompress`) — grep/cat are
useless on it directly since content is either base64 noise or one giant concatenated
line. Screen boundaries were found by locating each `isDashboard`/`isFields`/etc.
`<sc-if>` occurrence and slicing between consecutive offsets.
