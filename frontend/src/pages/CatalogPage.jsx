import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CatalogFilters } from "../components/CatalogFilters.jsx";
import { CategoryShowcase } from "../components/CategoryShowcase.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { publicApi } from "../lib/api.js";

export function CatalogPage() {
  const [query, setQuery] = useState("");
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: publicApi.categories });
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: () => publicApi.products() });
  const settingsQuery = useQuery({ queryKey: ["site-settings"], queryFn: publicApi.siteSettings });

  const products = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (productsQuery.data || []).filter((product) => !q || `${product.name} ${product.brand}`.toLowerCase().includes(q));
  }, [productsQuery.data, query]);

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-5">
      <section className="grid gap-2 py-2">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-dorado">Productos importados desde Estados Unidos</p>
        <h1 className="max-w-4xl text-2xl font-black leading-tight text-cafe sm:text-3xl md:text-4xl">Catálogo Mar&Ana</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-stone-700">
          Productos traídos de Estados Unidos, elegidos por calidad, estilo y buen acabado.
          Revisa productos disponibles en Perú y consulta por WhatsApp para coordinar tu compra.
        </p>
      </section>
      <CategoryShowcase categories={categoriesQuery.data || []} />
      <CatalogFilters categories={categoriesQuery.data || []} query={query} setQuery={setQuery} />
      {productsQuery.isLoading ? <p className="text-sm font-bold text-cafe">Cargando productos...</p> : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} showExactStock={settingsQuery.data?.show_exact_stock !== false} />
        ))}
      </section>
      {!products.length && !productsQuery.isLoading ? (
        <div className="panel p-4 text-center text-sm font-bold text-cafe">No encontramos productos con esa búsqueda.</div>
      ) : null}
    </div>
  );
}
