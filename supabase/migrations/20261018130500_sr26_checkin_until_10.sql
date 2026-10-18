-- SR26 check-in stays open until Sunday 18 Oct 2026 at 10:00 America/Bogota (15:00 UTC).
update public.events
set checkin_deadline = timestamptz '2026-10-18 10:00:00-05:00'
where code = 'SR26';
