import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CatalogFilters } from "../components/CatalogFilters.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { publicApi } from "../lib/api.js";

export function CategoryPage() {
  const { slug } = useParams();
  const [query, setQuery] = useState("");
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: publicApi.categories });
  const productsQuery = useQuery({ queryKey: ["products", slug], queryFn: () => publicApi.products({ category: slug }) });
  const settingsQuery = useQuery({ queryKey: ["site-settings"], queryFn: publicApi.siteSettings });
  const category = categoriesQuery.data?.find((item) => item.slug === slug);
  const images = category?.images || [];
  const [tick, setTick] = useState(0);
  const cover = images.length ? images[tick % images.length] : null;

  useEffect(() => {
    const timer = window.setInterval(() => setTick((current) => current + 1), 3000);
    return () => window.clearInterval(timer);
  }, []);

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (productsQuery.data || []).filter((product) => !q || `${product.name} ${product.brand}`.toLowerCase().includes(q));
  }, [productsQuery.data, query]);

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-5">
      <section className="relative aspect-[21/9] overflow-hidden rounded-xl bg-cafe p-3 text-white shadow-soft sm:aspect-[16/5] sm:p-4">
        {cover?.image_url ? <img className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700" src={cover.image_url} alt={cover.alt_text || category?.name} /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="relative flex h-full flex-col justify-end">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80 sm:text-xs sm:tracking-[0.22em]">Productos traídos de Estados Unidos</p>
          <h1 className="text-xl font-black sm:text-2xl md:text-3xl">{category?.name || "Categoría"}</h1>
          <p className="mt-1 max-w-2xl text-xs text-white/90 sm:text-sm">Productos disponibles para consultar por WhatsApp.</p>
        </div>
      </section>
      <CatalogFilters categories={categoriesQuery.data || []} query={query} setQuery={setQuery} activeCategory={slug} />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} showExactStock={settingsQuery.data?.show_exact_stock !== false} />
        ))}
      </section>
      {!products.length ? <div className="panel p-4 text-center text-sm font-bold text-cafe">No hay productos activos en esta categoría.</div> : null}
    </div>
  );
}
