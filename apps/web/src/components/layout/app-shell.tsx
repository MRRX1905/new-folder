import { List } from "@phosphor-icons/react";
import { Outlet } from "react-router-dom";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSidebar } from "@/stores/sidebar-store";
import { cn } from "@/lib/cn";
import { AmbientBackground } from "./ambient-background";
import { Footer } from "./footer";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppShell() {
  const { expanded, hidden, openDrawer } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 900px)");

  return (
    <>
      <AmbientBackground />
      <div className={cn("app-shell", !expanded && "is-collapsed", hidden && "is-hidden")}>
        <Sidebar />
        <div className="app-main">
          <Header />
          <main className="app-content">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>

      {isMobile || hidden ? (
        <button
          type="button"
          className="sidebar-fab"
          onClick={openDrawer}
          aria-label="Buka menu navigasi"
        >
          <List size={18} />
        </button>
      ) : null}
    </>
  );
}
