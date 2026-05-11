import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { formatCurrency, formatGender, productImageUrl } from "../lib/format.js";

export function ProductCard({ product, showExactStock = true, showSpecs = false }) {
  const imageUrl = productImageUrl(product);
  const gender = formatGender(product.gender);
  const sizes = product.sizes || [];
  const hasSpecs = showSpecs && (gender || sizes.length > 0);

  return (
    <article className="panel overflow-hidden">
      <Link to={`/producto/${product.slug}`} className="block bg-white">
        <div className="flex aspect-[4/3] items-center justify-center bg-stone-50 p-3">
          {imageUrl ? (
            <img className="h-full w-full object-contain" src={imageUrl} alt={product.name} />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-center text-xs font-bold text-stone-500">
              Imagen del producto
            </div>
          )}
        </div>
      </Link>
      <div className="grid gap-1.5 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-dorado">{product.category_name}</p>
        <Link to={`/producto/${product.slug}`} className="text-lg font-black text-cafe hover:underline">
          {product.name}
        </Link>
        <p className="text-xs text-stone-600">{product.brand || "Mar&Ana"}</p>
        {hasSpecs ? (
          <div className="grid gap-0.5 rounded-lg bg-stone-50 px-2 py-1.5 text-[11px] font-bold text-stone-700">
            {gender ? <p>Sexo: {gender}</p> : null}
            {sizes.length ? <p>Tallas: {sizes.join(", ")}</p> : null}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-black text-tinta">{formatCurrency(product.price)}</p>
          <p className={`rounded-lg px-2 py-1 text-xs font-bold ${product.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {product.stock > 0 ? (showExactStock ? `${product.stock} en stock` : "Disponible") : "Agotado"}
          </p>
        </div>
        <Link className="btn-primary" to={`/producto/${product.slug}`}>
          <MessageCircle className="h-3.5 w-3.5" />
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
