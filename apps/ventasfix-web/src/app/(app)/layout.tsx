import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import "bootstrap-icons/font/bootstrap-icons.css";
import { getSession } from "@/lib/session";
import BootstrapClient from "@/components/BootstrapClient";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "bi-speedometer2" },
  { href: "/usuarios", label: "Usuarios", icon: "bi-people" },
  { href: "/productos", label: "Productos", icon: "bi-box-seam" },
  { href: "/clientes", label: "Clientes", icon: "bi-building" },
] as const;

function NavLinks() {
  return (
    <ul className="nav nav-pills flex-column gap-1">
      {NAV_ITEMS.map((item) => (
        <li className="nav-item" key={item.href}>
          <a className="nav-link text-white d-flex align-items-center gap-2" href={item.href}>
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <BootstrapClient />

      {/* Sidebar fijo — desktop (BRAND.md sección 9: breakpoint lg+) */}
      <aside
        className="d-none d-lg-flex flex-column flex-shrink-0 p-3"
        style={{
          width: 240,
          backgroundColor: "#1E3A5F",
          position: "fixed",
          top: 0,
          bottom: 0,
        }}
      >
        <span className="fs-5 fw-bold mb-4 px-2 text-white">VentasFix</span>
        <NavLinks />
      </aside>

      {/* Offcanvas — mobile/tablet, botón hamburguesa en el header */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex={-1}
        id="sidebarOffcanvas"
        aria-labelledby="sidebarOffcanvasLabel"
        style={{ backgroundColor: "#1E3A5F" }}
      >
        <div className="offcanvas-header">
          <span className="fs-5 fw-bold text-white" id="sidebarOffcanvasLabel">
            VentasFix
          </span>
          <button
            type="button"
            className="btn-close btn-close-white"
            data-bs-dismiss="offcanvas"
            aria-label="Cerrar"
          />
        </div>
        <div className="offcanvas-body">
          <NavLinks />
        </div>
      </div>

      <div className="app-content flex-grow-1 d-flex flex-column">
        <header className="d-flex align-items-center justify-content-between border-bottom bg-white px-3 py-2 sticky-top">
          <button
            type="button"
            className="btn btn-outline-secondary d-lg-none"
            data-bs-toggle="offcanvas"
            data-bs-target="#sidebarOffcanvas"
            aria-controls="sidebarOffcanvas"
            aria-label="Abrir menú"
          >
            <i className="bi bi-list" aria-hidden="true" />
          </button>

          <span className="d-none d-lg-block" />

          <div className="d-flex align-items-center gap-3">
            <span className="text-secondary small">{session.email}</span>
            <form action="/api/logout" method="POST">
              <button type="submit" className="btn btn-outline-secondary btn-sm">
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>

        <main className="flex-grow-1 p-4">{children}</main>
      </div>
    </div>
  );
}
