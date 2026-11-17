import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "@/i18n";
import { applyPageMeta } from "@/lib/seo";

interface Section {
  to: string;
  title: string;
  description: string;
}

const SECTIONS: Section[] = [
  { to: "/ai", title: "AI Collection", description: "Model dan layanan AI yang pernah dan sedang dipakai." },
  { to: "/tools", title: "Tools", description: "Perangkat kerja untuk pengembangan, desain, dan produktivitas." },
  { to: "/websites", title: "Websites", description: "Platform dan situs yang menjadi bagian dari ekosistem." },
  { to: "/projects", title: "Projects", description: "Proyek dan eksperimen yang pernah dibangun." },
  { to: "/tech-stack", title: "Tech Stack", description: "Teknologi di balik RF Personal Tech Dashboard." },
  { to: "/learning-journey", title: "Learning Journey", description: "Bidang yang sedang dan pernah dipelajari." },
  { to: "/setup", title: "Setup & Devices", description: "Perangkat dan spesifikasi yang digunakan sehari-hari." },
  { to: "/timeline", title: "Timeline", description: "Riwayat aktivitas dan pencapaian teknologi." },
  { to: "/statistics", title: "Statistics", description: "Ringkasan angka dari seluruh koleksi." },
  { to: "/about", title: "About Me", description: "Profil, minat, dan tujuan pemilik dashboard." },
  { to: "/contact", title: "Contact", description: "Kirim pesan langsung ke pemilik dashboard." },
];

export function Workspace() {
  const { t } = useLocale();

  useEffect(() => {
    applyPageMeta({
      title: "Workspace — RF Personal Tech Dashboard",
      description: "Pusat eksplorasi koleksi AI, tools, website, proyek, dan perjalanan teknologi RF.",
      path: "/workspace",
    });
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <span className="eyebrow">● RF / WORKSPACE</span>
      <h1 className="page-title">{t("nav.workspace")}</h1>
      <p className="page-subtitle">
        Ruang eksplorasi teknologi: koleksi AI, tools, website, proyek, dan perjalanan belajar.
        Setiap modul dikelola dari Admin Console.
      </p>

      <div className="divider" />

      <div className="panel-grid">
        {SECTIONS.map((section) => (
          <Link key={section.to} to={section.to} className="section-link">
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-[var(--rf-accent)]">
              {section.to.replace("/", "")}
            </span>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
