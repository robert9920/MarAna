import hashlib
import hmac
import os
import secrets
import unicodedata
from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import Any

from argon2 import PasswordHasher
from fastapi import Cookie, Depends, FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field, field_validator
from supabase import Client, create_client

PERU_TZ = timezone(timedelta(hours=-5))

app = FastAPI(title="Mar&Ana API", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()] or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ph = PasswordHasher()
SESSION_COOKIE = "marana_session"
SESSION_DAYS = 7
VALID_GENDERS = {"mujer", "hombre", "unisex", "niña", "niño"}


def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise HTTPException(status_code=503, detail="Supabase no está configurado.")
    return create_client(url, key)


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value.lower())
    without_accents = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    slug = "".join(ch if ch.isalnum() else "-" for ch in without_accents)
    return "-".join(part for part in slug.split("-") if part)


def hash_token(token: str) -> str:
    secret = os.getenv("SESSION_SECRET", "dev-session-secret")
    return hmac.new(secret.encode(), token.encode(), hashlib.sha256).hexdigest()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def now_peru() -> datetime:
    return datetime.now(PERU_TZ)


class LoginPayload(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class CategoryPayload(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    display_order: int = Field(default=1, ge=1)
    is_active: bool = True


class ProductPayload(BaseModel):
    category_id: str
    name: str = Field(min_length=2, max_length=180)
    brand: str | None = Field(default=None, max_length=120)
    price: float = Field(ge=0)
    stock: int = Field(ge=0)
    description: str | None = None
    status: str = "active"
    featured: bool = False
    gender: str | None = Field(default=None, max_length=20)
    sizes: list[str] = Field(default_factory=list)

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, value: str | None) -> str | None:
        if not value:
            return None
        normalized = value.strip().lower()
        if normalized not in VALID_GENDERS:
            raise ValueError("Sexo de producto no válido.")
        return normalized

    @field_validator("sizes")
    @classmethod
    def normalize_sizes(cls, value: list[str]) -> list[str]:
        clean_sizes = []
        for item in value or []:
            text = str(item).strip()
            if text and text not in clean_sizes:
                clean_sizes.append(text[:30])
        return clean_sizes


class SalePayload(BaseModel):
    product_id: str
    quantity: int = Field(ge=1)
    unit_price: float = Field(ge=0)
    payment_method: str | None = None
    sale_date: str | None = None
    notes: str | None = None


class SiteSettingsPayload(BaseModel):
    show_exact_stock: bool = True
    show_product_specs: bool = False


def normalize_storage_row(row: dict[str, Any]) -> dict[str, Any]:
    public_url_base = os.getenv("SUPABASE_URL", "").rstrip("/")
    bucket = row.get("bucket")
    storage_path = row.get("storage_path")
    image_url = row.get("image_url")
    if not image_url and public_url_base and bucket and storage_path:
        image_url = f"{public_url_base}/storage/v1/object/public/{bucket}/{storage_path}"
    return {**row, "image_url": image_url}


def normalize_product(row: dict[str, Any]) -> dict[str, Any]:
    category = row.get("categories") or {}
    images = row.get("product_images") or []
    return {
        **row,
        "category_name": category.get("name"),
        "category_slug": category.get("slug"),
        "images": [normalize_storage_row(image) for image in sorted(images, key=lambda item: item.get("sort_order") or 0)],
    }


def normalize_category(row: dict[str, Any]) -> dict[str, Any]:
    images = row.get("category_images") or []
    return {
        **row,
        "images": [normalize_storage_row(image) for image in sorted(images, key=lambda item: item.get("sort_order") or 0)],
    }


def get_site_settings() -> dict[str, Any]:
    supabase = get_supabase()
    result = supabase.table("site_settings").select("*").eq("id", 1).limit(1).execute()
    row = result.data[0] if result.data else {"show_exact_stock": True, "show_product_specs": False}
    return {
        "show_exact_stock": bool(row.get("show_exact_stock", True)),
        "show_product_specs": bool(row.get("show_product_specs", False)),
        "whatsapp_phone": os.getenv("WHATSAPP_PHONE", "51999999999"),
        "instagram_url": os.getenv("INSTAGRAM_URL", ""),
    }


def ensure_image_file(file: UploadFile, raw: bytes) -> None:
    if file.content_type not in {"image/png", "image/jpeg", "image/webp"}:
        raise HTTPException(status_code=400, detail="Solo se permiten imágenes PNG, JPG o WEBP.")
    if len(raw) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no debe superar 5 MB.")
    try:
        image = Image.open(BytesIO(raw))
        image.verify()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida.") from exc


def file_extension(file: UploadFile) -> str:
    if file.content_type == "image/webp":
        return "webp"
    if file.content_type == "image/png":
        return "png"
    return "jpg"


async def require_admin(session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE)) -> dict[str, Any]:
    if not session_token:
        raise HTTPException(status_code=401, detail="Debes iniciar sesión.")
    supabase = get_supabase()
    token_hash = hash_token(session_token)
    result = (
        supabase.table("admin_sessions")
        .select("*, admin_users(id, username)")
        .eq("token_hash", token_hash)
        .gte("expires_at", now_utc().isoformat())
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=401, detail="La sesión no es válida.")
    return result.data[0]["admin_users"]


def bootstrap_admin_if_needed(supabase: Client, username: str, password: str) -> dict[str, Any] | None:
    existing = supabase.table("admin_users").select("*").eq("username", username).limit(1).execute()
    if existing.data:
        return existing.data[0]
    env_username = os.getenv("ADMIN_USERNAME", "admin")
    env_password = os.getenv("ADMIN_PASSWORD")
    if not env_password or username != env_username:
        return None
    password_hash = ph.hash(env_password)
    created = supabase.table("admin_users").insert({"username": env_username, "password_hash": password_hash, "is_active": True}).execute()
    return created.data[0] if created.data else None


@app.get("/api/health")
def health():
    return {"ok": True, "service": "Mar&Ana API"}


@app.get("/api/site-settings")
def public_site_settings():
    return get_site_settings()


@app.get("/api/categories")
def list_public_categories():
    supabase = get_supabase()
    result = supabase.table("categories").select("*, category_images(*)").eq("is_active", True).order("display_order").execute()
    return [normalize_category(row) for row in result.data]


@app.get("/api/products")
def list_public_products(category: str | None = None, q: str | None = None):
    supabase = get_supabase()
    query = (
        supabase.table("products")
        .select("*, categories(name, slug), product_images(*)")
        .eq("status", "active")
        .order("created_at", desc=True)
    )
    if category:
        category_result = supabase.table("categories").select("id").eq("slug", category).limit(1).execute()
        if not category_result.data:
            return []
        query = query.eq("category_id", category_result.data[0]["id"])
    if q:
        query = query.or_(f"name.ilike.%{q}%,brand.ilike.%{q}%,description.ilike.%{q}%")
    result = query.execute()
    return [normalize_product(row) for row in result.data]


@app.get("/api/products/{slug}")
def get_public_product(slug: str):
    supabase = get_supabase()
    result = (
        supabase.table("products")
        .select("*, categories(name, slug), product_images(*)")
        .eq("slug", slug)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    return normalize_product(result.data[0])


@app.post("/api/admin/login")
def login(payload: LoginPayload, response: Response):
    supabase = get_supabase()
    admin = bootstrap_admin_if_needed(supabase, payload.username, payload.password)
    if not admin or not admin.get("is_active"):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.")
    try:
        ph.verify(admin["password_hash"], payload.password)
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos.") from exc

    token = secrets.token_urlsafe(48)
    expires_at = now_utc() + timedelta(days=SESSION_DAYS)
    supabase.table("admin_sessions").insert(
        {"admin_user_id": admin["id"], "token_hash": hash_token(token), "expires_at": expires_at.isoformat()}
    ).execute()
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "true").lower() == "true",
        samesite="lax",
        max_age=SESSION_DAYS * 24 * 60 * 60,
        path="/",
    )
    return {"ok": True, "username": admin["username"]}


@app.post("/api/admin/logout")
def logout(response: Response, session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE)):
    if session_token:
        get_supabase().table("admin_sessions").delete().eq("token_hash", hash_token(session_token)).execute()
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


@app.get("/api/admin/session")
def session(admin=Depends(require_admin)):
    return {"ok": True, "username": admin["username"]}


@app.get("/api/admin/site-settings")
def admin_site_settings(admin=Depends(require_admin)):
    return get_site_settings()


@app.put("/api/admin/site-settings")
def update_site_settings(payload: SiteSettingsPayload, admin=Depends(require_admin)):
    supabase = get_supabase()
    row = {
        "id": 1,
        "show_exact_stock": payload.show_exact_stock,
        "show_product_specs": payload.show_product_specs,
        "updated_at": now_utc().isoformat(),
    }
    result = supabase.table("site_settings").upsert(row).execute()
    saved = result.data[0] if result.data else row
    return {
        "show_exact_stock": saved["show_exact_stock"],
        "show_product_specs": saved.get("show_product_specs", False),
        "whatsapp_phone": os.getenv("WHATSAPP_PHONE", "51999999999"),
        "instagram_url": os.getenv("INSTAGRAM_URL", ""),
    }


@app.get("/api/admin/categories")
def admin_categories(admin=Depends(require_admin)):
    result = get_supabase().table("categories").select("*, category_images(*)").order("display_order").execute()
    return [normalize_category(row) for row in result.data]


@app.post("/api/admin/categories")
def create_category(payload: CategoryPayload, admin=Depends(require_admin)):
    row = payload.model_dump()
    row["slug"] = slugify(payload.name)
    return get_supabase().table("categories").insert(row).execute().data[0]


@app.put("/api/admin/categories/{category_id}")
def update_category(category_id: str, payload: CategoryPayload, admin=Depends(require_admin)):
    row = payload.model_dump()
    row["slug"] = slugify(payload.name)
    return get_supabase().table("categories").update(row).eq("id", category_id).execute().data[0]


@app.post("/api/admin/categories/{category_id}/images")
async def upload_category_image(category_id: str, file: UploadFile = File(...), admin=Depends(require_admin)):
    raw = await file.read()
    ensure_image_file(file, raw)
    supabase = get_supabase()
    count_result = supabase.table("category_images").select("id").eq("category_id", category_id).execute()
    if len(count_result.data or []) >= 5:
        raise HTTPException(status_code=400, detail="Cada categoría puede tener máximo 5 imágenes lifestyle.")
    image_id = secrets.token_hex(12)
    storage_path = f"categories/{category_id}/lifestyle/{image_id}.{file_extension(file)}"
    supabase.storage.from_("lifestyle-images").upload(storage_path, raw, {"content-type": file.content_type})
    row = {
        "category_id": category_id,
        "bucket": "lifestyle-images",
        "storage_path": storage_path,
        "alt_text": file.filename,
        "sort_order": len(count_result.data or []) + 1,
    }
    created = supabase.table("category_images").insert(row).execute().data[0]
    return normalize_storage_row(created)


@app.delete("/api/admin/category-images/{image_id}")
def delete_category_image(image_id: str, admin=Depends(require_admin)):
    supabase = get_supabase()
    result = supabase.table("category_images").select("*").eq("id", image_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Imagen no encontrada.")
    image = result.data[0]
    supabase.storage.from_(image["bucket"]).remove([image["storage_path"]])
    supabase.table("category_images").delete().eq("id", image_id).execute()
    return {"ok": True}


@app.get("/api/admin/products")
def admin_products(admin=Depends(require_admin)):
    result = get_supabase().table("products").select("*, categories(name, slug), product_images(*)").order("created_at", desc=True).execute()
    return [normalize_product(row) for row in result.data]


@app.post("/api/admin/products")
def create_product(payload: ProductPayload, admin=Depends(require_admin)):
    row = payload.model_dump()
    row["slug"] = slugify(payload.name)
    return get_supabase().table("products").insert(row).execute().data[0]


@app.put("/api/admin/products/{product_id}")
def update_product(product_id: str, payload: ProductPayload, admin=Depends(require_admin)):
    row = payload.model_dump()
    row["slug"] = slugify(payload.name)
    return get_supabase().table("products").update(row).eq("id", product_id).execute().data[0]


@app.post("/api/admin/products/{product_id}/images")
async def upload_product_image(
    product_id: str,
    image_type: str = Form("cutout"),
    is_primary: bool = Form(False),
    file: UploadFile = File(...),
    admin=Depends(require_admin),
):
    raw = await file.read()
    ensure_image_file(file, raw)
    bucket = "product-images"
    image_id = secrets.token_hex(12)
    storage_path = f"products/{product_id}/{image_type}/{image_id}.{file_extension(file)}"
    supabase = get_supabase()
    existing = supabase.table("product_images").select("id").eq("product_id", product_id).limit(1).execute()
    supabase.storage.from_(bucket).upload(storage_path, raw, {"content-type": file.content_type})
    row = {
        "product_id": product_id,
        "bucket": bucket,
        "storage_path": storage_path,
        "image_type": image_type,
        "is_primary": False,
        "sort_order": 1,
        "alt_text": file.filename,
    }
    created = supabase.table("product_images").insert(row).execute().data[0]
    if is_primary or not existing.data:
        set_product_primary_image(created["id"], admin)
        created["is_primary"] = True
    return normalize_storage_row(created)


@app.put("/api/admin/product-images/{image_id}/primary")
def set_product_primary_image(image_id: str, admin=Depends(require_admin)):
    supabase = get_supabase()
    image_result = supabase.table("product_images").select("*").eq("id", image_id).limit(1).execute()
    if not image_result.data:
        raise HTTPException(status_code=404, detail="Imagen no encontrada.")
    image = image_result.data[0]
    supabase.table("product_images").update({"is_primary": False}).eq("product_id", image["product_id"]).execute()
    updated = supabase.table("product_images").update({"is_primary": True}).eq("id", image_id).execute().data[0]
    return normalize_storage_row(updated)


@app.delete("/api/admin/product-images/{image_id}")
def delete_product_image(image_id: str, admin=Depends(require_admin)):
    supabase = get_supabase()
    result = supabase.table("product_images").select("*").eq("id", image_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Imagen no encontrada.")
    image = result.data[0]
    supabase.storage.from_(image["bucket"]).remove([image["storage_path"]])
    supabase.table("product_images").delete().eq("id", image_id).execute()
    if image.get("is_primary"):
        next_image = supabase.table("product_images").select("*").eq("product_id", image["product_id"]).order("created_at").limit(1).execute()
        if next_image.data:
            supabase.table("product_images").update({"is_primary": True}).eq("id", next_image.data[0]["id"]).execute()
    return {"ok": True}


@app.get("/api/admin/sales")
def list_sales(admin=Depends(require_admin)):
    result = (
        get_supabase()
        .table("sales")
        .select("*, sale_items(*, products(name))")
        .order("sale_date", desc=True)
        .execute()
    )
    sales = []
    for sale in result.data:
        items = []
        for item in sale.get("sale_items") or []:
            items.append({**item, "product_name": (item.get("products") or {}).get("name")})
        sales.append({**sale, "items": items})
    return sales


@app.post("/api/admin/sales")
def create_sale(payload: SalePayload, admin=Depends(require_admin)):
    sale_date = payload.sale_date or now_utc().isoformat()
    result = get_supabase().rpc(
        "register_sale",
        {
            "p_product_id": payload.product_id,
            "p_quantity": payload.quantity,
            "p_unit_price": payload.unit_price,
            "p_payment_method": payload.payment_method,
            "p_sale_date": sale_date,
            "p_notes": payload.notes,
        },
    ).execute()
    return result.data


@app.delete("/api/admin/sales/{sale_id}")
def delete_sale(sale_id: str, admin=Depends(require_admin)):
    get_supabase().rpc("delete_sale_with_stock_restore", {"p_sale_id": sale_id}).execute()
    return {"ok": True}


@app.get("/api/admin/dashboard")
def dashboard(admin=Depends(require_admin)):
    supabase = get_supabase()
    now = now_peru()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).replace(tzinfo=None)
    sales = supabase.table("sales").select("*, sale_items(quantity)").gte("sale_date", month_start.isoformat()).execute().data
    products = supabase.table("products").select("*").lte("stock", 4).order("stock").limit(8).execute().data
    today_total = sum(float(sale["net_total"]) for sale in sales if sale["sale_date"] >= today_start.isoformat())
    month_total = sum(float(sale["net_total"]) for sale in sales)
    units_sold = sum(sum(int(item["quantity"]) for item in sale.get("sale_items") or []) for sale in sales)
    daily: dict[str, float] = {}
    for sale in sales:
        key = sale["sale_date"][:10]
        daily[key] = daily.get(key, 0) + float(sale["net_total"])
    return {
        "today_total": today_total,
        "month_total": month_total,
        "sales_count": len(sales),
        "units_sold": units_sold,
        "low_stock": products,
        "top_products": [],
        "daily_sales": [{"date": key, "total": value} for key, value in sorted(daily.items())],
    }
