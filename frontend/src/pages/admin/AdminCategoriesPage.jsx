import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { adminApi } from "../../lib/api.js";
import { useToast } from "../../hooks/useToast.js";

const emptyCategory = { name: "", display_order: 1, is_active: true, images: [] };

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { message: toastMsg, showToast } = useToast();
  const categoriesQuery = useQuery({ queryKey: ["admin-categories"], queryFn: adminApi.categories });
  const [form, setForm] = useState(emptyCategory);
  const mutation = useMutation({
    mutationFn: adminApi.saveCategory,
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm((current) => ({ ...current, ...saved, images: saved.images || current.images || [] }));
      showToast(saved.id ? "Categoría guardada correctamente." : "Categoría creada correctamente.");
    },
    onError: () => showToast("No se pudo guardar la categoría. Inténtalo de nuevo.", "error")
  });

  return (
    <div className="grid gap-3">
      <div>
        <h1 className="text-2xl font-black text-cafe">Categorías</h1>
        <p className="mt-1 text-sm text-stone-600">Crea categorías y agrega imágenes lifestyle para la portada del catálogo.</p>
      </div>
      <form className="panel grid gap-2.5 p-3 md:grid-cols-[1fr_140px_120px] md:items-end" onSubmit={(event) => { event.preventDefault(); mutation.mutate(form); }}>
        <label>
          <span className="form-label">Nombre</span>
          <input className="form-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
        </label>
        <label>
          <span className="form-label">Orden</span>
          <input className="form-input" min="1" type="number" value={form.display_order} onChange={(event) => setForm((current) => ({ ...current, display_order: Number(event.target.value) }))} />
        </label>
        <button className="btn-primary" type="submit">
          {form.id ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {form.id ? "Guardar" : "Crear"}
        </button>
      </form>
      {form.id ? <CategoryImageManager form={form} setForm={setForm} showToast={showToast} /> : (
        <div className="panel p-3 text-sm text-stone-700">Guarda la categoría para poder subir hasta 5 imágenes lifestyle.</div>
      )}
      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse">
          <colgroup>
            <col className="w-[25%]" />
            <col className="w-[10%]" />
            <col className="w-[20%]" />
            <col className="w-[15%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead className="bg-stone-50">
            <tr>
              <th className="table-cell">Nombre</th>
              <th className="table-cell">Orden</th>
              <th className="table-cell">Imágenes lifestyle</th>
              <th className="table-cell">Estado</th>
              <th className="table-cell">Acción</th>
            </tr>
          </thead>
          <tbody>
            {(categoriesQuery.data || []).map((category) => (
              <tr key={category.id}>
                <td className="table-cell font-bold text-cafe">{category.name}</td>
                <td className="table-cell">{category.display_order}</td>
                <td className="table-cell">{category.images?.length || 0} / 5</td>
                <td className="table-cell">{category.is_active ? "Activa" : "Inactiva"}</td>
                <td className="table-cell">
                  <button className="btn-secondary" onClick={() => setForm({ ...category, images: category.images || [] })} type="button">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function CategoryImageManager({ form, setForm, showToast }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const images = form.images || [];

  const uploadMutation = useMutation({
    mutationFn: () => adminApi.uploadCategoryImage({ categoryId: form.id, file }),
    onSuccess: (image) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm((current) => ({ ...current, images: [...(current.images || []), image] }));
      setFile(null);
      showToast("Imagen lifestyle subida correctamente.");
    },
    onError: () => showToast("No se pudo subir la imagen. Verifica el formato y tamaño.", "error")
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteCategoryImage,
    onSuccess: (_, imageId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm((current) => ({ ...current, images: (current.images || []).filter((item) => item.id !== imageId) }));
      showToast("Imagen lifestyle quitada correctamente.");
    },
    onError: () => showToast("No se pudo eliminar la imagen. Inténtalo de nuevo.", "error")
  });

  return (
    <section className="panel grid gap-2.5 p-3">
      <div>
        <h2 className="text-lg font-black text-cafe">Imágenes lifestyle de {form.name}</h2>
        <p className="mt-0.5 text-xs text-stone-600">Estas imágenes aparecen como portada moderna. Máximo 5 por categoría.</p>
      </div>
      <div className="grid gap-2.5 md:grid-cols-[1fr_auto] md:items-end">
        <label>
          <span className="form-label">Imagen lifestyle</span>
          <input className="form-input" accept="image/png,image/jpeg,image/webp" disabled={images.length >= 5} onChange={(event) => setFile(event.target.files?.[0] || null)} type="file" />
        </label>
        <button className="btn-primary" disabled={!file || images.length >= 5 || uploadMutation.isPending} onClick={() => uploadMutation.mutate()} type="button">
          <ImagePlus className="h-3.5 w-3.5" />
          Subir
        </button>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {images.map((image) => (
          <article className="rounded-lg border border-stone-200 bg-white p-2" key={image.id}>
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-stone-100">
              <img className="h-full w-full object-cover" src={image.image_url} alt={image.alt_text || form.name} />
            </div>
            <button className="btn-danger mt-2 w-full" onClick={() => deleteMutation.mutate(image.id)} type="button">
              <Trash2 className="h-3.5 w-3.5" />
              Quitar
            </button>
          </article>
        ))}
      </div>
      {!images.length ? <p className="text-xs text-stone-600">Esta categoría todavía no tiene imágenes lifestyle.</p> : null}
    </section>
  );
}
