import { useSession } from "@/features/auth/api";
import { useLocale } from "@/i18n";

const format = (value: string): string =>
  new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

export function AdminOverview() {
  const { t } = useLocale();
  const { data } = useSession();

  if (!data) return null;

  return (
    <div>
      <span className="eyebrow">● RF / ADMIN</span>
      <h1 className="page-title">{t("admin.overview")}</h1>
      <p className="page-subtitle">{t("admin.phaseNotice")}</p>

      <div className="panel mt-8">
        <div className="mono mb-4 text-[10px] uppercase tracking-[0.2em] text-[var(--rf-muted)]">
          {t("admin.session")}
        </div>
        <dl className="session-grid">
          <div className="session-cell">
            <dt>{t("admin.signedInAs")}</dt>
            <dd>{data.admin.username}</dd>
          </div>
          <div className="session-cell">
            <dt>Admin ID</dt>
            <dd>{data.admin.id}</dd>
          </div>
          <div className="session-cell">
            <dt>{t("admin.expires")}</dt>
            <dd>{format(data.session.expiresAt)}</dd>
          </div>
          <div className="session-cell">
            <dt>Absolute expiry</dt>
            <dd>{format(data.session.absoluteExpiresAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
