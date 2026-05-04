import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Instagram, MessageCircle } from "lucide-react";
import { ProductGallery } from "../components/ProductGallery.jsx";
import { publicApi } from "../lib/api.js";
import { formatCurrency } from "../lib/format.js";

export function ProductDetailPage() {
  const { slug } = useParams();
  const productQuery = useQuery({ queryKey: ["product", slug], queryFn: () => publicApi.product(slug) });
  const settingsQuery = useQuery({ queryKey: ["site-settings"], queryFn: publicApi.siteSettings });
  const product = productQuery.data;
  const settings = settingsQuery.data || {};
  const phone = settings.whatsapp_phone || import.meta.env.VITE_WHATSAPP_PHONE || "51999999999";
  const instagramUrl = settings.instagram_url || import.meta.env.VITE_INSTAGRAM_URL || "";
  const message = encodeURIComponent(`Hola, deseo consultar por este producto: ${product?.name || ""}`);

  if (productQuery.isLoading) {
    return <div className="mx-auto max-w-7xl px-3 py-6 text-sm font-bold text-cafe">Cargando producto...</div>;
  }

  if (!product) {
    return <div className="mx-auto max-w-7xl px-3 py-6 text-sm font-bold text-cafe">No encontramos este producto.</div>;
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-5">
      <Link className="inline-flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-bold text-cafe hover:bg-stone-100" to="/">
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al catálogo
      </Link>
      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ProductGallery product={product} />
        <div className="grid content-start gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-dorado">{product.category_name}</p>
          <h1 className="text-2xl font-black leading-tight text-cafe md:text-3xl">{product.name}</h1>
          <p className="text-sm text-stone-600">{product.brand || "Mar&Ana"}</p>
          <p className="text-2xl font-black text-tinta">{formatCurrency(product.price)}</p>
          <p className={`w-fit rounded-lg px-2.5 py-1.5 text-sm font-bold ${product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {product.stock > 0 ? (settings.show_exact_stock === false ? "Disponible" : `${product.stock} unidades disponibles`) : "Agotado"}
          </p>
          <p className="text-sm leading-relaxed text-stone-700">{product.description}</p>
          <p className="rounded-lg bg-stone-100 p-2.5 text-xs font-bold text-cafe">Producto traído desde Estados Unidos.</p>
          <div className="flex flex-wrap gap-2">
            <a className="btn-primary bg-green-700 hover:bg-green-800" href={`https://wa.me/${phone}?text=${message}`} rel="noreferrer" target="_blank">
              <MessageCircle className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
            {instagramUrl ? (
              <a className="btn-secondary" href={instagramUrl} rel="noreferrer" target="_blank">
                <Instagram className="h-4 w-4" />
                Ver Instagram
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
