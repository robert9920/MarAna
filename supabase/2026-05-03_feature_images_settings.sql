create table if not exists public.category_images (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  bucket text not null default 'lifestyle-images',
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  unique(bucket, storage_path)
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  show_exact_stock boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, show_exact_stock)
values (1, true)
on conflict (id) do nothing;

create index if not exists category_images_category_idx
  on public.category_images(category_id, sort_order);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.category_images enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Lectura publica de imagenes de categorias activas" on public.category_images;
create policy "Lectura publica de imagenes de categorias activas"
on public.category_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.categories
    where categories.id = category_images.category_id
      and categories.is_active = true
  )
);

drop policy if exists "Lectura publica de configuracion del sitio" on public.site_settings;
create policy "Lectura publica de configuracion del sitio"
on public.site_settings for select
to anon, authenticated
using (id = 1);

grant select on public.category_images to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant all on public.category_images to service_role;
grant all on public.site_settings to service_role;
