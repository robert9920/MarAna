import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Images, Maximize2, Pencil, Plus, Save, Search, Star, Trash2, X } from "lucide-react";
import { adminApi } from "../../lib/api.js";
import { formatCurrency, formatGender, normalizeSizesInput, productImageUrl, sizesToInput } from "../../lib/format.js";
import { useToast } from "../../hooks/useToast.js";

const emptyProduct = {
  category_id: "",
  name: "",
  brand: "",
  price: 0,
  stock: 0,
  description: "",
  status: "active",
  featured: false,
  gender: "",
  sizes: [],
  images: []
};

const genderOptions = [
  { value: "", label: "Sin especificar" },
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "unisex", label: "Unisex" },
  { value: "niña", label: "Niña" },
  { value: "niño", label: "Niño" }
];

export function AdminProductsPage() {
  const categoriesQuery = useQuery({ queryKey: ["admin-categories"], queryFn: adminApi.categories });
  const productsQuery = useQuery({ queryKey: ["admin-products"], queryFn: adminApi.products });
  const [categoryFilter, setCategoryFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [modalProduct, setModalProduct] = useState(null);
  const { showToast } = useToast();
  const categories = categoriesQuery.data || [];
  const products = productsQuery.data || [];

  const filteredProducts = useMemo(() => {
    const q = productFilter.trim().toLowerCase();
    return products
      .filter((product) => !categoryFilter || product.category_id === categoryFilter)
      .filter((product) => !q || `${product.name} ${product.brand || ""}`.toLowerCase().includes(q));
  }, [categoryFilter, productFilter, products]);

  function openCreateModal() {
    setModalProduct({
      ...emptyProduct,
      category_id: categoryFilter || categories[0]?.id || ""
    });
  }

  function openEditModal(product) {
    setModalProduct({
      ...emptyProduct,
      ...product,
      gender: product.gender || "",
      sizes: product.sizes || [],
      images: product.images || []
    });
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-cafe">Productos</h1>
          <p className="mt-1 text-sm text-stone-600">Filtra, crea, edita y gestiona imágenes sin perder el contexto de la tabla.</p>
        </div>
        <button className="btn-primary w-fit" disabled={!categories.length} onClick={openCreateModal} type="button">
          <Plus className="h-3.5 w-3.5" />
          Crear producto
        </button>
      </div>

      <section className="panel p-3">
        <div className="grid gap-2.5 md:grid-cols-[260px_1fr]">
          <label>
            <span className="form-label">Filtrar por categoría</span>
            <select className="form-input" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="form-label">Buscar producto</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                className="form-input form-input-with-icon"
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value)}
                placeholder="Escribe nombre o marca"
              />
            </div>
          </label>
        </div>
      </section>

      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[28%]" />
            <col className="w-[16%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead className="bg-stone-50">
            <tr>
              <th className="table-cell">Portada</th>
              <th className="table-cell">Producto</th>
              <th className="table-cell">Categoría</th>
              <th className="table-cell">Precio</th>
              <th className="table-cell">Stock</th>
              <th className="table-cell">Estado</th>
              <th className="table-cell">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const imageUrl = productImageUrl(product);
              const gender = formatGender(product.gender);
              return (
                <tr key={product.id}>
                  <td className="table-cell">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                      {imageUrl ? (
                        <img className="h-full w-full object-contain p-1" src={imageUrl} alt={product.name} />
                      ) : (
                        <Images className="h-5 w-5 text-stone-400" />
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <p className="font-bold text-cafe">{product.name}</p>
                    <p className="text-stone-600">{product.brand || "Mar&Ana"}</p>
                    {gender || product.sizes?.length ? (
                      <p className="mt-1 text-[11px] font-bold text-stone-500">
                        {[gender ? `Sexo: ${gender}` : "", product.sizes?.length ? `Tallas: ${product.sizes.join(", ")}` : ""].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                  </td>
                  <td className="table-cell">{product.category_name || categories.find((category) => category.id === product.category_id)?.name}</td>
                  <td className="table-cell font-bold">{formatCurrency(product.price)}</td>
                  <td className="table-cell">{product.stock}</td>
                  <td className="table-cell">{product.status === "active" ? "Activo" : "No visible"}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      <button className="btn-secondary" onClick={() => openEditModal(product)} type="button">
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {productsQuery.isLoading ? <div className="panel p-4 text-center text-sm font-bold text-cafe">Cargando productos...</div> : null}
      {!filteredProducts.length && !productsQuery.isLoading ? (
        <div className="panel p-4 text-center text-sm font-bold text-cafe">No hay productos que coincidan con los filtros.</div>
      ) : null}

      {modalProduct ? (
        <ProductModal
          categories={categories}
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          setProduct={setModalProduct}
          showToast={showToast}
        />
      ) : null}
    </div>
  );
}

function ProductModal({ categories, product, onClose, setProduct, showToast }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({
    ...emptyProduct,
    ...product,
    gender: product.gender || "",
    sizesInput: sizesToInput(product.sizes || [])
  }));
  const [zoomImage, setZoomImage] = useState(null);
  const isEditing = Boolean(form.id);
  const canSave = Boolean(form.name?.trim() && form.category_id);

  const mutation = useMutation({
    mutationFn: adminApi.saveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      showToast(isEditing ? "Producto actualizado correctamente." : "Producto creado correctamente.");
      onClose();
    },
    onError: () => showToast(isEditing ? "No se pudo actualizar el producto. Inténtalo de nuevo." : "No se pudo crear el producto. Inténtalo de nuevo.", "error")
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!canSave) return;
    mutation.mutate({
      id: form.id,
      category_id: form.category_id,
      name: form.name.trim(),
      brand: form.brand?.trim() || null,
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      description: form.description?.trim() || "",
      status: form.status || "active",
      featured: Boolean(form.featured),
      gender: form.gender || null,
      sizes: normalizeSizesInput(form.sizesInput)
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-2 sm:p-4">
      <form className="flex max-h-[92vh] w-full max-w-[900px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onSubmit={submit}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
          <div>
            <h2 className="text-xl font-black text-cafe">{isEditing ? "Editar producto" : "Crear producto"}</h2>
            <p className="text-xs text-stone-600">Datos, especificaciones e imágenes en una sola ventana.</p>
          </div>
          <button className="rounded-lg p-2 text-cafe hover:bg-stone-100" onClick={onClose} type="button" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-4 overflow-y-auto px-4 py-4">
          <section className="grid gap-2.5">
            <h3 className="text-sm font-black uppercase tracking-wide text-dorado">Datos básicos</h3>
            <div className="grid gap-2.5 md:grid-cols-2">
              <label>
                <span className="form-label">Nombre del producto</span>
                <input className="form-input" value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
              </label>
              <label>
                <span className="form-label">Categoría</span>
                <select className="form-input" value={form.category_id} onChange={(event) => updateField("category_id", event.target.value)} required>
                  <option value="">Selecciona categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="form-label">Marca</span>
                <input className="form-input" value={form.brand || ""} onChange={(event) => updateField("brand", event.target.value)} />
              </label>
              <label>
                <span className="form-label">Precio de venta (S/)</span>
                <input className="form-input" min="0" step="0.01" type="number" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
              </label>
              <label>
                <span className="form-label">Stock</span>
                <input className="form-input" min="0" type="number" value={form.stock} onChange={(event) => updateField("stock", event.target.value)} />
              </label>
              <label>
                <span className="form-label">Estado</span>
                <select className="form-input" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option value="active">Activo</option>
                  <option value="draft">Borrador</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
            </div>
            <label>
              <span className="form-label">Descripción</span>
              <textarea className="form-input min-h-24" value={form.description || ""} onChange={(event) => updateField("description", event.target.value)} />
            </label>
          </section>

          <section className="grid gap-2.5">
            <h3 className="text-sm font-black uppercase tracking-wide text-dorado">Especificaciones opcionales</h3>
            <div className="grid gap-2.5 md:grid-cols-2">
              <label>
                <span className="form-label">Sexo</span>
                <select className="form-input" value={form.gender || ""} onChange={(event) => updateField("gender", event.target.value)}>
                  {genderOptions.map((option) => (
                    <option key={option.value || "none"} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="form-label">Tallas disponibles</span>
                <input
                  className="form-input"
                  value={form.sizesInput || ""}
                  onChange={(event) => updateField("sizesInput", event.target.value)}
                  placeholder="Ejemplo: 38, 39, 40"
                />
                <span className="mt-1 block text-xs text-stone-500">Separar cada talla con coma.</span>
              </label>
            </div>
          </section>

          {isEditing ? (
            <ProductImageManager
              product={form}
              setProduct={(updater) => {
                setForm(updater);
                setProduct((current) => (typeof updater === "function" ? updater(current) : updater));
              }}
              setZoomImage={setZoomImage}
              showToast={showToast}
            />
          ) : (
            <section className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm font-bold text-stone-700">
              Guarda el producto para poder añadir imágenes y elegir la portada.
            </section>
          )}
        </div>

        <footer className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-stone-200 bg-white px-4 py-3 sm:flex-row sm:justify-end">
          <button className="btn-secondary" onClick={onClose} type="button">Cancelar</button>
          <button className="btn-primary" disabled={!canSave || mutation.isPending} type="submit">
            <Save className="h-3.5 w-3.5" />
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </button>
        </footer>
      </form>
      {zoomImage ? <ImageZoom image={zoomImage} onClose={() => setZoomImage(null)} alt={form.name} /> : null}
    </div>
  );
}

function ProductImageManager({ product, setProduct, setZoomImage, showToast }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const images = product.images || [];

  function refreshProductImages(updater) {
    setProduct((current) => ({
      ...current,
      images: typeof updater === "function" ? updater(current.images || []) : updater
    }));
  }

  const uploadMutation = useMutation({
    mutationFn: () => adminApi.uploadProductImage({ productId: product.id, file, imageType: "cutout", isPrimary }),
    onSuccess: (image) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      refreshProductImages((currentImages) =>
        image.is_primary ? [...currentImages.map((item) => ({ ...item, is_primary: false })), image] : [...currentImages, image]
      );
      setFile(null);
      setIsPrimary(false);
      showToast("Imagen subida correctamente.");
    },
    onError: () => showToast("No se pudo subir la imagen. Inténtalo de nuevo.", "error")
  });

  const primaryMutation = useMutation({
    mutationFn: adminApi.setPrimaryProductImage,
    onSuccess: (image) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      refreshProductImages((currentImages) => currentImages.map((item) => ({ ...item, is_primary: item.id === image.id })));
      showToast("Portada actualizada.");
    },
    onError: () => showToast("No se pudo actualizar la portada. Inténtalo de nuevo.", "error")
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteProductImage,
    onSuccess: (_, imageId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      refreshProductImages((currentImages) => currentImages.filter((item) => item.id !== imageId));
      showToast("Imagen eliminada.");
    },
    onError: () => showToast("No se pudo eliminar la imagen. Inténtalo de nuevo.", "error")
  });

  return (
    <section className="grid gap-2.5 rounded-lg border border-stone-200 bg-stone-50 p-3">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wide text-dorado">Imágenes del producto</h3>
        <p className="mt-0.5 text-xs text-stone-600">Sube varias imágenes y marca cuál será la portada del catálogo.</p>
      </div>
      <div className="grid gap-2.5 md:grid-cols-[1fr_auto_auto] md:items-end">
        <label>
          <span className="form-label">Imagen</span>
          <input className="form-input" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} type="file" />
        </label>
        <label className="flex min-h-9 items-center gap-2 rounded-lg border-2 border-stone-300 bg-white px-3 py-2 text-xs font-bold text-cafe">
          <input checked={isPrimary} onChange={(event) => setIsPrimary(event.target.checked)} type="checkbox" />
          Portada
        </label>
        <button className="btn-primary" disabled={!file || uploadMutation.isPending} onClick={() => uploadMutation.mutate()} type="button">
          <ImagePlus className="h-3.5 w-3.5" />
          Subir
        </button>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {images.map((image) => (
          <article className="rounded-lg border border-stone-200 bg-white p-2" key={image.id}>
            <button className="group relative aspect-square w-full rounded-lg bg-stone-50 p-1.5" onClick={() => setZoomImage(image)} type="button">
              <img className="h-full w-full object-contain" src={image.image_url} alt={image.alt_text || product.name} />
              <span className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-cafe shadow">
                <Maximize2 className="h-3.5 w-3.5" />
              </span>
            </button>
            <div className="mt-1.5 grid gap-1.5">
              {image.is_primary ? <p className="rounded-lg bg-dorado px-2 py-1 text-center text-xs font-black text-white">Portada</p> : null}
              <button className="btn-secondary" disabled={image.is_primary} onClick={() => primaryMutation.mutate(image.id)} type="button">
                <Star className="h-3.5 w-3.5" />
                Portada
              </button>
              <button className="btn-danger" onClick={() => deleteMutation.mutate(image.id)} type="button">
                <Trash2 className="h-3.5 w-3.5" />
                Quitar
              </button>
            </div>
          </article>
        ))}
      </div>
      {!images.length ? <p className="text-xs text-stone-600">Este producto todavía no tiene imágenes.</p> : null}
    </section>
  );
}

function ImageZoom({ image, onClose, alt }) {
  const [scale, setScale] = useState(1);

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 p-4">
      <div className="grid max-h-full w-full max-w-5xl gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-white">Vista ampliada</p>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setScale((current) => Math.max(1, current - 0.25))} type="button">Alejar</button>
            <button className="btn-secondary" onClick={() => setScale((current) => Math.min(3, current + 0.25))} type="button">Acercar</button>
            <button className="btn-primary" onClick={onClose} type="button">
              <X className="h-4 w-4" />
              Cerrar
            </button>
          </div>
        </div>
        <div className="max-h-[78vh] overflow-auto rounded-xl bg-white p-4">
          <img
            className="mx-auto max-h-[72vh] object-contain transition-transform"
            src={image.image_url}
            alt={image.alt_text || alt}
            style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
          />
        </div>
      </div>
    </div>
  );
}
