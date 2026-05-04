import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export function CatalogFilters({ categories, query, setQuery, activeCategory }) {
  return (
    <section className="grid gap-3">
      <label className="block">
        <span className="form-label">Buscar producto</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <input
            className="form-input form-input-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o marca"
            type="text"
          />
        </div>
      </label>
      <div>
        <p className="form-label">Categorías</p>
        <div className="flex flex-wrap gap-1.5">
          <Link className={`btn-secondary ${!activeCategory ? "bg-cafe text-white hover:bg-cafe" : ""}`} to="/">
            Todas
          </Link>
          {categories.map((category) => (
            <Link
              className={`btn-secondary ${activeCategory === category.slug ? "bg-cafe text-white hover:bg-cafe" : ""}`}
              key={category.id}
              to={`/categoria/${category.slug}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
