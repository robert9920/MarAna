# Mar&Ana - Catálogo Online

Aplicación de catálogo en español para Perú, con frontend React/Vite/Tailwind, backend FastAPI para Vercel Functions y Supabase como base de datos y storage.

## Desarrollo local

Frontend:

```powershell
cd C:\MarAna\frontend
npm install
npm run dev
```

Backend:

```powershell
cd C:\MarAna
python -m uvicorn api.index:app --reload --env-file .env
```

## Variables de entorno

Backend raíz, en `C:\MarAna\.env`:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `WHATSAPP_PHONE`
- `INSTAGRAM_URL`
- `COOKIE_SECURE=false` en local
- `CORS_ORIGINS=http://localhost:5173`

Frontend, en `C:\MarAna\frontend\.env`:

- `VITE_API_BASE_URL=http://localhost:8000/api`
- `VITE_DEMO_MODE=false`
- `VITE_WHATSAPP_PHONE` y `VITE_INSTAGRAM_URL` solo como fallback si el backend no responde.

En producción, Vercel debe recibir las variables del backend y `VITE_API_BASE_URL=/api`.

## Supabase

Si estás creando el proyecto desde cero, ejecuta `supabase/schema.sql`.

Si ya ejecutaste el schema anterior, ejecuta también:

```text
supabase/2026-05-03_feature_images_settings.sql
```

Ese script agrega:

- `category_images`
- `site_settings`
- políticas RLS y grants asociados

## Admin

Ruta: `/admin/login`

El panel permite gestionar categorías, imágenes de categoría, productos, imágenes de producto, stock, visibilidad de stock y ventas. El cashflow simple se calcula usando las ventas registradas en el panel Admin.
