-- The shop POS bridge places linked items in the aisle named like their shop category (the shop wins).
-- Only the bridge (service role) calls these.

create or replace function public.pos_aisle_info()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'custom', coalesce(description::jsonb -> 'customCategories', '[]'::jsonb),
    'hidden', coalesce(description::jsonb -> 'hiddenAisles', '[]'::jsonb))
  from public.menu_items where id = 'store-visibility-config';
$$;

-- Sets itemAisleKeys for the given linked items ({webId: "section:aisle"}) and gives how many changed.
create or replace function public.pos_place_items(p_keys jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_config jsonb;
  v_keys jsonb;
  v_changed jsonb;
  v_count integer;
begin
  if jsonb_typeof(p_keys) is distinct from 'object' then return 0; end if;
  select description::jsonb into v_config from public.menu_items where id = 'store-visibility-config' for update;
  if v_config is null then return 0; end if;
  v_keys := coalesce(v_config -> 'itemAisleKeys', '{}'::jsonb);
  select coalesce(jsonb_object_agg(k.key, k.value), '{}'::jsonb), count(*)
    into v_changed, v_count
    from jsonb_each(p_keys) k
    join public.menu_items m on m.id = k.key and m.pos_linked
   where jsonb_typeof(k.value) = 'string'
     and k.value #>> '{}' ~ '^[a-z0-9-]+:[a-z0-9-]+$'
     and (v_keys -> k.key) is distinct from k.value;
  if v_count = 0 then return 0; end if;
  update public.menu_items
     set description = jsonb_set(v_config, '{itemAisleKeys}', v_keys || v_changed)::text
   where id = 'store-visibility-config';
  return v_count;
end;
$$;

revoke all on function public.pos_aisle_info() from public, anon, authenticated;
revoke all on function public.pos_place_items(jsonb) from public, anon, authenticated;
grant execute on function public.pos_aisle_info() to service_role;
grant execute on function public.pos_place_items(jsonb) to service_role;
