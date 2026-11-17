import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { AdminLogin } from "./admin/login";
import { AdminOverview } from "./admin/overview";
import { NotFound } from "./not-found";
import { SectionPlaceholder } from "./section-placeholder";
import { Welcome } from "./welcome";
import { Workspace } from "./workspace";

const AdminLayout = lazy(() => import("./admin/layout"));

const adminFallback = <div className="loading-screen">RF / ADMIN</div>;

const withAdminShell = (node: ReactNode) => (
  <Suspense fallback={adminFallback}>{node}</Suspense>
);

function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Terjadi kesalahan saat memuat halaman.";

  return (
    <div className="loading-screen">
      <div className="text-center">
        <p className="mb-4 text-[var(--rf-accent)]">{message}</p>
        <Link to="/workspace" className="button secondary">
          Kembali ke Workspace
        </Link>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Welcome />,
    errorElement: <RouteError />,
  },
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { path: "/workspace", element: <Workspace /> },
      {
        path: "/ai",
        element: (
          <SectionPlaceholder
            title="AI Collection"
            description="Model dan layanan AI yang pernah dan sedang digunakan."
            path="/ai"
          />
        ),
      },
      {
        path: "/tools",
        element: (
          <SectionPlaceholder
            title="Tools"
            description="Perangkat kerja untuk pengembangan, desain, dan produktivitas."
            path="/tools"
          />
        ),
      },
      {
        path: "/websites",
        element: (
          <SectionPlaceholder
            title="Websites"
            description="Platform dan situs yang menjadi bagian dari ekosistem."
            path="/websites"
          />
        ),
      },
      {
        path: "/projects",
        element: (
          <SectionPlaceholder
            title="Projects"
            description="Proyek dan eksperimen yang pernah dibangun."
            path="/projects"
          />
        ),
      },
      {
        path: "/tech-stack",
        element: (
          <SectionPlaceholder
            title="Tech Stack"
            description="Teknologi di balik RF Personal Tech Dashboard."
            path="/tech-stack"
          />
        ),
      },
      {
        path: "/learning-journey",
        element: (
          <SectionPlaceholder
            title="Learning Journey"
            description="Bidang yang sedang dan pernah dipelajari."
            path="/learning-journey"
          />
        ),
      },
      {
        path: "/setup",
        element: (
          <SectionPlaceholder
            title="Setup & Devices"
            description="Perangkat dan spesifikasi yang digunakan sehari-hari."
            path="/setup"
          />
        ),
      },
      {
        path: "/timeline",
        element: (
          <SectionPlaceholder
            title="Timeline"
            description="Riwayat aktivitas dan pencapaian teknologi."
            path="/timeline"
          />
        ),
      },
      {
        path: "/statistics",
        element: (
          <SectionPlaceholder
            title="Statistics"
            description="Ringkasan angka dari seluruh koleksi."
            path="/statistics"
          />
        ),
      },
      {
        path: "/about",
        element: (
          <SectionPlaceholder
            title="About Me"
            description="Profil, minat, dan tujuan pemilik dashboard."
            path="/about"
          />
        ),
      },
      {
        path: "/contact",
        element: (
          <SectionPlaceholder
            title="Contact"
            description="Kirim pesan langsung ke pemilik dashboard."
            path="/contact"
          />
        ),
      },
      {
        path: "/privacy-policy",
        element: (
          <SectionPlaceholder
            title="Privacy Policy"
            description="Kebijakan privasi penggunaan situs."
            path="/privacy-policy"
          />
        ),
      },
    ],
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
    errorElement: <RouteError />,
  },
  {
    path: "/admin",
    element: withAdminShell(<AdminLayout />),
    errorElement: <RouteError />,
    children: [{ index: true, element: <AdminOverview /> }],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
