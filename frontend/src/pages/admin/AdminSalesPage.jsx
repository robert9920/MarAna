import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { adminApi } from "../../lib/api.js";
import { formatCurrency, formatDate } from "../../lib/format.js";
import { useToast } from "../../hooks/useToast.js";

function peruNow() {
  const now = new Date();
  return new Date(now.getTime() - 5 * 3600000).toISOString().slice(0, 16);
}

const emptySale = {
  product_id: "",
  quantity: 1,
  unit_price: 0,
  payment_method: "",
  sale_date: peruNow(),
  notes: ""
};

export function AdminSalesPage() {
  const queryClient = useQueryClient();
  const { message, showToast } = useToast();
  const productsQuery = useQuery({ queryKey: ["admin-products"], queryFn: adminApi.products });
  const categoriesQuery = useQuery({ queryKey: ["admin-categories"], queryFn: adminApi.categories });
  const salesQuery = useQuery({ queryKey: ["admin-sales"], queryFn: adminApi.sales });
  const [form, setForm] = useState(emptySale);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [error, setError] = useState("");
  const products = productsQuery.data || [];
  const categories = categoriesQuery.data || [];
  const sales = salesQuery.data || [];

  const filteredProducts = useMemo(() => {
    const q = productFilter.trim().toLowerCase();
    return products
      .filter((product) => !categoryFilter || product.category_id === categoryFilter)
      .filter((product) => !q || `${product.name} ${product.brand || ""}`.toLowerCase().includes(q));
  }, [categoryFilter, productFilter, products]);

  const total = useMemo(() => sales.reduce((sum, sale) => sum + Number(sale.net_total || 0), 0), [sales]);
  const selectedProduct = products.find((product) => product.id === form.product_id);

  const mutation = useMutation({
    mutationFn: adminApi.createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      setForm({ ...emptySale, sale_date: peruNow() });
      setError("");
      showToast("Venta registrada correctamente.");
    },
    onError: (err) => {
      setError(err.message);
      showToast("No se pudo registrar la venta. Verifica los datos e inténtalo de nuevo.", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      showToast("Venta eliminada. El stock se restauró automáticamente.");
    },
    onError: () => showToast("No se pudo eliminar la venta. Inténtalo de nuevo.", "error")
  });

  function selectProduct(productId) {
    const product = products.find((item) => item.id === productId);
    setForm((current) => ({ ...current, product_id: productId, unit_price: Number(product?.price || 0) }));
  }

  function changeCategory(categoryId) {
    setCategoryFilter(categoryId);
    setForm((current) => ({ ...current, product_id: "", unit_price: 0 }));
  }

  function handleDeleteSale(saleId) {
    if (confirm("¿Eliminar esta venta? El stock del producto se restaurará.")) {
      deleteMutation.mutate(saleId);
    }
  }

  return (
    <div className="grid gap-3">
      {message && (
        <div className={`rounded-lg border px-3 py-2.5 text-sm font-bold ${message.type === "error" ? "bg-red-50 text-red-800 border-red-200" : "bg-green-50 text-green-800 border-green-200"}`}>
          {message.text}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-black text-cafe">Ventas y cashflow</h1>
        <p className="mt-1 text-sm text-stone-600">Registra ventas realizadas por WhatsApp y revisa ingresos acumulados.</p>
      </div>
      <section className="grid gap-2.5 md:grid-cols-3">
        <article className="panel p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Ingresos registrados</p>
          <p className="mt-1.5 text-xl font-black text-cafe">{formatCurrency(total)}</p>
        </article>
        <article className="panel p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Ventas</p>
          <p className="mt-1.5 text-xl font-black text-cafe">{sales.length}</p>
        </article>
        <article className="panel p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Unidades vendidas</p>
          <p className="mt-1.5 text-xl font-black text-cafe">{sales.flatMap((sale) => sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}</p>
        </article>
      </section>
      <form
        className="panel grid gap-2.5 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (selectedProduct && Number(form.quantity) > Number(selectedProduct.stock)) {
            setError("No hay stock suficiente para registrar esta venta.");
            return;
          }
          mutation.mutate(form);
        }}
      >
        <h2 className="text-lg font-black text-cafe">Registrar venta</h2>
        <div className="grid gap-2.5 md:grid-cols-3">
          <label>
            <span className="form-label">Filtrar por categoría</span>
            <select className="form-input" value={categoryFilter} onChange={(event) => changeCategory(event.target.value)}>
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2">
            <span className="form-label">Buscar producto</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
              <input
                className="form-input form-input-with-icon"
                value={productFilter}
                onChange={(event) => setProductFilter(event.target.value)}
                placeholder="Escribe nombre o marca"
              />
            </div>
          </label>
        </div>
        <div className="grid gap-2.5 md:grid-cols-2">
          <label>
            <span className="form-label">Producto</span>
            <select className="form-input" value={form.product_id} onChange={(event) => selectProduct(event.target.value)} required>
              <option value="">Selecciona producto</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>{product.name} - stock {product.stock}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="form-label">Cantidad</span>
            <input className="form-input" min="1" type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))} />
          </label>
          <label>
            <span className="form-label">Precio de venta (S/)</span>
            <input className="form-input" min="0" step="0.01" type="number" value={form.unit_price} onChange={(event) => setForm((current) => ({ ...current, unit_price: Number(event.target.value) }))} />
          </label>
          <label>
            <span className="form-label">Método de pago</span>
            <select className="form-input" value={form.payment_method} onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value }))}>
              <option value="">Sin especificar</option>
              <option value="Yape">Yape</option>
              <option value="Plin">Plin</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </label>
          <label>
            <span className="form-label">Fecha</span>
            <input className="form-input" type="datetime-local" value={form.sale_date} onChange={(event) => setForm((current) => ({ ...current, sale_date: event.target.value }))} />
          </label>
          <label>
            <span className="form-label">Notas</span>
            <input className="form-input" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Opcional" />
          </label>
        </div>
        {selectedProduct ? <p className="font-bold text-stone-700">Stock disponible: {selectedProduct.stock}</p> : null}
        {error ? <p className="rounded-lg bg-red-100 p-3 font-bold text-red-800">{error}</p> : null}
        <button className="btn-primary w-fit" disabled={mutation.isPending} type="submit">
          <Plus className="h-3.5 w-3.5" />
          Registrar venta
        </button>
      </form>
      <section className="panel overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[24%]" />
            <col className="w-[10%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className="bg-stone-50">
            <tr>
              <th className="table-cell">Fecha</th>
              <th className="table-cell">Producto</th>
              <th className="table-cell">Cantidad</th>
              <th className="table-cell">Total</th>
              <th className="table-cell">Pago</th>
              <th className="table-cell">Notas</th>
              <th className="table-cell">Acción</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => {
              const item = sale.items?.[0] || {};
              return (
                <tr key={sale.id}>
                  <td className="table-cell">{formatDate(sale.sale_date)}</td>
                  <td className="table-cell font-bold text-cafe">{item.product_name || item.product_id}</td>
                  <td className="table-cell">{item.quantity}</td>
                  <td className="table-cell font-bold">{formatCurrency(sale.net_total)}</td>
                  <td className="table-cell">{sale.payment_method || "-"}</td>
                  <td className="table-cell">{sale.notes || "-"}</td>
                  <td className="table-cell">
                    <button className="btn-danger" onClick={() => handleDeleteSale(sale.id)} type="button">
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
