import { useHealth } from "@/features/health/api";
import { useLocale } from "@/i18n";
import { cn } from "@/lib/cn";

export function Footer() {
  const { t } = useLocale();
  const { data, isLoading, isError } = useHealth();

  const status = isLoading ? "…" : isError ? "OFFLINE" : (data?.database ?? "OFFLINE");
  const online = status === "ONLINE";

  return (
    <footer className="app-footer">
      <div className="flex items-center gap-2">
        <span>{t("footer.database")}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-semibold",
            online ? "text-[var(--rf-chrome)]" : "text-[var(--rf-accent)]",
          )}
        >
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              online ? "bg-current" : "bg-[var(--rf-accent)]",
            )}
          />
          {status}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span>{t("footer.systems")} · 2026</span>
        <span>© {t("footer.rights")}</span>
      </div>
    </footer>
  );
}
