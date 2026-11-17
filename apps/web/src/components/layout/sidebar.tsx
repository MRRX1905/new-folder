import { CaretLeft, List, X } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";
import { THEMES } from "@/features/theme/themes";
import { useTheme } from "@/features/theme/use-theme";
import { useSidebar } from "@/stores/sidebar-store";
import { cn } from "@/lib/cn";
import { SidebarNav } from "./sidebar-nav";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t, locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const { expanded, toggleExpanded } = useSidebar();

  return (
    <>
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          RF
        </span>
        <span className="brand-text">
          <strong>{t("brand.name")}</strong>
          <span>{t("brand.suffix")}</span>
        </span>
        <button
          type="button"
          className="icon-button ml-auto"
          onClick={toggleExpanded}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={expanded}
        >
          <CaretLeft size={16} style={{ transform: expanded ? "none" : "rotate(180deg)" }} />
        </button>
      </div>

      <SidebarNav onNavigate={onNavigate} />

      <div className="sidebar-controls">
        <div>
          <div className="sidebar-controls-label">{t("theme.label")}</div>
          <div className="chip-row mt-2">
            {THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                className="chip"
                aria-pressed={theme === item.id}
                onClick={() => setTheme(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-row">
          <span className="sidebar-controls-label">{t("language.label")}</span>
          <div className="chip-row">
            <button type="button" className="chip" aria-pressed={locale === "id"} onClick={() => setLocale("id")}>
              ID
            </button>
            <button type="button" className="chip" aria-pressed={locale === "en"} onClick={() => setLocale("en")}>
              EN
            </button>
          </div>
        </div>

        <Link to="/workspace" className="nav-item" onClick={onNavigate}>
          <List size={18} weight="duotone" aria-hidden="true" />
          <span>Workspace</span>
        </Link>
      </div>
    </>
  );
}

export function Sidebar() {
  const { hidden, drawerOpen, closeDrawer } = useSidebar();
  const { t } = useLocale();

  return (
    <>
      <aside className={cn("app-sidebar", hidden && "is-hidden")} aria-label="Sidebar">
        <SidebarContent />
      </aside>

      {drawerOpen ? (
        <>
          <div className="drawer-backdrop" onClick={closeDrawer} role="presentation" />
          <aside className="mobile-drawer is-open" aria-label="Menu navigasi">
            <button
              type="button"
              className="icon-button drawer-close"
              onClick={closeDrawer}
              aria-label="Tutup menu"
            >
              <X size={16} />
            </button>
            <SidebarContent onNavigate={closeDrawer} />
            <span className="sr-only">{t("nav.workspace")}</span>
          </aside>
        </>
      ) : null}
    </>
  );
}
