import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Boxes, Eye, FolderTree, LogOut, ReceiptText } from "lucide-react";
import { adminApi } from "../lib/api.js";
import { ToastProvider } from "../hooks/useToast.js";

const navItems = [
  { to: "/admin", label: "Resumen", icon: BarChart3, end: true },
  { to: "/admin/productos", label: "Productos", icon: Boxes },
  { to: "/admin/categorias", label: "Categorías", icon: FolderTree },
  { to: "/admin/ventas", label: "Ventas", icon: ReceiptText }
];

export function AdminLayout() {
  const navigate = useNavigate();

  async function handleLogout() {
    await adminApi.logout().catch(() => {});
    window.localStorage.removeItem("marana_admin_demo_session");
    navigate("/admin/login");
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-stone-100 text-tinta">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Mar&Ana" className="h-20 w-28 object-contain" />
              <div>
                <p className="text-2xl font-black text-cafe">Panel Admin</p>
                <p className="text-base text-stone-600">Inventario, ventas y cashflow</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a className="btn-secondary" href="/" target="_blank" rel="noreferrer">
                <Eye className="h-5 w-5" />
                Ver catálogo
              </a>
              <button className="btn-secondary" onClick={handleLogout} type="button">
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-3 lg:grid-cols-[200px_1fr]">
          <aside className="panel h-fit p-2">
            <nav className="grid gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    end={item.end}
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex min-h-9 items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold ${
                        isActive ? "bg-cafe text-white" : "text-cafe hover:bg-stone-100"
                      }`
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </aside>
          <section>
            <Outlet />
          </section>
        </div>
      </div>
    </ToastProvider>
  );
}
