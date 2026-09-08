create table if not exists store_visibility (
  kind text not null check (kind in ('section', 'aisle')),
  slug text not null,
  hidden boolean not null default false,
  primary key (kind, slug)
);

alter table store_visibility enable row level security;

drop policy if exists "store_visibility_public_read" on store_visibility;
create policy "store_visibility_public_read"
  on store_visibility for select
  using (true);

insert into store_visibility (kind, slug, hidden)
values ('aisle', 'cosmetics', true)
on conflict (kind, slug) do nothing;
