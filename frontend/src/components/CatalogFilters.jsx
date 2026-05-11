import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const genderOptions = [
  { value: "", label: "Todos" },
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
  { value: "unisex", label: "Unisex" },
  { value: "niña", label: "Niña" },
  { value: "niño", label: "Niño" }
];

export function CatalogFilters({ categories, query, setQuery, activeCategory, genderFilter = "", setGenderFilter }) {
  return (
    <section className="grid gap-3">
      <div className="grid gap-2.5 md:grid-cols-[1fr_220px]">
        <label className="block">
          <span className="form-label">Buscar producto</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              className="form-input form-input-with-icon"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o marca"
              type="text"
            />
          </div>
        </label>
        <label className="block">
          <span className="form-label">Filtrar por género</span>
          <select className="form-input" value={genderFilter} onChange={(event) => setGenderFilter?.(event.target.value)}>
            {genderOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
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
