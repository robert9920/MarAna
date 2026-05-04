import { useMemo, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { getPrimaryImage } from "../lib/format.js";

export function ProductGallery({ product }) {
  const images = product?.images || [];
  const [activeId, setActiveId] = useState(getPrimaryImage(product)?.id || images[0]?.id || "");
  const [zoomOpen, setZoomOpen] = useState(false);

  const activeImage = useMemo(() => images.find((image) => image.id === activeId) || getPrimaryImage(product) || images[0], [activeId, images, product]);

  return (
    <div className="grid gap-3">
      <div className="panel relative flex aspect-square items-center justify-center overflow-hidden bg-white p-4">
        {activeImage?.image_url ? (
          <button className="h-full w-full cursor-zoom-in" onClick={() => setZoomOpen(true)} type="button">
            <img className="h-full w-full object-contain" src={activeImage.image_url} alt={activeImage.alt_text || product.name} />
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-center text-lg font-bold text-stone-500">
            Imagen del producto
          </div>
        )}
        {activeImage?.image_url ? (
          <button className="absolute right-2 top-2 rounded-full bg-cafe p-2 text-white shadow-lg" onClick={() => setZoomOpen(true)} type="button">
            <Maximize2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image) => (
            <button
              className={`h-16 w-16 shrink-0 rounded-lg border-2 bg-white p-1.5 ${activeImage?.id === image.id ? "border-dorado" : "border-stone-200"}`}
              key={image.id}
              onClick={() => setActiveId(image.id)}
              type="button"
            >
              <img className="h-full w-full object-contain" src={image.image_url} alt={image.alt_text || product.name} />
            </button>
          ))}
        </div>
      ) : null}
      {zoomOpen && activeImage?.image_url ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" role="dialog" aria-modal="true">
          <button className="absolute right-3 top-3 rounded-full bg-white p-2 text-cafe" onClick={() => setZoomOpen(false)} type="button">
            <X className="h-5 w-5" />
          </button>
          <img className="max-h-[88vh] max-w-[92vw] object-contain" src={activeImage.image_url} alt={activeImage.alt_text || product.name} />
        </div>
      ) : null}
    </div>
  );
}
