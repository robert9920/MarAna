import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Star, Trash2, Plus, Save } from "lucide-react";
import { adminApi } from "../../lib/api.js";
import { formatCurrency } from "../../lib/format.js";
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
  images: []
};

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: ["admin-categories"], queryFn: adminApi.categories });
  const productsQuery = useQuery({ queryKey: ["admin-products"], queryFn: adminApi.products });
  const [form, setForm] = useState(emptyProduct);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const { message, showToast } = useToast();
  const categories = categoriesQuery.data || [];
  const products = productsQuery.data || [];
  const canSave = useMemo(() => categories.length > 0 && form.name && form.category_id, [categories.length, form]);

  const filteredProducts = useMemo(() => {
    const q = productFilter.trim().toLowerCase();
    return products
      .filter((product) => !categoryFilter || product.category_id === categoryFilter)
      .filter((product) => !q || `${product.name} ${product.brand || ""}`.toLowerCase().includes(q));
  }, [categoryFilter, productFilter, products]);

  const mutation = useMutation({
    mutationFn: adminApi.saveProduct,
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setForm((current) => ({ ...current, ...saved, images: saved.images || current.images || [] }));
      showToast(form.id ? "Producto actualizado correctamente." : "Producto creado correctamente.");
    },
    onError: () => showToast(form.id ? "No se pudo actualizar el producto. Inténtalo de nuevo." : "No se pudo crear el producto. Inténtalo de nuevo.", "error")
  });

  function editProduct(product) {
    setForm({
      id: product.id,
      category_id: product.category_id,
      name: product.name,
      brand: product.brand || "",
      price: Number(product.price || 0),
      stock: Number(product.stock || 0),
      description: product.description || "",
      status: product.status || "active",
      featured: Boolean(product.featured),
      images: product.images || []
    });
  }

  function manageImages(product) {
    editProduct(product);
    window.setTimeout(() => {
      document.getElementById("imagenes-producto")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <div className="grid gap-3">
      <div>
        <h1 className="text-2xl font-black text-cafe">Productos</h1>
        <p className="mt-1 text-sm text-stone-600">Crea productos, actualiza precios, controla stock y gestiona imágenes.</p>
      </div>
      {message && (
        <div className={`rounded-lg border px-3 py-2.5 text-sm font-bold ${message.type === "error" ? "bg-red-50 text-red-800 border-red-200" : "bg-green-50 text-green-800 border-green-200"}`}>
          {message.text}
        </div>
      )}
      <form
        className="panel grid gap-2.5 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave) mutation.mutate(form);
        }}
      >
        <div className="grid gap-2.5 md:grid-cols-2">
          <label>
            <span className="form-label">Nombre del producto</span>
            <input className="form-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label>
            <span className="form-label">Categoría</span>
            <select className="form-input" value={form.category_id} onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))} required>
              <option value="">Selecciona categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="form-label">Marca</span>
            <input className="form-input" value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} />
          </label>
          <label>
            <span className="form-label">Precio de venta (S/)</span>
            <input className="form-input" min="0" step="0.01" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))} />
          </label>
          <label>
            <span className="form-label">Stock</span>
            <input className="form-input" min="0" type="number" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: Number(event.target.value) }))} />
          </label>
          <label>
            <span className="form-label">Estado</span>
            <select className="form-input" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="active">Activo</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
            </select>
          </label>
        </div>
        <label>
          <span className="form-label">Descripción</span>
          <textarea className="form-input min-h-24" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button className="btn-primary" disabled={!canSave || mutation.isPending} type="submit">
            {form.id ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {form.id ? "Guardar producto" : "Crear producto"}
          </button>
          {form.id ? <button className="btn-secondary" onClick={() => setForm(emptyProduct)} type="button">Cancelar edición</button> : null}
        </div>
      </form>
      {form.id ? <ProductImageManager form={form} setForm={setForm} showToast={showToast} /> : (
        <div className="panel p-3 text-sm text-stone-700">Guarda el producto para poder subir imágenes y elegir la portada.</div>
      )}
      <section className="panel p-3">
        <div className="grid gap-2.5 sm:grid-cols-2">
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
            <input className="form-input" value={productFilter} onChange={(event) => setProductFilter(event.target.value)} placeholder="Escribe nombre o marca" />
          </label>
        </div>
      </section>
      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <colgroup>
            <col className="w-[35%]" />
            <col className="w-[20%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead className="bg-stone-50">
            <tr>
              <th className="table-cell">Producto</th>
              <th className="table-cell">Categoría</th>
              <th className="table-cell">Precio</th>
              <th className="table-cell">Stock</th>
              <th className="table-cell">Estado</th>
              <th className="table-cell">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td className="table-cell">
                  <p className="font-bold text-cafe">{product.name}</p>
                  <p className="text-stone-600">{product.brand}</p>
                </td>
                <td className="table-cell">{product.category_name || categories.find((category) => category.id === product.category_id)?.name}</td>
                <td className="table-cell font-bold">{formatCurrency(product.price)}</td>
                <td className="table-cell">{product.stock}</td>
                <td className="table-cell">{product.status === "active" ? "Activo" : "No visible"}</td>
                <td className="table-cell">
                  <div className="flex flex-wrap gap-1.5">
                    <button className="btn-secondary" onClick={() => editProduct(product)} type="button">Editar</button>
                    <button className="btn-primary" onClick={() => manageImages(product)} type="button">
                      <ImagePlus className="h-3.5 w-3.5" />
                      Imágenes
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {!filteredProducts.length ? <div className="panel p-4 text-center text-sm font-bold text-cafe">No hay productos que coincidan con los filtros.</div> : null}
    </div>
  );
}

function ProductImageManager({ form, setForm, showToast }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const images = form.images || [];

  const uploadMutation = useMutation({
    mutationFn: () => adminApi.uploadProductImage({ productId: form.id, file, imageType: "cutout", isPrimary }),
    onSuccess: (image) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setForm((current) => ({
        ...current,
        images: image.is_primary ? [...(current.images || []).map((item) => ({ ...item, is_primary: false })), image] : [...(current.images || []), image]
      }));
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
      setForm((current) => ({
        ...current,
        images: (current.images || []).map((item) => ({ ...item, is_primary: item.id === image.id }))
      }));
      showToast("Portada actualizada.");
    },
    onError: () => showToast("No se pudo actualizar la portada. Inténtalo de nuevo.", "error")
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteProductImage,
    onSuccess: (_, imageId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setForm((current) => ({ ...current, images: (current.images || []).filter((item) => item.id !== imageId) }));
      showToast("Imagen eliminada.");
    },
    onError: () => showToast("No se pudo eliminar la imagen. Inténtalo de nuevo.", "error")
  });

  return (
    <section className="panel grid gap-2.5 p-3" id="imagenes-producto">
      <div>
        <h2 className="text-lg font-black text-cafe">Imágenes del producto</h2>
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
            <div className="aspect-square rounded-lg bg-stone-50 p-1.5">
              <img className="h-full w-full object-contain" src={image.image_url} alt={image.alt_text || form.name} />
            </div>
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
