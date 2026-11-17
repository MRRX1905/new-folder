import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";
import { AmbientBackground } from "@/components/layout/ambient-background";

export function NotFound() {
  const { t } = useLocale();

  return (
    <>
      <AmbientBackground />
      <div className="relative z-[1] grid min-h-screen place-items-center p-6 text-center">
        <div>
          <div className="mono text-[11px] uppercase tracking-[0.28em] text-[var(--rf-accent)]">
            ERROR / 404
          </div>
          <h1 className="my-4 text-[clamp(64px,18vw,160px)] font-extrabold leading-none tracking-tighter text-[var(--rf-chrome)]">
            404
          </h1>
          <p className="muted mb-8">{t("common.notFound")}</p>
          <Link to="/workspace" className="button">
            {t("common.backHome")}
          </Link>
        </div>
      </div>
    </>
  );
}
