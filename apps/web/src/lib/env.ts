const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";
const siteUrl =
  import.meta.env.VITE_SITE_URL ??
  (typeof window === "undefined" ? "http://localhost:5173" : window.location.origin);

export const env = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
  siteUrl: siteUrl.replace(/\/$/, ""),
  recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? "",
} as const;
