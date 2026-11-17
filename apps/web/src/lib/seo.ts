import { env } from "./env";

interface PageMeta {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}

const setMeta = (attr: "name" | "property", key: string, content: string): void => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

export const applyPageMeta = ({ title, description, path, noIndex }: PageMeta): void => {
  document.title = title;
  setMeta("name", "description", description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:type", "website");
  setMeta("property", "og:url", `${env.siteUrl}${path}`);
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "robots", noIndex ? "noindex,nofollow" : "index,follow");

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = `${env.siteUrl}${path}`;
};
