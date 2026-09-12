# Design System

> **Project:** RailOpt AI  
> **Status:** Greenfield initial design system  
> **Source of truth:** SIH problem statement, project concept/PPT, and `PRD.md`.  
> **Important:** No existing UI, CSS, Tailwind configuration, component library, screenshots, or established visual patterns were available when this document was created. Therefore, the visual tokens below are **explicit initial design decisions**, not claims about an existing implementation or official Indian Railways branding.
>
> **AI coding rule:** Read this file before creating or modifying any UI. Reuse these tokens and patterns instead of introducing ad-hoc visual decisions.

## Design Philosophy

RailOpt AI is an operational decision-support product, not a generic AI SaaS landing page.

The interface should optimize for:

1. **Operational clarity** — users must quickly understand what is happening, what needs attention, and what action is available.
2. **Safety first** — hard operational and safety constraints must be visually prominent and never hidden behind AI recommendations.
3. **Human-in-the-loop control** — AI recommends; the Planner manages; Departments verify; Control Office gives final operational approval.
4. **Information density without clutter** — railway planning requires schedules, maintenance work, resources, conflicts, priorities, and approvals to coexist on screen.
5. **Fast scanning** — use strong hierarchy, predictable alignment, concise labels, status indicators, and structured tables.
6. **Trustworthy AI** — AI output should look like a recommendation with explainable factors, not an autonomous command.
7. **Consistency** — the same status, priority, action, and data patterns must look and behave the same throughout the application.
8. **Resilience** — online, offline/manual, stale-data, synchronization, and recovery states must be understandable.

## Visual Direction

**Hybrid: modern + operations dashboard.**

Use a modern product foundation with the visual density and precision of a professional operations/control-room dashboard.

- Clean, structured, technical, and trustworthy.
- Desktop-first.
- Dense enough for operational work, but with deliberate whitespace.
- Neutral surfaces with restrained semantic colors.
- Strong emphasis on tables, timelines, filters, status indicators, conflict states, and approval workflows.
- AI should be visually differentiated through a subtle recommendation treatment, not a flashy "AI magic" aesthetic.

Avoid marketing-style layouts, glassmorphism, neon/futuristic AI styling, excessive rounding, and decorative visuals that compete with operational data.

## Colors

These are **new initial design decisions for the greenfield MVP** and are not official Indian Railways colors.

### Light Theme

| Token | Value | Usage |
|---|---|---|
| `--background` | `#F6F8FA` | Application background |
| `--surface` | `#FFFFFF` | Cards, panels, tables |
| `--surface-muted` | `#F1F4F7` | Secondary sections |
| `--surface-hover` | `#E9EEF3` | Hovered rows/items |
| `--border` | `#D7DEE6` | Default borders |
| `--border-strong` | `#B8C3CF` | Strong dividers |
| `--text-primary` | `#17212B` | Main text |
| `--text-secondary` | `#52606D` | Supporting text |
| `--text-muted` | `#71808F` | Metadata |
| `--primary` | `#2563EB` | Primary actions |
| `--primary-hover` | `#1D4ED8` | Primary hover |
| `--info` | `#0EA5A4` | Informational/AI emphasis |
| `--success` | `#16803C` | Approved/success |
| `--warning` | `#B77900` | Warning/attention |
| `--danger` | `#C62828` | Errors/conflicts |

### Dark Theme

| Token | Value | Usage |
|---|---|---|
| `--background` | `#0F141A` | Application background |
| `--surface` | `#171D24` | Cards, panels, tables |
| `--surface-muted` | `#202832` | Secondary sections |
| `--surface-hover` | `#27323D` | Hovered rows/items |
| `--border` | `#303B47` | Default borders |
| `--border-strong` | `#465362` | Strong dividers |
| `--text-primary` | `#F3F6F8` | Main text |
| `--text-secondary` | `#B8C3CD` | Supporting text |
| `--text-muted` | `#8D9AA7` | Metadata |
| `--primary` | `#60A5FA` | Primary actions |
| `--primary-hover` | `#93C5FD` | Primary hover |
| `--info` | `#2DD4BF` | Informational/AI emphasis |
| `--success` | `#4ADE80` | Approved/success |
| `--warning` | `#FBBF24` | Warning/attention |
| `--danger` | `#F87171` | Errors/conflicts |

Never communicate important meaning through color alone.

## Typography

Initial greenfield choice:

`Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Use a monospace/system monospace stack for technical identifiers, timestamps, block IDs, and machine-oriented values where alignment benefits readability.

| Token | Size | Weight |
|---|---:|---:|
| `display` | 30px | 700 |
| `h1` | 24px | 700 |
| `h2` | 20px | 700 |
| `h3` | 16px | 600 |
| `body` | 14px | 400 |
| `body-medium` | 14px | 500 |
| `small` | 12px | 400 |
| `label` | 12px | 600 |
| `caption` | 11px | 500 |

Use sentence case. Avoid unnecessary all-caps. Numeric data should align consistently in tables.

## Spacing

Use a **4px base spacing unit**.

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64px`

Avoid arbitrary one-off spacing values when a scale value works.

## Border Radius

| Token | Value |
|---|---:|
| `--radius-sm` | 4px |
| `--radius-md` | 6px |
| `--radius-lg` | 8px |
| `--radius-xl` | 12px |
| `--radius-pill` | 9999px |

Use pill radius only for status chips.

## Shadows

Use shadows sparingly.

- `--shadow-sm`: `0 1px 2px rgba(15, 20, 26, 0.06)`
- `--shadow-md`: `0 4px 12px rgba(15, 20, 26, 0.10)`
- `--shadow-lg`: `0 12px 30px rgba(15, 20, 26, 0.14)`

In dark mode, prefer borders and surface contrast over large shadows.

## Layout

Use a persistent application shell:

1. Left sidebar.
2. Top bar.
3. Main content.
4. Optional contextual panel.

The primary planning experience should support:

- Page header.
- KPI/summary strip where useful.
- Filters and date controls.
- Timetable/block planning area.
- Supporting conflict/details panel.
- Clear save/finalize/approval actions.

Use a 12-column conceptual grid for complex desktop pages.

Primary information hierarchy:

**Operational status → critical conflicts → planning window → AI recommendation → editable plan → approval/action.**

## Responsive Breakpoints

These are initial greenfield design decisions.

| Breakpoint | Width | Intent |
|---|---:|---|
| `sm` | 640px | Large mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Small desktop |
| `xl` | 1280px | Primary desktop |
| `2xl` | 1536px | Large control-room display |

Desktop/tablet landscape is the primary planning experience.

Dense tables should horizontally scroll rather than becoming unreadable.

## Component Patterns

Core components:

- App shell
- Sidebar
- Top bar
- Page header
- KPI/stat card
- Filter bar
- Status badge
- Priority indicator
- Maintenance request row
- Timetable row
- Block timeline
- Conflict banner
- AI recommendation panel
- Approval stepper
- Sync/offline indicator
- Data table
- Detail drawer
- Confirmation dialog
- Toast/notification

### AI Recommendation

AI output must clearly be a **recommendation**.

Show:

- Recommendation.
- Reasoning factors.
- Constraint result.
- Affected operations.
- Available review/edit actions.

Never present an AI recommendation as final approval.

## Buttons

### Variants

**Primary** — main action.

**Secondary** — important non-primary action.

**Ghost** — low-emphasis/contextual action.

**Danger** — destructive/dangerous action.

Rules:

- One dominant primary action per local context.
- Use action-oriented labels.
- Prevent duplicate submissions while loading.
- Do not imply approval unless the action actually performs approval.

Suggested heights:

- Small: 32px
- Default: 36px
- Large: 40px

## Forms

Forms prioritize accuracy and operational context.

- Every input has a visible label.
- Required fields are clearly marked.
- Validation errors appear near the relevant field.
- Preserve entered data after validation failure.
- Use consistent date/time formats.
- Do not hide critical safety or operational constraints.

Relevant maintenance-request concepts include department, work details, location/asset, duration, priority information, resources, scheduling, and approval state.

Do not invent fields merely for visual completeness.

## Cards

Cards contain related information rather than acting as decoration.

Use cards for:

- KPIs.
- Summaries.
- Recommendations.
- Alerts.
- Grouped details.

Avoid deeply nested cards and excessive card usage.

## Navigation

The sidebar should be role-aware.

Potential modules:

- Dashboard
- Maintenance Requests
- Planning
- Timetable / Conflicts
- Approvals
- Plans
- Data / Synchronization
- Audit Logs
- Settings

Only show implemented modules permitted for the current role.

The active navigation item must be identifiable through more than color alone.

## Modals

Use modals for focused decisions:

- Delete confirmation.
- Finalization confirmation.
- Approval confirmation.
- Focused item review.
- Explicit conflict/safety acknowledgement where required.

Keep dialogs focused on one decision.

Complex planning/editing should use a page or side panel instead of a modal.

## Tables

Tables are a primary RailOpt AI component.

Rules:

- Clear headers.
- Compact but readable rows.
- Consistent date/time formatting.
- Scannable status and priority.
- Sorting/filtering where supported.
- Sticky headers for long tables where appropriate.
- Horizontal scrolling on narrow screens.
- Minimal decorative styling.

Planning tables should make it easy to compare:

- Maintenance work.
- Block time.
- Duration.
- Timetable impact.
- Department/resource allocation.
- Conflicts.
- Approval state.

## Loading States

Use skeletons for known page structures and tables.

For AI optimization:

- Show "Optimization in progress".
- Explain what is being processed at a high level.
- Show progress only when reliable progress information exists.
- Prevent duplicate runs.
- Provide completion/failure state.

Never fabricate percentage progress.

For synchronization, show synchronization state and last successful synchronization time when available.

## Empty States

Empty states should explain context and provide a relevant next action where possible.

Examples:

- No maintenance requests for the selected period.
- No conflicts detected.
- No plan generated yet.
- No synchronized data currently available.

Avoid generic "Nothing here."

## Error States

Distinguish:

- Validation errors.
- Operational conflicts.
- AI optimization failures.
- Synchronization/API failures.
- System errors.

Errors should explain the problem and provide a recovery action where possible.

### Offline

Offline/manual mode must be persistent and unmistakable.

Communicate:

- Offline/unavailable state.
- Latest synchronized data.
- Manual planning availability.
- Required synchronization/reconciliation after recovery.

## Animations

Animations are functional, not decorative.

Use approximately:

- 100–150ms for micro-interactions.
- 150–200ms for panels and state changes.

Appropriate:

- Sidebar expansion.
- Modal/drawer entrance.
- Hover/focus transitions.
- Subtle status changes.

Avoid:

- Bouncing operational elements.
- Constant pulsing.
- Decorative animated backgrounds.
- Large motion around safety/conflict alerts.
- Animations that delay important actions.

Respect `prefers-reduced-motion`.

## Accessibility

Target **WCAG 2.2 AA**.

Requirements:

- Keyboard-accessible controls.
- Visible focus indicators.
- Sufficient contrast.
- No color-only status communication.
- Accessible names for controls.
- Associated form labels.
- Semantic tables.
- Correct modal focus management.
- Assistive-technology-accessible status/error messages.
- Logical heading hierarchy.
- Reduced-motion support.
- No essential information revealed only on hover.

Critical safety and operational constraints must remain understandable without relying on color, animation, or visual-only indicators.

## Do Not

- Do not invent an official Indian Railways visual identity.
- Do not introduce a second visual language.
- Do not use random colors.
- Do not use gradients, glassmorphism, neon AI effects, or decorative futuristic styling as the default.
- Do not make every component heavily rounded.
- Do not use giant marketing cards in operational workflows.
- Do not hide critical conflicts or hard constraints.
- Do not present AI recommendations as autonomous decisions.
- Do not create approval actions for unauthorized roles.
- Do not show fake live railway data as real data.
- Do not invent API connectivity or synchronization status.
- Do not fabricate optimization progress.
- Do not use red/green alone for important states.
- Do not sacrifice table readability for decoration.
- Do not add unnecessary animations.
- Do not create arbitrary spacing, typography, radius, or color values when an existing token works.
- Do not modify UI without first reading `DESIGN.md` and `PRD.md`.