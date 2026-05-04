import { useCallback, useMemo, useState } from "react";
import { Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { getPrimaryImage } from "../lib/format.js";

export function ProductGallery({ product }) {
  const images = product?.images || [];
  const [activeId, setActiveId] = useState(getPrimaryImage(product)?.id || images[0]?.id || "");
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const activeImage = useMemo(() => images.find((image) => image.id === activeId) || getPrimaryImage(product) || images[0], [activeId, images, product]);

  function zoomIn() {
    setZoomLevel((current) => Math.min(current + 0.5, 4));
  }

  function zoomOut() {
    setZoomLevel((current) => {
      const next = Math.max(current - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  function openZoom() {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setZoomOpen(true);
  }

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    if (event.deltaY < 0) {
      setZoomLevel((current) => Math.min(current + 0.3, 4));
    } else {
      setZoomLevel((current) => {
        const next = Math.max(current - 0.3, 1);
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  }, []);

  const handleMouseDown = useCallback((event) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: event.clientX - pan.x, y: event.clientY - pan.y });
    }
  }, [zoomLevel, pan]);

  const handleMouseMove = useCallback((event) => {
    if (isDragging) {
      setPan({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="grid gap-3">
      <div className="panel relative flex aspect-square items-center justify-center overflow-hidden bg-white p-4">
        {activeImage?.image_url ? (
          <button className="h-full w-full cursor-zoom-in" onClick={openZoom} type="button">
            <img className="h-full w-full object-contain" src={activeImage.image_url} alt={activeImage.alt_text || product.name} />
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-center text-lg font-bold text-stone-500">
            Imagen del producto
          </div>
        )}
        {activeImage?.image_url ? (
          <button className="absolute right-2 top-2 rounded-full bg-cafe p-2 text-white shadow-lg" onClick={openZoom} type="button">
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <button className="absolute right-3 top-3 rounded-full bg-white p-2 text-cafe" onClick={() => setZoomOpen(false)} type="button">
            <X className="h-5 w-5" />
          </button>
          <img
            className="max-h-[88vh] max-w-[92vw] object-contain select-none"
            style={{
              transform: `scale(${zoomLevel}) translate(${pan.x}px, ${pan.y}px)`,
              cursor: zoomLevel > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              transition: isDragging ? "none" : "transform 0.15s ease-out"
            }}
            draggable={false}
            src={activeImage.image_url}
            alt={activeImage.alt_text || product.name}
          />
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/70 px-4 py-2 text-white">
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30" onClick={zoomOut} type="button">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-8 text-center text-sm font-bold">{zoomLevel.toFixed(1)}x</span>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30" onClick={zoomIn} type="button">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
