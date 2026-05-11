export const mockCategories = [
  { id: "cat-1", name: "Carteras", slug: "carteras", display_order: 1, is_active: true },
  { id: "cat-2", name: "Perfumes", slug: "perfumes", display_order: 2, is_active: true },
  { id: "cat-3", name: "Zapatillas", slug: "zapatillas", display_order: 3, is_active: true },
  { id: "cat-4", name: "Casacas", slug: "casacas", display_order: 4, is_active: true }
];

export const mockProducts = [
  {
    id: "prod-1",
    category_id: "cat-1",
    category_slug: "carteras",
    category_name: "Carteras",
    slug: "cartera-elegante-dorada",
    name: "Cartera elegante dorada",
    brand: "Mar&Ana",
    price: 129,
    stock: 8,
    description: "Cartera de uso diario con acabado elegante, ideal para reuniones, paseos y ocasiones especiales.",
    status: "active",
    featured: true,
    gender: "mujer",
    sizes: [],
    images: []
  },
  {
    id: "prod-2",
    category_id: "cat-2",
    category_slug: "perfumes",
    category_name: "Perfumes",
    slug: "perfume-floral-clasico",
    name: "Perfume floral clásico",
    brand: "Importado",
    price: 95,
    stock: 12,
    description: "Aroma floral suave y duradero para uso diario.",
    status: "active",
    featured: true,
    gender: "unisex",
    sizes: [],
    images: []
  },
  {
    id: "prod-3",
    category_id: "cat-3",
    category_slug: "zapatillas",
    category_name: "Zapatillas",
    slug: "zapatillas-urbanas-blancas",
    name: "Zapatillas urbanas blancas",
    brand: "Street",
    price: 159,
    stock: 5,
    description: "Zapatillas cómodas para caminar, con diseño moderno y fácil de combinar.",
    status: "active",
    featured: false,
    gender: "unisex",
    sizes: ["38", "39", "40"],
    images: []
  },
  {
    id: "prod-4",
    category_id: "cat-4",
    category_slug: "casacas",
    category_name: "Casacas",
    slug: "casaca-ligera-negra",
    name: "Casaca ligera negra",
    brand: "Mar&Ana",
    price: 189,
    stock: 3,
    description: "Casaca ligera para clima fresco, con corte cómodo y elegante.",
    status: "active",
    featured: false,
    gender: "mujer",
    sizes: ["S", "M", "L"],
    images: []
  }
];

export const mockSales = [
  {
    id: "sale-1",
    sale_date: new Date().toISOString(),
    channel: "whatsapp",
    payment_method: "Yape",
    net_total: 129,
    notes: "Venta registrada de muestra",
    items: [{ product_id: "prod-1", product_name: "Cartera elegante dorada", quantity: 1, unit_price: 129, line_total: 129 }]
  }
];
