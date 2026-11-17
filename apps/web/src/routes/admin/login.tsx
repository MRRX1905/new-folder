import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { loginSchema, type LoginInput } from "@rf/shared";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { useLogin, useSession } from "@/features/auth/api";
import { useLocale } from "@/i18n";
import { ApiError } from "@/lib/api-client";

export function AdminLogin() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const session = useSession();
  const login = useLogin();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  if (session.data) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = handleSubmit((values) => {
    setSubmitError(null);
    login.mutate(values, {
      onSuccess: () => navigate("/admin", { replace: true }),
      onError: (error) => {
        setSubmitError(
          error instanceof ApiError ? error.message : "Login gagal. Periksa koneksi lalu coba lagi.",
        );
      },
    });
  });

  return (
    <>
      <AmbientBackground />
      <div className="login-shell">
        <div className="login-card">
          <span className="eyebrow">● RF / ADMIN</span>
          <h1>{t("admin.title")}</h1>
          <p className="muted mb-6 text-[12.5px]">{t("admin.login")}</p>

          <form className="form-stack" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="username">{t("admin.username")}</label>
              <input
                id="username"
                className="input"
                autoComplete="username"
                autoFocus
                aria-invalid={Boolean(errors.username)}
                {...register("username")}
              />
              {errors.username ? <span className="field-error">{errors.username.message}</span> : null}
            </div>

            <div className="field">
              <label htmlFor="password">{t("admin.password")}</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
            </div>

            {submitError ? <div className="form-alert">{submitError}</div> : null}

            <button type="submit" className="button" disabled={isSubmitting || login.isPending}>
              {login.isPending ? t("admin.signingIn") : t("admin.signIn")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/workspace" className="mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--rf-muted)]">
              {t("admin.backToSite")}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
