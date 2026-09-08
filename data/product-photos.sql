insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "public can read product photos" on storage.objects;
create policy "public can read product photos"
on storage.objects for select
to public
using (bucket_id = 'product-photos');
