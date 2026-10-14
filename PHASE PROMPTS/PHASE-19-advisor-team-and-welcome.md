# PHASE 19: "Meet your advisor's team" tab, team editor, Welcome pop-up
**Created:** Oct 14, 2026 in Cowork
**Run (Auto mode, walk away), ONLY AFTER Cowork applies the database change below:** `Read "PHASE PROMPTS/PHASE-19-advisor-team-and-welcome.md" and execute all steps in order.` 5 steps, 5 commits, each pushed to `main`. No checkpoints. No new npm packages.
**Open items:** #56 (this), #57 (Row Level Security, applied with the migration).
**Status:** Done Oct 14, 2026. STEP 1 `98b4189`, STEP 2 `f4688a5`, STEP 3 `327a08e`, STEP 4 `3c6956f`, STEP 5 docs commit (`docs: phase 19 advisor team and welcome`).
**Approved design:** Landing Redesign canvas, row "Advisor team tab + Welcome pop-up": `SunTeam` (participant tab), `SunTeamEdit` (advisor editor), `SunWelcome` (pop-up). Ross approved Oct 14, 2026 after these changes: Book-a-meeting buttons sit at the bottom of every card; color by Role; team tab shaded in the tab bar; one "set up this plan" person. Every value below was copied from those boards and mapped to `theme.ts` tokens.

## Database change (Cowork runs this with Ross's OK BEFORE this phase; Claude Code cannot reach the database)
```sql
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS team_json JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_sessions ENABLE ROW LEVEL SECURITY;
```
The app only uses the server-side service-role key (`lib/supabase-server.ts`), which ignores RLS, so nothing in the app changes. When it's done Cowork writes `MIGRATION-19 APPLIED` (with the date) into OPEN-ITEMS #57.

## Why (Ross, Oct 14)
- A 4th tab after "401(k) terms": "Meet your advisor's team", tied to the advisor who set up the plan. The advisor adds team members: name, title, phone, email, photo, languages spoken, book-a-meeting link. Color shows each person's job function.
- The team tab is shaded so it stands out.
- When an employee opens their plan: a Welcome pop-up over the page with the employer name and the recordkeeper with a website link. Esc, the ×, or a click outside closes it. A "Don't show this again on this device" checkbox.

## Decided (do not re-open in this phase)
- **Team is saved per plan for now** (`plans.team_json`). No advisor logins exist yet (Clerk keys not set; `/advisor` is one shared password), so the plan is the only thing that ties the team to the advisor who set it up. When advisor accounts arrive (#34) the team moves to the advisor's account. Until then anyone with the shared password can edit any plan's team: acceptable while Ross is the only user, must change before real advisors (#34).
- **Color comes from a fixed Role, not the title.** Titles are free text and vary by firm. Roles: `advisor`, `consultant`, `education`, `service`, `support`. Color is never the only cue: the role name is always written on a chip (WCAG 1.4.1).
- **Photos** are resized in the browser to 256 x 256 JPEG and stored inside `team_json` as a data URL (max 80,000 characters each, max 12 people). No new storage bucket. Revisit if pages get slow.
- **Welcome pop-up trigger:** there is no employee login yet. It opens when the plan app first shows (`/p/[plan_id]`, and `/advisor/preview` after a document is read, so Ross can see it), once per page load, unless "Don't show this again on this device" was checked. Later the trigger becomes plan code entry (#31).

## What Cowork checked (`3dd0a56`, Oct 14)
- `components/plansparency/nav.tsx` `TabBar`: 3 tabs (`dashboard`, `calculator`, `keyterms`), `<button aria-current>`, 2px `C.accent` underline when active, icons 16px, label 12px uppercase. Labels from `t.navYourPlan`, `t.navCalculator`, `t.navKeyTerms` (`lib/i18n/index.ts` ~245 EN, ~507 ES).
- `components/PlansparencyApp.tsx`: props interface ~line 63 (has `planId?` already, unused by `/p`); `activeTab` state ~100; panels rendered ~662 to 684; the footer bar ~688 (disclaimer + "clear session" button); `Modal` used for the clear-session dialog with `titleId` + `onClose`.
- `components/plansparency/ui.tsx` `Modal`: focus trap, Escape, returns focus. No click-outside close yet.
- `components/plansparency/KeyTermsPanel.tsx` ~175: the charcoal pinned bar pattern (`className="on-dark"`, `C.bar`, 2px `C.barLine`, shadow `C.shadow`, h1 `C.barText`, subtitle `C.barMuted`). Copy it.
- `app/p/[plan_id]/page.tsx`: selects `*` from `plans`, passes only `initialPdfBase64`, `initialPlanData`, `initialMessages`, `initialStage`. `employer_name` is a column, not in `planData`.
- `planData.recordkeeperName` / `recordkeeperUrl` exist; `PlanOverview.tsx` line 53 only links when the URL starts with `https://`. Reuse that rule.
- `app/advisor/page.tsx`: saved plans list ~388 to 400 (from localStorage), each with copy link + open link. `app/advisor/plans/page.tsx` is a 3-line placeholder.
- `middleware.ts` line 36: `alwaysPrivate` = `/advisor*` and `/api/save-plan` only.
- `app/globals.css` has `.sr-only` (line 65) and the focus ring rules.

## Rules for Claude Code
Same rules as PHASE-07. Auto mode, repo root, stage only named files, no deny-list commands, never `git reset/clean/stash`, never force-push. Checks after each step: `npx tsc --noEmit`, `npm run build`, and every `scripts/check-*.ts` (run with `npx --yes tsx scripts/<name>.ts`), including `check-theme.ts` and `check-a11y.ts`. Colors only from `theme.ts`, fonts from `F`. Follow CLAUDE.md "Accessibility Rules". EN + ES for every participant-facing string (list ES in the report; advisor screens are English only, like today). No em/en dashes.

## STEP 1: Data, validation, save route, privacy

**Check the ground:** latest commit is `3dd0a56` or a later Cowork docs commit; `git status` clean except Cowork docs (`CLAUDE.md`, `CONTEXT.md`, `MEMORY.md`, `ERRORS.md`, `OPEN-ITEMS.md`, `PHASE PROMPTS/`). `OPEN-ITEMS.md` contains `MIGRATION-19 APPLIED`. If not, STOP and report "waiting for the database change".

1. New `lib/team.ts` (shared by server and client, no React):
   - `export const TEAM_ROLES = ['advisor', 'consultant', 'education', 'service', 'support'] as const; export type TeamRole = typeof TEAM_ROLES[number];`
   - `export type TeamMember = { id: string; name: string; role: TeamRole; title: string; phone: string; email: string; langs: { en: boolean; es: boolean; other: string }; booking: string; photo: string; lead: boolean };`
   - `export const MAX_TEAM = 12; export const MAX_PHOTO_CHARS = 80000;`
   - `export function normalizeTeam(raw: unknown): { team: TeamMember[]; errors: string[] }`: not an array -> empty. Per item: trim strings; `name` required, max 80 (drop the item and add an error if empty); `role` not in the list -> `'support'`; `title` max 80; `phone` max 30, only digits, spaces and `+()-.`, else `''` + error; `email` max 120 and must match `/^[^@\s]+@[^@\s]+\.[^@\s]+$/`, else `''` + error; `langs.other` max 60; `booking` max 300 and must start with `https://`, else `''` + error; `photo` must start with `data:image/jpeg;base64,` and be at most `MAX_PHOTO_CHARS`, else `''`; `id` keep if a string of max 40, else `crypto.randomUUID()`; `lead` boolean, and if more than one is true keep only the first. Cut the list at `MAX_TEAM`.
   - `export function telHref(phone: string)` -> `'tel:' + phone.replace(/[^0-9+]/g, '')`.
   - `export function initials(name: string)` -> first letters of the first two words before any comma, uppercase, `'?'` if empty.
2. New route `app/api/plan-team/[plan_id]/route.ts` (Node.js runtime):
   - `GET` -> `{ planName, employerName, team }` from `plans` (`plandata_json->>planName`, `employer_name`, `team_json` run through `normalizeTeam`). 404 if no plan. Validate `plan_id` is a UUID first (400 otherwise).
   - `PUT` body `{ team }` -> `normalizeTeam`; if `errors.length` return 400 `{ errors }`; else update `team_json` and return `{ team }`. Reject bodies over 1.2 MB (413).
   - Same Clerk guard pattern as `app/api/save-plan/route.ts` (only when the Clerk key is set).
3. `middleware.ts`: add `|| pathname.startsWith('/api/plan-team')` to `alwaysPrivate`, and update the comment at the top (rule 1 lists it).
4. `supabase/schema.sql`: add the `team_json` column and the two `ENABLE ROW LEVEL SECURITY` lines, so the file matches the database.
5. New `scripts/check-team.ts` (`// Run with: npx --yes tsx scripts/check-team.ts`), PASS/FAIL style like `check-terms.ts`: valid member kept; empty name dropped with an error; bad email cleared with an error; `http://` booking cleared; unknown role becomes `support`; two leads -> one; 13 members -> 12; png data URL and over-size photo cleared; `telHref('(555) 010-2001')` = `tel:5550102001`; `initials('Jordan Lee, CFP®')` = `JL`.
6. Checks -> `git add lib/team.ts "app/api/plan-team/[plan_id]/route.ts" middleware.ts supabase/schema.sql scripts/check-team.ts` -> commit `feat(team): team data on each plan, validation, private save route` -> push.

## STEP 2: Advisor team editor (board `SunTeamEdit`)

1. `theme.ts`: add role colors (all pairs checked by Cowork: white on `base` 5.17 or more, `text` on `soft` 5.75 or more):
   ```
   export const ROLE = {
     advisor:    { base: "#C2410C", text: "#A3360A", soft: "#FFEDE3" },
     consultant: { base: "#7C3AED", text: "#5B21B6", soft: "#F1EAFE" },
     education:  { base: "#0F766E", text: "#115E59", soft: "#E0F2EF" },
     service:    { base: "#2563EB", text: "#1D4ED8", soft: "#E6EEFE" },
     support:    { base: "#4B5563", text: "#374151", soft: "#EEF0F3" },
   };
   ```
   Add to `C`: `tabShade: "#E5E7EB"`, `tabShadeText: "#374151"`. Extend `scripts/check-theme.ts` contrast list: `#FFFFFF` on each `ROLE.*.base`, each `ROLE.*.text` on its `soft`, `tabShadeText` and `text` on `tabShade` (all 4.5+).
2. New `components/plansparency/RoleChip.tsx`: `<span>` inline-flex, 12px/700, padding 4px 10px, radius 100, `background ROLE[role].soft`, `color ROLE[role].text`, text = role label. Role labels and one-line descriptions (EN + ES) live in `lib/team.ts` as `ROLE_TEXT`:
   | role | EN label | EN "what" | ES label | ES "what" |
   |---|---|---|---|---|
   | advisor | Advisor | Works with your employer to run the plan and pick its investment choices. | Asesor | Trabaja con tu empleador para administrar el plan y elegir sus opciones de inversión. |
   | consultant | Plan consultant | Handles plan setup, rules and paperwork with your employer. | Consultor del plan | Se encarga de la configuración, las reglas y el papeleo del plan con tu empleador. |
   | education | Education | Runs meetings and one-on-ones to help you understand your plan. | Educación | Da reuniones y citas individuales para ayudarte a entender tu plan. |
   | service | Client service | Helps with account questions, forms and getting you to the right person. | Servicio al cliente | Ayuda con preguntas de tu cuenta, formularios y te conecta con la persona indicada. |
   | support | Support | Other team members who help behind the scenes. | Apoyo | Otros miembros del equipo que ayudan detrás de escena. |
   (DRAFT wording, Ross approves with #39.)
3. New shared `components/plansparency/TeamAvatar.tsx`: circle `size` px, `background ROLE[role].base`, `color C.onPrimary`, initials at `Math.round(size/3)`px/700; if `photo`, an `<img src={photo} alt="">` filling the circle (`objectFit: cover`). `aria-hidden` on the initials version.
4. New page `app/advisor/plans/[plan_id]/team/page.tsx` (client), inside the existing advisor shell look (Logo + "For advisors" chip, like `app/advisor/page.tsx` `Header`; reuse `SkipLink` and `<main id="main">`). Copy board `SunTeamEdit`:
   - Back link "← Your plans" to `/advisor` (14px/600 `C.accentText`). H1 "Your team on this plan" (`F.display` 36/700). Intro 16px `C.textMuted`, line-height 1.6, max-width 720: "Employees of **{planName or employerName}** see these people on the “Meet your advisor’s team” tab. Only add people who work with this plan."
   - Two columns `flex-wrap`, gap 28, each `flex: 1 1 420px`.
   - **Left, list:** heading "Team ({n})" 18/700 + "First person shows first" 13px `C.textDim`. Each row: flex, gap 12, padding 12px 14px, radius 14, `C.surface`, border 1px `C.border` (2px `C.text` while that row is being edited), **border-left 6px `ROLE[role].base`**; `TeamAvatar` 48; name 16/700, title 14 `C.textMuted`, `RoleChip`, contact line `phone · email` 13px `C.textDim` (`overflowWrap: anywhere`); buttons ↑ ↓ (40x40, 1px `C.border`, radius 10, `aria-label` "Move {name} up/down", `aria-disabled` + opacity .4 at the ends) and "Edit" (min-height 40, 14/700 `C.accentText`). Below: "+ Add a team member" button (min-height 52, 1px dashed `C.inputBorder`, radius 14, 15/700 `C.accentText`). Footnote 13px `C.textDim`: "For now the team is saved on each plan. When advisor accounts arrive, your team moves to your account and shows on every plan you set up."
   - **Right, form** (`<section aria-labelledby>`; padding 22, radius 16, border 1px `C.border`, background `C.surfaceAlt`, gap 16): title "Add a team member" / "Edit {name}" 18/700. Photo row: `TeamAvatar` 72 + button "Add photo" / "Replace photo" (min-height 40, 1px `C.inputBorder`, radius 10) opening a hidden `<input type="file" accept="image/jpeg,image/png">`, plus "Remove photo" text button when a photo exists; hint 12px `C.textDim` "Square headshot, JPG or PNG. We shrink it to 256 x 256." Resize in the browser: center-crop square, draw to a 256x256 canvas, `toDataURL('image/jpeg', 0.85)`; reject files over 5 MB with an alert-role message.
   - Fields (each a visible `<label>` 14/600 wrapping the input; inputs min-height 44, 1px `C.inputBorder`, radius 10, 16px, `C.field`): "Full name (required)"; "Role (sets the color employees see)" `<select>` with the 5 roles, default `service`, and under it the live `RoleChip` + its "what" line (13px `C.textMuted`); "Title (exactly as you want it shown)" placeholder "e.g. Client Service Associate"; "Phone" (`type="tel"`) and "Email" (`type="email"`) side by side (`repeat(auto-fit, minmax(180px, 1fr))`); fieldset "Languages spoken" with checkboxes English, Español (20x20, `accentColor C.accent`) and "Other languages" text (placeholder "e.g. Vietnamese, Tagalog"); checkbox "Set up this plan on Plansparency (shows a tag, one person only)" (checking it clears it on everyone else); "Book a meeting link" (`type="url"`, placeholder "https://calendly.com/…").
   - Errors under the field, `role="alert"`, 13px `C.danger`: "Add a name." / "That email doesn’t look right. Check for a typo." / "The link must start with https://". Use the same rules as `normalizeTeam` (import them; don't duplicate regexes).
   - Buttons: "Add to team" / "Save changes" (min-height 48, gradient `C.accent`→`C.primaryEnd`, `C.onPrimary`, 15/700, radius 12); "Cancel" (1px `C.border`, `C.surface`); when editing, "Remove from team" text button (15/600 `C.danger`, underline, pushed right).
   - Every add, edit, remove or reorder saves right away with `PUT /api/plan-team/{id}` (the whole list). While saving, disable the buttons. Success: `role="status"` 14/600 `C.green` "Saved. Employees see the change right away." Failure: alert with the server's first error.
   - Load with `GET` on open; "Loading your team…" while waiting; 404 -> "We couldn’t find that plan."
5. `app/advisor/page.tsx` saved-plan rows (~388): add a link "Edit team" (`/advisor/plans/{plan_id}/team`, same style as the existing "open" link) next to the copy and open buttons.
6. Checks -> `git add components/plansparency/theme.ts scripts/check-theme.ts lib/team.ts components/plansparency/RoleChip.tsx components/plansparency/TeamAvatar.tsx "app/advisor/plans/[plan_id]/team/page.tsx" app/advisor/page.tsx` -> commit `feat(team): advisor team editor with roles, photos and order` -> push.

## STEP 3: The 4th tab for employees (board `SunTeam`)

1. `app/p/[plan_id]/page.tsx`: also pass `planId={plan.plan_id}`, `employerName={plan.employer_name ?? ''}` and `initialTeam={normalizeTeam(plan.team_json).team}`. Add `employerName?: string` and `initialTeam?: TeamMember[]` to `PlansparencyAppProps`. `/advisor/preview` passes nothing (team empty, employer unknown).
2. `nav.tsx` `TabBar`: add a 4th tab `id: "team"` after `keyterms`, icon (16px, same stroke rules): `<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.6c3 .2 5.5 2.1 5.5 5.4"/>`. Label: `t.navTeam` ("Meet your advisor’s team" / "Conoce al equipo de tu asesor") on wide screens and `t.navTeamShort` ("Advisor team" / "Equipo del asesor") under 700px (two spans, CSS media query in `globalCss()` or `globals.css`, the hidden one `aria-hidden` and `display: none`; the button's accessible name must stay the long label: set `aria-label={t.navTeam}`). **Shaded tab:** `background C.tabShade`, label `C.tabShadeText` 700 (always bold), bottom border 2px `C.inputBorder` when not active and 2px `C.accent` when active (text `C.text`). Show the tab on every plan; the panel handles an empty team.
3. New `components/plansparency/TeamPanel.tsx` (props `team`, `planName`, `lang`, `t`), scroll container like `KeyTermsPanel`:
   - Pinned bar copied from `KeyTermsPanel` ~175: `className="on-dark"`, `C.bar`, 2px `C.barLine`, shadow `0 8px 20px ${C.shadow}`; inner max-width 1180, padding 16px 20px, gap 4; h1 `t.teamTitle` ("Meet your advisor’s team" / "Conoce al equipo de tu asesor") `F.display` `clamp(20px, 3vw, 26px)`/700, `C.barText`; subtitle 14px `C.barMuted` `t.teamSub(planName)`: "The people who help with the {planName}. Reach out with questions about your plan." / "Las personas que ayudan con el {planName}. Escríbeles si tienes preguntas sobre tu plan." (use "your 401(k)" / "tu 401(k)" when no plan name).
   - Body max-width 1180, padding 28px 20px 48px, gap 20.
   - **Who does what** (only when the team has people): `<section aria-labelledby>`, padding 16px 18px, radius 14, `C.surfaceAlt`; h2 15/700 `t.teamWho` ("Who does what" / "Quién hace qué"); list grid `repeat(auto-fit, minmax(240px, 1fr))`, gap 10px 20px; each row `RoleChip` + the role's "what" (14px, line-height 1.45, `C.textMuted`). Only roles someone on the team has, in `TEAM_ROLES` order.
   - **Cards:** `<ul>` grid `repeat(auto-fill, minmax(260px, 1fr))`, gap 16. Each `<li>`: flex column, gap 14, padding 20, border 1px `C.border`, **border-top 6px `ROLE[role].base`**, radius 16, `C.surface`. Top row: `TeamAvatar` 64 + name `<h2>` 17/700 line-height 1.25 + title 14px `C.textMuted`. Chips row (wrap, gap 6): `RoleChip`; if `lead`, a second chip "Set up your plan on Plansparency" / "Configuró tu plan en Plansparency" (12/600, 1px `C.border`, `C.text`). Languages line if any: "**Speaks:** English, Español, …" / "**Habla:** …" 13px `C.textMuted` (bold part `C.text`). Contact block: **`flexGrow: 1`**, padding-top 12, border-top 1px `C.borderLight`, gap 6: phone link (`telHref`, min-height 32, 15/600, `C.accentText`, phone icon 16 `aria-hidden`, `.sr-only` "Call {name}: " / "Llamar a {name}: ") and email link (`mailto:`, same style, mail icon, `overflowWrap: anywhere`). Booking button last, **so it always sits at the bottom of the card**: `<a target="_blank" rel="noopener noreferrer">` min-height 44, radius 12, gradient `C.accent`→`C.primaryEnd`, `C.onPrimary` 15/700, "Book a meeting ↗" / "Agendar una cita ↗" (arrow `aria-hidden`) + `.sr-only` " with {name} (opens in a new tab)" / " con {name} (se abre en una pestaña nueva)".
   - **Empty team:** `<section>` max-width 640, padding 24, 1px dashed `C.inputBorder`, radius 16; h2 `F.display` 26/700 "Your advisor hasn’t added their team yet" / "Tu asesor aún no ha agregado a su equipo"; text 16px `C.textMuted` "For questions about your account, log in at your recordkeeper. For questions about your plan’s rules, ask HR." / "Para preguntas sobre tu cuenta, entra al sitio de tu administrador del plan. Para preguntas sobre las reglas de tu plan, pregunta a Recursos Humanos."
   - Footnote 13px `C.textDim`, max-width 760: "Team details are added by your plan’s advisor. Plansparency provides education about your plan, not personalized financial advice." / "Los datos del equipo los agrega el asesor de tu plan. Plansparency ofrece educación sobre tu plan, no consejos financieros personalizados."
4. `PlansparencyApp.tsx`: `team` state from `initialTeam` (default `[]`); render `{activeTab === "team" && <TeamPanel … />}` after the keyterms line.
5. Checks -> `git add "app/p/[plan_id]/page.tsx" components/PlansparencyApp.tsx components/plansparency/nav.tsx components/plansparency/TeamPanel.tsx lib/i18n/index.ts` (+ `app/globals.css` if the media query lives there) -> commit `feat(team): Meet your advisor's team tab for employees` -> push.

## STEP 4: Welcome pop-up (board `SunWelcome`)

1. `ui.tsx` `Modal`: add optional `closeOnBackdrop?: boolean` and `closeLabel?: string`. When true, render a full-size `<button type="button" tabIndex={-1} aria-label={closeLabel}>` behind the dialog box (absolute, inset 0, no border, background transparent, cursor pointer) that calls `onClose`. The overlay color stays where it is. The dialog box already has `role="dialog"`, `aria-modal`, `aria-labelledby`, max-width 520 and radius 20 (ui.tsx line 74): add `position: "relative"` (so the × can sit in its corner) and `zIndex: 1` (above the backdrop button). Clear-session dialog keeps its current behavior (no backdrop close).
2. New `components/plansparency/WelcomeDialog.tsx`, inside `Modal` with `titleId="welcome-title"`, `onClose`, `closeOnBackdrop`, `closeLabel={t.welcomeClose}`. Use the existing `Modal` box (max-width 520, radius 20, padding 32px 28px); lay the contents out as a flex column with gap 18. Contents in order:
   - × button top-right (absolute 12/12, 44x44, radius 10, transparent, `C.textMuted`, 26px "×", `aria-label` "Close welcome" / "Cerrar bienvenida").
   - Label 12/700 uppercase `.06em` `C.accentText`: "Welcome" / "Bienvenido". H2 `#welcome-title` `F.display` 32/700 line-height 1.1: "Your 401(k), explained in plain words" / "Tu 401(k), explicado en palabras simples". Right padding 40 so it clears the ×.
   - `<dl>` box (1px `C.borderLight`, radius 14). Row "Your employer" / "Tu empleador" (only if `employerName`): `<dt>` 12/700 uppercase `C.textMuted`; `<dd>` 18/700 employer name; `<dd>` 14px `C.textMuted` plan name. Row "Your recordkeeper" / "Tu administrador del plan" (only if `recordkeeperName`): name 18/700; "They hold your account. Log in there to check your balance or change how much you save." / "Ellos guardan tu cuenta. Entra ahí para ver tu saldo o cambiar cuánto ahorras." 14px `C.textMuted` line-height 1.5; link "Visit their website ↗" / "Visita su sitio web ↗" 15/700 `C.accentText`, new tab, `.sr-only` " (opens in a new tab)" / " (se abre en una pestaña nueva)", only if the URL starts with `https://`. Divider 1px `C.borderLight` between rows.
   - If the team has people: link-style button (min-height 44, 15/600 `C.accentText`) with a 32px `TeamAvatar` of the first person + "Meet {first name} and your advisor’s team →" / "Conoce a {first name} y al equipo de tu asesor →". It closes the dialog and opens the team tab.
   - Primary button "Explore my plan" / "Explorar mi plan" (min-height 52, full width, gradient, `C.onPrimary`, 16/700, radius 12): closes.
   - Checkbox (20x20, `accentColor C.accent`, label 14px `C.text`, min-height 36): "Don’t show this again on this device" / "No mostrar esto de nuevo en este dispositivo".
   - Note 12px `C.textDim`: "Education only, not advice. Press Esc, the ×, or click outside to close." / "Solo educación, no consejos. Presiona Esc, la ×, o haz clic afuera para cerrar."
3. `PlansparencyApp.tsx`:
   - Show the dialog once per page load when `stage === STAGE.APP` and (`employerName` or `planData?.recordkeeperName`) is present, unless `localStorage['plansparency_welcome_hidden_' + (planId || 'preview')] === '1'`. Wrap every localStorage read/write in try/catch (CLAUDE.md); if storage fails, just show it.
   - On any close: if the checkbox is checked, write `'1'` to that key. Announce nothing extra (the dialog title is read on open).
   - Footer bar (~688): add a text button "Welcome info" / "Información de bienvenida" (min-height 36, 12/600, `C.accentText`, transparent, 1px `C.border`, radius 8) before the clear-session button, shown only when the dialog has something to show. It reopens the dialog (ignores the hidden flag).
4. Checks -> `git add components/plansparency/ui.tsx components/plansparency/WelcomeDialog.tsx components/PlansparencyApp.tsx lib/i18n/index.ts` -> commit `feat(welcome): welcome pop-up with employer and recordkeeper, closes on Esc, x or outside click` -> push.

## STEP 5: Docs
1. This file: Status -> Done with the five commit hashes and the date.
2. `OPEN-ITEMS.md` #56 -> "Built (commits), awaiting Cowork review + Ross's click-through". START HERE: "Ross: open `/advisor`, click Edit team on a saved plan (or go to `/advisor/plans/<plan_id>/team`), add 3 people with different roles, one photo, one booking link. Then open `/p/<plan_id>`: Welcome pop-up (Esc, ×, click outside, the checkbox, reload), the shaded 4th tab, cards, Spanish. Keyboard-only once."
3. `MEMORY.md`: "Oct 14, 2026: team saved per plan in `plans.team_json` (validated by `lib/team.ts`); roles drive color (`ROLE` in `theme.ts`); Welcome pop-up hidden per device via localStorage key `plansparency_welcome_hidden_<planId>`."
4. `CONTEXT.md`: add `plans.team_json` and RLS on to the database description; add `/api/plan-team/[plan_id]` (always private) and `/advisor/plans/[plan_id]/team` to the routes list.
5. `git add "PHASE PROMPTS/PHASE-19-advisor-team-and-welcome.md" OPEN-ITEMS.md MEMORY.md CONTEXT.md` (+ any other Cowork doc that changed) -> commit `docs: phase 19 advisor team and welcome` -> push.

## Report back
- Five commit hashes, files per step.
- ES strings added (list).
- How the backdrop close was done in `Modal`.
- Output of `check-team.ts`, `check-theme.ts` (lowest pair), `check-a11y.ts`.
- Anything you couldn't match to the boards and why.

## Checklist (Cowork reviews the diff against the boards before Ross tests)
- [ ] Tab bar: 4 tabs; the 4th is shaded `#E5E7EB`, bold `#374151` text, gray 2px bottom line, coral when active; short label under 700px, full name read by screen readers.
- [ ] Team cards: 6px top strip in the role color; initials circle in the role color (photo replaces it); role chip with the role name; "Set up your plan on Plansparency" chip on one person only.
- [ ] Book-a-meeting buttons line up at the bottom of every card in a row, whatever is above them.
- [ ] "Who does what" lists only roles in use, in order Advisor, Plan consultant, Education, Client service, Support.
- [ ] Empty team shows the dashed box, not a blank page.
- [ ] Phone link dials digits only; email opens mail; booking opens a new tab; all links have spoken context.
- [ ] Editor: every change saves; bad email / http link / missing name blocked with the right message; reorder works; one lead only; photo shrinks to 256 x 256 JPEG.
- [ ] `/api/plan-team/*` asks for the password even if `SITE_PUBLIC=true`.
- [ ] Welcome: shows on `/p/<id>` with employer + recordkeeper; closes on Esc, ×, click outside and "Explore my plan"; focus returns; checkbox keeps it closed after reload; "Welcome info" reopens it; recordkeeper link only if https.
- [ ] Everything works in Spanish; nothing under 12px; all checks pass.
