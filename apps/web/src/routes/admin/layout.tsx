import { useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Gear, SignOut } from "@phosphor-icons/react";
import { useLogout, useSession } from "@/features/auth/api";
import { useLocale } from "@/i18n";
import { ApiError } from "@/lib/api-client";
import { AmbientBackground } from "@/components/layout/ambient-background";

export default function AdminLayout() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const session = useSession();
  const logout = useLogout();

  useEffect(() => {
    if (session.error instanceof ApiError && session.error.status === 401) {
      navigate("/admin/login", { replace: true });
    }
  }, [session.error, navigate]);

  if (session.isPending) {
    return (
      <>
        <AmbientBackground />
        <div className="loading-screen">{t("common.loading")}</div>
      </>
    );
  }

  if (!session.data) {
    return <div className="loading-screen">RF / ADMIN</div>;
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate("/admin/login", { replace: true }),
    });
  };

  return (
    <>
      <AmbientBackground />
      <div className="admin-shell">
        <header className="admin-header">
          <div className="flex items-center gap-3">
            <span className="admin-tag">
              <Gear size={12} />
              {t("admin.title")}
            </span>
            <nav aria-label="Navigasi admin">
              <Link to="/admin" className="nav-item">
                {t("admin.overview")}
              </Link>
              <Link to="/workspace" className="nav-item">
                {t("admin.backToSite")}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="mono text-[11px] text-[var(--rf-muted)]">
              {t("admin.signedInAs")}: <strong className="text-[var(--rf-text)]">{session.data.admin.username}</strong>
            </span>
            <button
              type="button"
              className="button ghost"
              onClick={handleLogout}
              disabled={logout.isPending}
            >
              <SignOut size={15} />
              {t("admin.logout")}
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
