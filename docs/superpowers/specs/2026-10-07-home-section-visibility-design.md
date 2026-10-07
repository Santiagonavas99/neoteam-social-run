# Home section visibility

## Problem

The admin can already reorder Home sections, but cannot temporarily remove a section that is no longer needed. Deleting configuration would lose its position and make restoring it harder.

## Decision

Add a persistent `visible` boolean to each configurable Home section. The admin keeps the current up/down ordering controls and gains a clear Visible/Oculta toggle using the existing `Eye` / `EyeOff` icon vocabulary.

Hidden sections stay in the ordered list and preserve their position. The public Home simply skips rendering them. Hero and Footer remain fixed and are not configurable.

## Why

This keeps content management reversible: an admin can hide a section for a campaign or event phase and restore it without rebuilding its position.

## Mobile

The visibility control must have a touch target of at least 44×44 px and work without hover. The section card must remain readable at 390 px.

## Security

The browser does not write Supabase directly. Visibility changes continue through `/api/admin` → `admin-pin`, authenticated as admin. Public access remains read-only under the existing RLS policy.

## Out of scope

- Hiding Hero or Footer.
- Deleting section configuration.
- Drag and drop ordering.
