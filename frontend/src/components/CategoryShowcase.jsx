import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function CategoryShowcase({ categories = [] }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((current) => current + 1), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleCategories = useMemo(() => categories.filter((category) => category.is_active !== false).slice(0, 4), [categories]);

  if (!visibleCategories.length) {
    return null;
  }

  return (
    <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
      {visibleCategories.map((category, index) => {
        const images = category.images || [];
        const activeImage = images.length ? images[(tick + index) % images.length] : null;
        return (
          <Link
            className="group relative aspect-[16/9] overflow-hidden rounded-xl border border-stone-200 bg-cafe shadow-soft transition hover:-translate-y-0.5 hover:shadow-xl"
            key={category.id}
            to={`/categoria/${category.slug}`}
          >
            {activeImage?.image_url ? (
              <img
                alt={activeImage.alt_text || category.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                src={activeImage.image_url}
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(184,117,57,0.6),transparent_32%),linear-gradient(135deg,#2d1f1a,#7d5738)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
            <div className="relative flex h-full flex-col justify-end p-3 text-white sm:p-4">
              <h2 className="text-lg font-black sm:text-xl">{category.name}</h2>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
