# Registration running groups — bug fix spec

Date: 2026-10-07 · Branch: `fix/registration-running-groups`

## Production diagnosis

The registration form and the `running_groups` table currently disagree.

### Confirmed production data

Current SR26 registrations:
- 6 rows displayed as **Independiente** have both `running_group_id = null` and `other_running_group = null`.
- 1 ByRunners registration has `running_group_id = null` and `other_running_group = 'ByRunners'`.
- 1 Beer Runners registration has `running_group_id = null` and `other_running_group = 'Beer Runners'`.

There are currently no SR26 registrations linked to the real `Independiente` group row.

### Root cause 1 — Neo Team silently becomes null

The form defaults to `neoteam`.

The production RPC only attempts a relational lookup for:
- `neoteam`
- `independiente`

But the production `running_groups` table contains `independiente` and does **not** contain a `neoteam` row.

The RPC does not reject a failed lookup. It inserts the registration with:
- `running_group_id = null`
- `other_running_group = null`

Every downstream UI then falls back to the label **Independiente**.

Given the current submission paths, the six existing null/null rows correspond to the broken Neo Team path rather than a real independent selection.

### Root cause 2 — listed crews are intentionally downgraded to free text

`features/registration/actions.ts` converts every listed external crew to:
- `p_running_group_slug = 'otro'`
- `p_other_running_group = <crew label>`

Therefore even crews that already exist in `running_groups` are not related through `running_group_id`.

This causes:
- incomplete crew metrics;
- weak relational integrity;
- duplicate naming risk;
- admin data that behaves differently depending on how a crew was selected.

### Root cause 3 — slug drift

The static form list does not match the database:
- form `365-run-club` vs DB `run-365`;
- form `pacifik-runners` vs DB `pacific-runners`;
- form contains `united-runner-club`, DB does not;
- form contains `neoteam`, DB does not.

## Decision

All known crews in the select must be real `running_groups` rows and registrations must store their `running_group_id`.

Only the explicit **Otro grupo / crew** option may use `other_running_group`.

### RPC behavior

For `p_running_group_slug = 'otro'`:
- require a non-empty `p_other_running_group`;
- store no relational crew.

For every other slug:
- look up an active `running_groups` row;
- if it does not exist, **raise an error** instead of silently inserting null;
- store `running_group_id`;
- force `other_running_group = null`.

This includes `independiente`, which remains a normal placeholder row.

## Database normalization

Ensure rows exist for every form option with canonical slugs:
- byrunners
- el-cartel-running-club
- run-365
- neoteam
- pacific-runners
- beer-runners
- integral-fit
- running-social
- united-runner-club
- guabinas-run-club
- pace-running
- independiente

The form uses these exact slugs.

## Existing data repair

After creating `neoteam` and confirming the current data shape:

1. Backfill the 6 SR26 web registrations where both group fields are null to Neo Team.
2. Backfill known free-text registrations to their relational crew when the text matches a known crew name:
   - ByRunners
   - Beer Runners
   - and any other exact known matches found at migration time.
3. Clear `other_running_group` when a relational group is assigned.
4. Never rewrite an explicit free-text crew that does not match a known group.

## Metrics

The existing admin metric counts distinct non-null `running_group_id`. After normalization it will correctly count listed crews.

No metric-code change is required for known crews.

## Form UX

Keep the current visible labels and ordering. This is a data-integrity fix, not a redesign.

The default remains Neo Team for now; after this fix that default will resolve correctly.

## Security

The public registration RPC remains `SECURITY DEFINER` with the same grants and signature. No broader permissions are added.

The new function must fail closed on unknown slugs instead of silently accepting missing relational data.

## Verification

- submit Neo Team → relational Neo Team;
- submit Independiente → relational Independiente;
- submit ByRunners → relational ByRunners;
- submit Run 365 → relational Run 365;
- submit Pacific Runners → relational Pacific Runners;
- submit United Runner Club → relational United Runner Club;
- submit Otro → null relational ID + typed `other_running_group`;
- unknown slug → rejected;
- admin participant display correct;
- group metric counts listed crews.
