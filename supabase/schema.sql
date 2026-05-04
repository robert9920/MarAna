create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  display_order integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  sku text unique,
  slug text not null unique,
  name text not null,
  brand text,
  description text,
  price numeric(12, 2) not null default 0 check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 4 check (low_stock_threshold >= 0),
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  bucket text not null,
  storage_path text not null,
  image_type text not null default 'cutout' check (image_type in ('cutout', 'lifestyle')),
  alt_text text,
  is_primary boolean not null default false,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  unique(bucket, storage_path)
);

create unique index if not exists product_images_one_primary
  on public.product_images(product_id)
  where is_primary;

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

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_code text not null unique default ('V-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  sale_date timestamptz not null default now(),
  channel text not null default 'whatsapp',
  payment_method text,
  gross_total numeric(12, 2) not null default 0,
  discount_total numeric(12, 2) not null default 0,
  net_total numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  unit_cost numeric(12, 2),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  movement_type text not null check (movement_type in ('initial', 'purchase', 'sale', 'return', 'correction')),
  quantity integer not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_login_attempts (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  ip_address text,
  success boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists categories_active_order_idx on public.categories(is_active, display_order);
create index if not exists products_category_status_idx on public.products(category_id, status);
create index if not exists products_featured_idx on public.products(featured) where status = 'active';
create index if not exists product_images_product_idx on public.product_images(product_id, sort_order);
create index if not exists category_images_category_idx on public.category_images(category_id, sort_order);
create index if not exists sales_date_idx on public.sales(sale_date desc);
create index if not exists sale_items_product_idx on public.sale_items(product_id);
create index if not exists inventory_movements_product_date_idx on public.inventory_movements(product_id, created_at desc);
create index if not exists admin_sessions_token_idx on public.admin_sessions(token_hash, expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();


drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

create or replace function public.register_sale(
  p_product_id uuid,
  p_quantity integer,
  p_unit_price numeric,
  p_payment_method text default null,
  p_sale_date timestamptz default now(),
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_sale_id uuid;
  v_line_total numeric(12, 2);
begin
  select * into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Producto no encontrado';
  end if;

  if v_product.stock < p_quantity then
    raise exception 'No hay stock suficiente para registrar esta venta';
  end if;

  v_line_total := p_quantity * p_unit_price;

  insert into public.sales (sale_date, channel, payment_method, gross_total, net_total, notes)
  values (coalesce(p_sale_date, now()), 'whatsapp', p_payment_method, v_line_total, v_line_total, p_notes)
  returning id into v_sale_id;

  insert into public.sale_items (sale_id, product_id, quantity, unit_price, line_total)
  values (v_sale_id, p_product_id, p_quantity, p_unit_price, v_line_total);

  update public.products
  set stock = stock - p_quantity
  where id = p_product_id;

  insert into public.inventory_movements (product_id, movement_type, quantity, reference_type, reference_id, notes)
  values (p_product_id, 'sale', -p_quantity, 'sale', v_sale_id, 'Venta registrada desde panel Admin');

  return jsonb_build_object('id', v_sale_id, 'net_total', v_line_total);
end;
$$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.category_images enable row level security;
alter table public.site_settings enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;
alter table public.admin_login_attempts enable row level security;

drop policy if exists "Lectura publica de categorias activas" on public.categories;
create policy "Lectura publica de categorias activas"
on public.categories for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Lectura publica de productos activos" on public.products;
create policy "Lectura publica de productos activos"
on public.products for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Lectura publica de imagenes de productos activos" on public.product_images;
create policy "Lectura publica de imagenes de productos activos"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.status = 'active'
  )
);

drop policy if exists "Lectura publica de imagenes de categorias activas" on public.category_images;
create policy "Lectura publica de imagenes de categorias activas"
on public.category_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.categories
    where categories.id = category_images.category_id
      and categories.is_active = true
  )
);

drop policy if exists "Lectura publica de configuracion del sitio" on public.site_settings;
create policy "Lectura publica de configuracion del sitio"
on public.site_settings for select
to anon, authenticated
using (id = 1);

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('lifestyle-images', 'lifestyle-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Lectura publica de storage de catalogo" on storage.objects;
create policy "Lectura publica de storage de catalogo"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('product-images', 'lifestyle-images'));

insert into public.categories (name, slug, display_order, is_active)
values
  ('Carteras', 'carteras', 1, true),
  ('Perfumes', 'perfumes', 2, true),
  ('Zapatillas', 'zapatillas', 3, true),
  ('Casacas', 'casacas', 4, true)
on conflict (slug) do update
set name = excluded.name,
    display_order = excluded.display_order,
    is_active = excluded.is_active;

insert into public.site_settings (id, show_exact_stock)
values (1, true)
on conflict (id) do nothing;

grant select on public.categories to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant select on public.category_images to anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant all on public.categories to service_role;
grant all on public.products to service_role;
grant all on public.product_images to service_role;
grant all on public.category_images to service_role;
grant all on public.site_settings to service_role;
grant all on public.sales to service_role;
grant all on public.sale_items to service_role;
grant all on public.inventory_movements to service_role;
grant all on public.admin_users to service_role;
grant all on public.admin_sessions to service_role;
grant all on public.admin_login_attempts to service_role;
grant execute on function public.register_sale(uuid, integer, numeric, text, timestamptz, text) to service_role;
