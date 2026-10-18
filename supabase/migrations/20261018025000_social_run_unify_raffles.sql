-- Consolidate the named Social Run wheel-style raffles without affecting actual prizes.
-- A wheel-style presentation is merely a reveal of winners from the existing
-- atomic draw_dynamic RPC. The separate per-QR prize-wheel engine is retained
-- for future dynamics using that specific participation model.
-- No existing active or completed dynamics are rewritten by this migration.

update public.dynamics d
set config = jsonb_set(
  jsonb_set(d.config, '{mechanic}', '"raffle"'::jsonb, true),
  '{presentation}', '"wheel"'::jsonb, true
), updated_at = now()
where d.config->>'source' = 'programa_social_run_18_oct_2026'
  and d.config->>'social_run_plan_key' = 'social-run-2026-10-18-mmtulua-ruleta'
  and d.type = 'raffle'
  and d.status = 'draft'
  and not exists (select 1 from public.dynamic_participations p where p.dynamic_id=d.id)
  and not exists (select 1 from public.dynamic_wheel_spins p where p.dynamic_id=d.id);

-- Existing review flags and the number of winners stay exactly as saved.
-- Improve only obsolete draft descriptions; do not decide unconfirmed rules.
update public.dynamics d
set description = case d.config->>'social_run_plan_key'
  when 'social-run-2026-10-18-mussasg-isometricas' then
    'Resistencia isométrica. El personal registra el tiempo oficial de cada corredor; clasificación por mayor duración. Revisar reglas antes de activar.'
  when 'social-run-2026-10-18-kuulmax-planchas' then
    'Reto de planchas cronometradas. El personal registra tiempos y la clasificación se ordena de mayor a menor. Revisar reglas antes de activar.'
  else d.description end,
updated_at = now()
where d.config->>'source' = 'programa_social_run_18_oct_2026'
  and d.config->>'social_run_plan_key' in (
    'social-run-2026-10-18-mussasg-isometricas',
    'social-run-2026-10-18-kuulmax-planchas'
  )
  and d.status='draft'
  and d.config->>'pending_review' = 'true'
  and not exists (select 1 from public.dynamic_timed_runs r where r.dynamic_id=d.id);

-- Pre-fill supplied trivia questions, but NEVER fabricate answers or mark
-- their approval flags as complete.
update public.dynamics d
set config = jsonb_set(
  d.config,
  '{trivia_question}',
  to_jsonb(case d.config->>'social_run_plan_key'
    when 'social-run-2026-10-18-sa-importaciones-trivia' then
      '¿Cuál fue la última maratón que ganó Eliud Kipchoge?'
    when 'social-run-2026-10-18-sm-shop-trivia' then
      '¿Cuántas ediciones tiene la carrera 10K de la Luz?'
    else '' end),
  true
), updated_at=now()
where d.config->>'source' = 'programa_social_run_18_oct_2026'
  and d.config->>'social_run_plan_key' in (
    'social-run-2026-10-18-sa-importaciones-trivia',
    'social-run-2026-10-18-sm-shop-trivia'
  )
  and d.type='trivia'
  and d.status='draft'
  and nullif(trim(d.config->>'trivia_question'), '') is null
  and not exists (select 1 from public.dynamic_trivia_answers t where t.dynamic_id=d.id);
