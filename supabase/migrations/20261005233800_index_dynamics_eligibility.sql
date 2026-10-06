create index if not exists dynamics_eligibility_dynamic_idx
  on public.dynamics(eligibility_dynamic_id)
  where eligibility_dynamic_id is not null;
