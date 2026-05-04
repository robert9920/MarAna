import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout.jsx";
import { AdminLayout } from "./layouts/AdminLayout.jsx";
import { CatalogPage } from "./pages/CatalogPage.jsx";
import { CategoryPage } from "./pages/CategoryPage.jsx";
import { ProductDetailPage } from "./pages/ProductDetailPage.jsx";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage.jsx";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage.jsx";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage.jsx";
import { AdminCategoriesPage } from "./pages/admin/AdminCategoriesPage.jsx";
import { AdminSalesPage } from "./pages/admin/AdminSalesPage.jsx";
import { ProtectedAdminRoute } from "./components/admin/ProtectedAdminRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<CatalogPage />} />
        <Route path="/categoria/:slug" element={<CategoryPage />} />
        <Route path="/producto/:slug" element={<ProductDetailPage />} />
      </Route>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="productos" element={<AdminProductsPage />} />
        <Route path="categorias" element={<AdminCategoriesPage />} />
        <Route path="ventas" element={<AdminSalesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
