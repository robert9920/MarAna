import { mockCategories, mockProducts, mockSales } from "../data/mockData.js";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const LOCAL_KEY = "marana_demo_admin_data";
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

function getLocalData() {
  const raw = window.localStorage.getItem(LOCAL_KEY);
  if (!raw) {
    const initial = { categories: mockCategories, products: mockProducts, sales: mockSales };
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw);
}

function setLocalData(data) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: isFormData
      ? { ...options.headers }
      : {
          "Content-Type": "application/json",
          ...options.headers
        },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "No se pudo completar la operación." }));
    throw new Error(error.message || "No se pudo completar la operación.");
  }

  return response.json();
}

async function withFallback(apiCall, fallback) {
  try {
    return await apiCall();
  } catch (error) {
    if (!DEMO_MODE) {
      throw error;
    }
    return fallback();
  }
}

export const publicApi = {
  categories: () => withFallback(() => request("/categories"), () => getLocalData().categories),
  siteSettings: () =>
    withFallback(
      () => request("/site-settings"),
      () => ({
        show_exact_stock: true,
        whatsapp_phone: import.meta.env.VITE_WHATSAPP_PHONE || "51999999999",
        instagram_url: import.meta.env.VITE_INSTAGRAM_URL || ""
      })
    ),
  products: (params = {}) => {
    const search = new URLSearchParams(params);
    return withFallback(
      () => request(`/products?${search}`),
      () => {
        const { products, categories } = getLocalData();
        return products
          .filter((product) => !params.category || product.category_slug === params.category)
          .filter((product) => !params.q || `${product.name} ${product.brand}`.toLowerCase().includes(params.q.toLowerCase()))
          .map((product) => ({
            ...product,
            category_name: categories.find((category) => category.id === product.category_id)?.name || product.category_name
          }));
      }
    );
  },
  product: (slug) =>
    withFallback(
      () => request(`/products/${slug}`),
      () => getLocalData().products.find((product) => product.slug === slug)
    )
};

export const adminApi = {
  session: () => request("/admin/session"),
  login: (payload) =>
    request("/admin/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logout: () => request("/admin/logout", { method: "POST" }),
  dashboard: () =>
    withFallback(
      () => request("/admin/dashboard"),
      () => {
        const { sales, products } = getLocalData();
        const now = new Date();
        const totalMes = sales
          .filter((sale) => new Date(sale.sale_date).getMonth() === now.getMonth())
          .reduce((sum, sale) => sum + Number(sale.net_total || 0), 0);
        const totalDia = sales
          .filter((sale) => new Date(sale.sale_date).toDateString() === now.toDateString())
          .reduce((sum, sale) => sum + Number(sale.net_total || 0), 0);
        return {
          today_total: totalDia,
          month_total: totalMes,
          sales_count: sales.length,
          units_sold: sales.flatMap((sale) => sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0),
          low_stock: products.filter((product) => Number(product.stock) <= 4),
          top_products: products.slice(0, 4),
          daily_sales: sales.map((sale) => ({ date: sale.sale_date.slice(0, 10), total: sale.net_total }))
        };
      }
    ),
  categories: () => withFallback(() => request("/admin/categories"), () => getLocalData().categories),
  siteSettings: () => withFallback(() => request("/admin/site-settings"), () => ({ show_exact_stock: true })),
  saveSiteSettings: (settings) =>
    withFallback(
      () =>
        request("/admin/site-settings", {
          method: "PUT",
          body: JSON.stringify(settings)
        }),
      () => settings
    ),
  saveCategory: (category) =>
    withFallback(
      () =>
        request(category.id ? `/admin/categories/${category.id}` : "/admin/categories", {
          method: category.id ? "PUT" : "POST",
          body: JSON.stringify(category)
        }),
      () => {
        const data = getLocalData();
        if (category.id) {
          data.categories = data.categories.map((item) => (item.id === category.id ? { ...item, ...category } : item));
        } else {
          data.categories.push({ ...category, id: crypto.randomUUID(), slug: slugify(category.name), is_active: true });
        }
        setLocalData(data);
        return category;
      }
    ),
  products: () => withFallback(() => request("/admin/products"), () => getLocalData().products),
  saveProduct: (product) =>
    withFallback(
      () =>
        request(product.id ? `/admin/products/${product.id}` : "/admin/products", {
          method: product.id ? "PUT" : "POST",
          body: JSON.stringify(product)
        }),
      () => {
        const data = getLocalData();
        const category = data.categories.find((item) => item.id === product.category_id);
        const normalized = {
          ...product,
          id: product.id || crypto.randomUUID(),
          slug: product.slug || slugify(product.name),
          category_slug: category?.slug,
          category_name: category?.name,
          images: product.images || []
        };
        data.products = product.id ? data.products.map((item) => (item.id === product.id ? normalized : item)) : [...data.products, normalized];
        setLocalData(data);
        return normalized;
      }
    ),
  uploadProductImage: ({ productId, file, imageType = "cutout", isPrimary = false }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("image_type", imageType);
    formData.append("is_primary", String(isPrimary));
    return request(`/admin/products/${productId}/images`, {
      method: "POST",
      body: formData
    });
  },
  setPrimaryProductImage: (imageId) => request(`/admin/product-images/${imageId}/primary`, { method: "PUT" }),
  deleteProductImage: (imageId) => request(`/admin/product-images/${imageId}`, { method: "DELETE" }),
  uploadCategoryImage: ({ categoryId, file }) => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`/admin/categories/${categoryId}/images`, {
      method: "POST",
      body: formData
    });
  },
  deleteCategoryImage: (imageId) => request(`/admin/category-images/${imageId}`, { method: "DELETE" }),
  sales: () => withFallback(() => request("/admin/sales"), () => getLocalData().sales),
  deleteSale: (saleId) => request(`/admin/sales/${saleId}`, { method: "DELETE" }),
  createSale: (sale) =>
    withFallback(
      () =>
        request("/admin/sales", {
          method: "POST",
          body: JSON.stringify(sale)
        }),
      () => {
        const data = getLocalData();
        const product = data.products.find((item) => item.id === sale.product_id);
        if (!product || Number(sale.quantity) > Number(product.stock)) {
          throw new Error("No hay stock suficiente para registrar esta venta.");
        }
        const quantity = Number(sale.quantity);
        const unitPrice = Number(sale.unit_price);
        product.stock = Number(product.stock) - quantity;
        const created = {
          id: crypto.randomUUID(),
          sale_date: sale.sale_date || new Date().toISOString(),
          channel: "whatsapp",
          payment_method: sale.payment_method || "",
          net_total: quantity * unitPrice,
          notes: sale.notes || "",
          items: [{ product_id: product.id, product_name: product.name, quantity, unit_price: unitPrice, line_total: quantity * unitPrice }]
        };
        data.sales = [created, ...data.sales];
        setLocalData(data);
        return created;
      }
    )
};

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
