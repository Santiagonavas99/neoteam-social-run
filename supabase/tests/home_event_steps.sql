create table public.home_section_order (
 event_code text not null, section_key text not null, sort_order integer not null,
 visible boolean not null default true,
 primary key (event_code, section_key),
 constraint home_section_order_key_check check (section_key in ('story','numbers','agenda'))
);
insert into public.home_section_order(event_code,section_key,sort_order,visible)
values ('SR26','story',1,true),('SR26','numbers',2,true),('SR26','agenda',5,false);
\ir ../migrations/20261009120000_home_event_steps.sql
\ir ../migrations/20261009120000_home_event_steps.sql
do $$
begin
 assert (select count(*) from public.home_section_order where section_key='steps')=1,
 'steps must be added exactly once';
 assert (select sort_order from public.home_section_order where section_key='steps')=2,
 'steps must appear early in default ordering';
 assert (select visible from public.home_section_order where section_key='agenda')=false,
 'existing visibility must be preserved';
 assert (select sort_order from public.home_section_order where section_key='numbers')=2,
 'existing custom order must be preserved';
end $$;
