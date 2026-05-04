import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Eye, EyeOff } from "lucide-react";
import { adminApi } from "../../lib/api.js";
import { formatCurrency } from "../../lib/format.js";

export function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({ queryKey: ["admin-dashboard"], queryFn: adminApi.dashboard });
  const settingsQuery = useQuery({ queryKey: ["admin-site-settings"], queryFn: adminApi.siteSettings });
  const data = dashboardQuery.data;
  const settings = settingsQuery.data || { show_exact_stock: true };

  const settingsMutation = useMutation({
    mutationFn: adminApi.saveSiteSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    }
  });

  return (
    <div className="grid gap-3">
      <div>
        <h1 className="text-2xl font-black text-cafe">Resumen del negocio</h1>
        <p className="mt-1 text-sm text-stone-600">Cashflow simple basado en ventas registradas en el panel.</p>
      </div>
      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Ventas de hoy" value={formatCurrency(data?.today_total)} />
        <MetricCard label="Ventas del mes" value={formatCurrency(data?.month_total)} />
        <MetricCard label="Ventas registradas" value={data?.sales_count || 0} />
        <MetricCard label="Unidades vendidas" value={data?.units_sold || 0} />
      </section>
      <section className="panel flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-cafe">Visibilidad de stock</h2>
          <p className="mt-0.5 text-xs text-stone-600">Controla si los clientes ven la cantidad exacta o solo "Disponible / Agotado".</p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => settingsMutation.mutate({ show_exact_stock: !settings.show_exact_stock })}
          type="button"
        >
          {settings.show_exact_stock ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {settings.show_exact_stock ? "Ocultar cantidad exacta" : "Mostrar cantidad exacta"}
        </button>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="panel p-5">
          <h2 className="mb-4 text-2xl font-black text-cafe">Ingresos por día</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.daily_sales || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#b87539" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid gap-6">
          <div className="panel p-5">
            <h2 className="mb-4 text-2xl font-black text-cafe">Bajo stock</h2>
            <div className="grid gap-3">
              {(data?.low_stock || []).map((product) => (
                <div className="rounded-lg bg-stone-50 p-3" key={product.id}>
                  <p className="font-bold text-cafe">{product.name}</p>
                  <p className="text-stone-600">{product.stock} unidades</p>
                </div>
              ))}
              {!data?.low_stock?.length ? <p className="text-stone-600">No hay productos con bajo stock.</p> : null}
            </div>
          </div>
          <div className="panel p-5">
            <h2 className="mb-4 text-2xl font-black text-cafe">Más vendidos</h2>
            <div className="grid gap-3">
              {(data?.top_products || []).map((product) => (
                <div className="rounded-lg bg-stone-50 p-3" key={product.id}>
                  <p className="font-bold text-cafe">{product.name}</p>
                  <p className="text-stone-600">{product.total_quantity || product.stock || 0} unidades</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <article className="panel p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1.5 text-xl font-black text-cafe">{value}</p>
    </article>
  );
}
