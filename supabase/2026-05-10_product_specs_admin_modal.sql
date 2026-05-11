alter table public.products
  add column if not exists gender text,
  add column if not exists sizes text[] not null default '{}';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_gender_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_gender_check
      check (gender is null or gender in ('mujer', 'hombre', 'unisex', 'niña', 'niño'));
  end if;
end $$;

alter table public.site_settings
  add column if not exists show_product_specs boolean not null default false;

update public.site_settings
set show_product_specs = false
where show_product_specs is null;

grant select on public.products to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant all on public.products to service_role;
grant all on public.site_settings to service_role;
