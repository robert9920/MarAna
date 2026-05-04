import { Link, NavLink, Outlet } from "react-router-dom";
import { Instagram, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "../lib/api.js";

export function PublicLayout() {
  const settingsQuery = useQuery({ queryKey: ["site-settings"], queryFn: publicApi.siteSettings });
  const settings = settingsQuery.data || {};
  const whatsappPhone = settings.whatsapp_phone || import.meta.env.VITE_WHATSAPP_PHONE || "51999999999";
  const instagramUrl = settings.instagram_url || import.meta.env.VITE_INSTAGRAM_URL || "";

  return (
    <div className="min-h-screen bg-crema text-tinta">
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-row flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5 md:py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Mar&Ana" className="h-12 w-20 object-contain sm:h-16 sm:w-28" />
            <div>
              <p className="text-lg font-black leading-tight text-cafe sm:text-xl">Mar&Ana</p>
              <p className="text-xs leading-tight text-stone-600 sm:text-sm">Lima, Perú</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1.5 text-sm font-bold">
            <NavLink className="rounded-lg px-2.5 py-1.5 text-cafe hover:bg-stone-100 sm:px-3 sm:py-2" to="/">
              Catálogo
            </NavLink>
            {instagramUrl ? (
              <a
                className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-stone-900 px-2 py-1.5 text-white hover:bg-black sm:px-3 sm:py-2"
                href={instagramUrl}
                rel="noreferrer"
                target="_blank"
                aria-label="Abrir Instagram de Mar&Ana"
              >
                <Instagram className="h-4 w-4" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
            ) : null}
            <a
              className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-green-700 px-2 py-1.5 text-white hover:bg-green-800 sm:px-3 sm:py-2"
              href={`https://wa.me/${whatsappPhone}`}
              rel="noreferrer"
              target="_blank"
            >
              <Phone className="h-4 w-4" />
              WhatsApp
            </a>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="mt-6 border-t border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-3 py-4 text-xs text-stone-600 sm:px-5">
          <p className="font-bold text-cafe">Mar&Ana</p>
          <p>Catálogo para Perú. Productos traídos desde Estados Unidos y compras coordinadas por WhatsApp.</p>
        </div>
      </footer>
    </div>
  );
}
