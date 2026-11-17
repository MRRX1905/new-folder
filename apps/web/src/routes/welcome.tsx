import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "@/i18n";
import { applyPageMeta } from "@/lib/seo";
import { AmbientBackground } from "@/components/layout/ambient-background";

const ENTER_DELAY_MS = 5_000;

export function Welcome() {
  const navigate = useNavigate();
  const { t } = useLocale();

  useEffect(() => {
    applyPageMeta({
      title: "RF — Personal Tech Dashboard",
      description:
        "Eksplorasi AI, tools, website, proyek, dan perjalanan teknologi RF dalam satu dashboard interaktif.",
      path: "/",
    });

    const timer = window.setTimeout(() => navigate("/workspace"), ENTER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      <AmbientBackground />
      <div
        className="welcome"
        onClick={() => navigate("/workspace")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") navigate("/workspace");
        }}
        role="presentation"
      >
        <div className="welcome-inner">
          <div className="welcome-mark" aria-hidden="true">
            RF
          </div>
          <div>
            <h1>{t("brand.name")}</h1>
            <p className="identity mt-2">{t("welcome.identity")}</p>
          </div>

          <button type="button" className="button mt-2" onClick={() => navigate("/workspace")}>
            {t("welcome.enter")}
          </button>

          <div className="welcome-progress" aria-hidden="true">
            <span />
          </div>
          <p className="welcome-hint">{t("welcome.hint")}</p>
        </div>
      </div>
    </>
  );
}
