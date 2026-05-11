# AGENTS.md

## Proyecto

Mar&Ana es un catálogo online para Perú. La web no procesa pagos ni checkout; el cliente revisa productos y consulta por WhatsApp. El panel Admin permite gestionar categorías, productos, stock y ventas. El cashflow del MVP se calcula únicamente con las ventas registradas dentro del panel.

Todo texto visible de la aplicación debe mantenerse en español.

## Estado Actual

Estado verificado actualmente:

- Supabase ya fue creado y configurado.
- `supabase/schema.sql` ya fue ejecutado correctamente en Supabase.
- El catálogo público ya consume datos reales desde Supabase.
- El panel Admin ya consume datos reales desde el backend.
- La app local ya no debe depender de mock data para el flujo normal de desarrollo.
- La conexión local verificada usa frontend en `http://localhost:5173` y backend en `http://localhost:8000`.

## Arquitectura

- `frontend/`: aplicación React + Vite + TailwindCSS.
- `api/`: backend FastAPI preparado para Vercel Functions.
- `supabase/`: SQL para tablas, índices, RLS, buckets y seed inicial.
- `logo/`: logo fuente entregado por el usuario.
- `frontend/public/logo.png`: copia usada por Vite.

Deploy previsto:

- Frontend: Vercel.
- Backend: Vercel Python Functions mediante `api/index.py`.
- Base de datos: Supabase PostgreSQL.
- Storage: Supabase Storage.

## Comandos

Desde la raíz del proyecto:

```powershell
npm install        # Instalar dependencias del frontend
npm run dev        # Iniciar frontend en desarrollo
npm run build      # Build de producción del frontend
npm run preview    # Previsualizar build local
```

Backend:

```powershell
python -m py_compile api/index.py
python -m uvicorn api.index:app --reload --env-file .env
```

Desde `frontend/` (si solo se trabaja en frontend):

```powershell
npm install
npm run dev
npm run build
npm run preview
```

Servidor local verificado:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

Si el puerto `5173` está ocupado en Windows:

```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## Entorno Local Recomendado

Se recomienda usar un entorno aislado para Python, por ejemplo Conda:

```powershell
conda create -n marana python=3.11
conda activate marana
python -m pip install fastapi uvicorn python-multipart pillow supabase argon2-cffi
python -m uvicorn api.index:app --reload --env-file .env
```

Para congelar dependencias del backend:

```powershell
python -m pip freeze > requirements.txt
```

## Variables De Entorno

### Backend local

Crear `.env` en la raíz del proyecto con valores reales:

```text
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxx
ADMIN_USERNAME=admin
ADMIN_PASSWORD=elige-una-contrasena-segura
SESSION_SECRET=cambia-esto-por-un-secreto-largo
WHATSAPP_PHONE=51999999999
INSTAGRAM_URL=https://instagram.com/tu-perfil
COOKIE_SECURE=false
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend local

Crear `frontend/.env` con:

```text
VITE_API_BASE_URL=http://localhost:8000/api
VITE_DEMO_MODE=false
```

### Producción / Vercel

Tomar como base:

```text
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxx
ADMIN_USERNAME=admin
ADMIN_PASSWORD=elige-una-contrasena-segura
SESSION_SECRET=cambia-esto-por-un-secreto-largo
WHATSAPP_PHONE=51999999999
INSTAGRAM_URL=https://instagram.com/tu-perfil
VITE_API_BASE_URL=/api
VITE_DEMO_MODE=false
```

Notas:

- Nunca exponer `SUPABASE_SECRET_KEY` ni `SUPABASE_SERVICE_ROLE_KEY` en el frontend.
- `VITE_API_BASE_URL` puede ser `/api` en Vercel.
- En local, usar `http://localhost:8000/api` para evitar confusión con el servidor de Vite.
- `COOKIE_SECURE=false` en local; en producción debe usarse cookie segura.
- Usar el mismo host en local para frontend y backend cuando se pruebe login Admin, preferentemente `localhost` en ambos.
- En Vercel las variables se configuran en el dashboard (Settings → Environment Variables), no mediante `.env`.

## Frontend

Entrada principal:

- `frontend/src/main.jsx`
- `frontend/src/App.jsx`

Layouts:

- `frontend/src/layouts/PublicLayout.jsx`
- `frontend/src/layouts/AdminLayout.jsx`

Páginas públicas:

- `/`: catálogo con búsqueda, filtro por categoría y filtro por género.
- `/categoria/:slug`: productos por categoría con búsqueda y filtro por género.
- `/producto/:slug`: detalle del producto y botón de WhatsApp.

Páginas Admin:

- `/admin/login`: login.
- `/admin`: dashboard con cashflow simple.
- `/admin/productos`: creación y edición de productos.
- `/admin/categorias`: creación y edición de categorías.
- `/admin/ventas`: registro y listado de ventas.

Componentes relevantes:

- `frontend/src/components/ProductCard.jsx`
- `frontend/src/components/CatalogFilters.jsx`
- `frontend/src/components/admin/ProtectedAdminRoute.jsx`
- `frontend/src/styles.css`: contiene `.form-input-with-icon` para inputs de búsqueda con lupa.

Cliente API y fallback demo:

- `frontend/src/lib/api.js`
- `frontend/src/data/mockData.js`

Configuración actual importante en `frontend/src/lib/api.js`:

- `DEMO_MODE` debe depender solo de `VITE_DEMO_MODE === "true"`.
- No volver a usar `import.meta.env.DEV` para activar demo automáticamente.
- El panel Admin no debe consumir mock data cuando el backend esté disponible.

Formato de moneda y fechas:

- `frontend/src/lib/format.js`
- Moneda: soles peruanos, `S/`.
- Locale: `es-PE`.

Diseño:

- Mantener texto grande, alto contraste y controles amplios.
- Público objetivo principal: compradores de 50+ años.
- Evitar interfaces densas o texto demasiado pequeño.
- Usar botones claros, labels visibles y estados de carga comprensibles.
- Los buscadores con lupa deben usar `form-input form-input-with-icon` para evitar superposición entre icono y texto.
- Los filtros públicos deben seguir siendo responsivos: apilados en móvil y en grilla en escritorio.

## Backend FastAPI

Archivo principal:

- `api/index.py`

Endpoints públicos:

- `GET /api/health`
- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/{slug}`
- `GET /api/site-settings`

Endpoints Admin:

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/{category_id}`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/{product_id}`
- `POST /api/admin/products/{product_id}/images`
- `PUT /api/admin/product-images/{image_id}/primary`
- `DELETE /api/admin/product-images/{image_id}`
- `POST /api/admin/categories/{category_id}/images`
- `DELETE /api/admin/category-images/{image_id}`
- `GET /api/admin/site-settings`
- `PUT /api/admin/site-settings`
- `GET /api/admin/sales`
- `POST /api/admin/sales`
- `DELETE /api/admin/sales/{sale_id}`
- `GET /api/admin/dashboard`

Autenticación:

- Password hashing con Argon2.
- Sesión con token aleatorio.
- Token almacenado hasheado en `admin_sessions`.
- Cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- El usuario inicial se crea solo si no existe y las credenciales coinciden con `ADMIN_USERNAME` y `ADMIN_PASSWORD`.

Subida de imágenes:

- Valida MIME: PNG, JPG, WEBP.
- Límite actual: 5 MB.
- Verifica imagen con Pillow.
- Sube a bucket `product-images` o `lifestyle-images`.

Dependencias backend verificadas:

- `fastapi`
- `uvicorn`
- `python-multipart`
- `pillow`
- `supabase`
- `argon2-cffi`

Zona horaria:

- El dashboard calcula "ventas de hoy" y "ventas del mes" usando hora Perú (UTC-5).
- Constante `PERU_TZ = timezone(timedelta(hours=-5))` y función `now_peru()` en `api/index.py`.
- Las fechas `sale_date` se almacenan como strings naive (sin timezone) interpretados como hora Perú.

## Supabase

Archivo:

- `supabase/schema.sql`

Tablas principales:

- `categories`
- `products`
- `product_images`
- `category_images`
- `site_settings`
- `sales`
- `sale_items`
- `inventory_movements`
- `admin_users`
- `admin_sessions`
- `admin_login_attempts`

Categorías iniciales:

- Carteras
- Perfumes
- Zapatillas
- Casacas

Buckets:

- `product-images`: imágenes transparentes o de producto.
- `lifestyle-images`: imágenes estilo lifestyle o generadas con IA.
- Las imágenes lifestyle ahora pertenecen a categorías mediante `category_images`, no a productos.
- Cada categoría admite hasta 5 imágenes lifestyle desde el panel Admin.
- La portada del catálogo rota entre las imágenes lifestyle disponibles.
- Las imágenes de producto siguen usando `product_images`; una sola imagen por producto debe tener `is_primary=true`.

Migración incremental para proyectos que ya ejecutaron el schema anterior:

- `supabase/2026-05-03_feature_images_settings.sql`

Esta migración agrega:

- `category_images`
- `site_settings`
- RLS y grants para las nuevas tablas.

- `supabase/2026-05-04_feature_delete_sales.sql`

Esta migración agrega:

- Función `delete_sale_with_stock_restore` que elimina una venta y restaura el stock del producto asociado.
- Esta migración debe ejecutarse manualmente en el SQL Editor de Supabase antes del despliegue final.

- `supabase/2026-05-10_product_specs_admin_modal.sql`

Esta migración agrega:

- Campos opcionales `products.gender` y `products.sizes` para sexo y tallas.
- Configuración `site_settings.show_product_specs` para mostrar u ocultar sexo/tallas en las cards del catálogo.
- Grants necesarios para las columnas y configuración nueva.

RLS:

- RLS habilitado en tablas públicas.
- Lectura pública solo para categorías activas, productos activos e imágenes de productos activos.
- Tablas de ventas, admin, sesiones e inventario no tienen políticas públicas de lectura/escritura.
- Escrituras administrativas se hacen desde el backend con secret key.

Función transaccional:

- `public.register_sale(...)`
- Crea venta.
- Crea item de venta.
- Descuenta stock.
- Registra movimiento en `inventory_movements`.
- Rechaza la venta si no hay stock suficiente.

Configuración visual:

- `site_settings.show_exact_stock=true`: el catálogo muestra la cantidad exacta.
- `site_settings.show_exact_stock=false`: el catálogo muestra solo `Disponible` o `Agotado`.
- Esta opción se cambia desde `/admin`, en el panel de resumen.
- `site_settings.show_product_specs=true`: las cards del catálogo muestran sexo y tallas cuando el producto los tiene.
- `site_settings.show_product_specs=false`: las cards no muestran esas especificaciones; el detalle del producto sí puede mostrarlas si existen.

### Importante sobre grants

Como el proyecto fue creado sin exponer automáticamente nuevas tablas y funciones en la Data API, además del schema SQL fue necesario otorgar permisos manuales.

Se deben mantener grants suficientes para:

- Lectura pública desde backend sobre `categories`, `products` y `product_images`.
- Escritura administrativa desde backend sobre tablas de admin, ventas, inventario, categorías, productos e imágenes.
- Ejecución de `public.register_sale(...)` por el rol de backend.

Si se recrean tablas, funciones o vistas nuevas, revisar también sus grants; no basta con RLS.

## Modo Demo Local

El frontend tiene fallback a `localStorage` solo cuando `VITE_DEMO_MODE=true`.

Esto permite probar:

- Catálogo con productos de muestra.
- Login Admin en desarrollo con usuario y contraseña no vacíos.
- Crear categorías y productos localmente.
- Registrar ventas localmente.
- Ver dashboard/cashflow local.

Regla actual:

- Para desarrollo normal conectado a backend real, usar `VITE_DEMO_MODE=false`.
- No volver a activar demo automáticamente por estar en `npm run dev`.
- No usar modo demo en producción.

## Redes Sociales

El número de WhatsApp y la URL de Instagram se exponen al frontend mediante `GET /api/site-settings`, tomando valores del `.env` del backend:

- `WHATSAPP_PHONE`
- `INSTAGRAM_URL`

Las variables `VITE_WHATSAPP_PHONE` y `VITE_INSTAGRAM_URL` quedan solo como fallback para modo local si el backend no responde.

## Verificación Realizada

Verificaciones actuales completadas:

```powershell
npm install
npm run build
python -m py_compile api/index.py
python -m uvicorn api.index:app --reload --env-file .env
```

Resultado verificado:

- `npm install`: completado.
- `npm run build`: build de producción exitoso.
- `python -m py_compile api/index.py`: compilación Python exitosa.
- `GET /api/health`: responde correctamente.
- `GET /api/categories`: responde correctamente desde Supabase real.
- `GET /api/products`: responde correctamente desde Supabase real.
- Catálogo público en `http://localhost:5173`: consume datos reales.
- Admin en `http://localhost:5173/admin`: consume datos reales luego de ajustar `VITE_DEMO_MODE`.
- `npm.cmd run build`: verificado tras agregar filtro por género, corregir buscadores con lupa y simplificar acciones en Admin Productos.
- Navegador integrado: `/` carga sin errores de consola, muestra `Filtrar por género` y el selector cambia correctamente a `Unisex`.

## Reglas Para Futuros Cambios

- Mantener todo texto visible en español.
- No agregar checkout, carrito ni pagos dentro de la web salvo pedido explícito.
- No exponer secretos de Supabase en código frontend.
- No romper el flujo principal: catálogo -> detalle -> WhatsApp.
- No permitir ventas con stock insuficiente.
- Si se cambia el schema, actualizar `supabase/schema.sql` y documentar el cambio.
- Si se agregan tablas, vistas o funciones nuevas en Supabase, revisar también grants y políticas.
- Si se agregan gastos o compras de inventario, mantener separado el cashflow simple de ventas del MVP o migrarlo cuidadosamente.
- Si se mejora Admin, priorizar claridad para usuarios no técnicos.
- Si se agregan dependencias, verificar `npm run build`.
- No volver a reintroducir `import.meta.env.DEV` como activador automático de mock data.
- Para pruebas locales de autenticación, preferir `localhost` en frontend y backend.
- Si se toca la galería, conservar cambio de imagen y zoom en `/producto/:slug`.
- Si se toca el Admin de productos, conservar subida, eliminación y selección de imagen principal.
- El Admin de productos debe usar modal para crear/editar, con gestión de imágenes dentro del modal y columna `Portada` en la tabla.
- En la tabla de Admin Productos, la columna `Acciones` debe mostrar solo `Editar`; no reintroducir botón separado de `Imágenes`.
- Las confirmaciones del Admin deben usar `useToast` con toast fijo montado desde `AdminLayout`.
- Si se toca el Admin de categorías, conservar subida y eliminación de imágenes lifestyle con límite de 5.
- Nunca subir `.env` al repositorio (está en `.gitignore`).
- Usar `useToast` hook para mensajes de éxito/error en el panel Admin.
- Las tablas del Admin deben usar `<colgroup>` para distribuir columnas proporcionalmente.
- Las páginas públicas `/categoria/:slug` rotan imágenes lifestyle del banner cada 3 segundos.
- El filtro por género en catálogo es client-side y se aplica en `/` y `/categoria/:slug`; productos sin `gender` solo aparecen cuando el filtro está en `Todos`.

## Próximos Pasos Recomendados

1. Verificar `.gitignore` asegura que `.env` no se suba al repo (ya configurado).
2. Ejecutar `supabase/2026-05-04_feature_delete_sales.sql` y `supabase/2026-05-10_product_specs_admin_modal.sql` en el SQL Editor de Supabase.
3. Configurar variables de entorno en Vercel (dashboard → Settings → Environment Variables).
4. Desplegar frontend y backend en Vercel.
5. Cargar productos reales e imágenes.
6. Probar una venta real de bajo monto y verificar que "Ventas de hoy" se refleje correctamente en el dashboard.
