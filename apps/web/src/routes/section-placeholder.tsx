import { useEffect } from "react";
import { useLocale } from "@/i18n";
import { applyPageMeta } from "@/lib/seo";

interface SectionPlaceholderProps {
  title: string;
  description: string;
  path: string;
}

export function SectionPlaceholder({ title, description, path }: SectionPlaceholderProps) {
  const { t } = useLocale();

  useEffect(() => {
    applyPageMeta({ title: `${title} — RF`, description, path });
  }, [description, path, title]);

  return (
    <div className="mx-auto max-w-5xl">
      <span className="eyebrow">● RF / {path.replace("/", "").toUpperCase()}</span>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{description}</p>

      <div className="panel mt-8">
        <div className="mono text-[10px] uppercase tracking-[0.2em] text-[var(--rf-muted)]">
          STATUS / SCAFFOLD
        </div>
        <p className="mt-3 text-[14px]">{t("common.comingSoon")}</p>
      </div>
    </div>
  );
}
