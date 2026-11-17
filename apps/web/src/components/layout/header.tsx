import { useLocation } from "react-router-dom";
import { useClock } from "@/hooks/use-clock";
import { useLocale, type TranslationKey } from "@/i18n";

const LABELS: Record<string, TranslationKey> = {
  workspace: "nav.workspace",
  ai: "nav.ai",
  tools: "nav.tools",
  websites: "nav.websites",
  projects: "nav.projects",
  "tech-stack": "nav.techStack",
  "learning-journey": "nav.learning",
  setup: "nav.setup",
  timeline: "nav.timeline",
  statistics: "nav.statistics",
  about: "nav.about",
  contact: "nav.contact",
  "privacy-policy": "common.backHome",
};

export function Header() {
  const { pathname } = useLocation();
  const clock = useClock();
  const { t } = useLocale();

  const segments = pathname.split("/").filter(Boolean);
  const current = segments[0] ?? "workspace";
  const labelKey = LABELS[current];

  return (
    <header className="app-header">
      <div className="min-w-0">
        <div className="mono text-[10px] uppercase tracking-[0.22em] text-[var(--rf-muted)]">
          RF / {segments.length > 1 ? `${current} / ${segments[segments.length - 1]}` : current}
        </div>
        <div className="truncate text-[13px] font-semibold">
          {labelKey ? t(labelKey) : t("nav.workspace")}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="mono hidden text-[11px] tracking-[0.14em] text-[var(--rf-muted)] sm:inline">
          {t("header.clock")}
        </span>
        <span className="mono rounded-md border border-[var(--rf-border)] px-2.5 py-1 text-[12px] tabular-nums">
          {clock}
        </span>
        <span className="hidden items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--rf-muted)] md:flex">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--rf-accent)]" />
          v1.0
        </span>
      </div>
    </header>
  );
}
