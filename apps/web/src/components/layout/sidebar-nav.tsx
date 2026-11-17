import {
  ChartBar,
  ClockCounterClockwise,
  Desktop,
  EnvelopeSimple,
  FolderOpen,
  Gear,
  GlobeHemisphereWest,
  GraduationCap,
  Robot,
  SquaresFour,
  Stack,
  UserCircle,
  Wrench,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { useLocale, type TranslationKey } from "@/i18n";

interface NavEntry {
  to: string;
  labelKey: TranslationKey;
  icon: Icon;
  end?: boolean;
}

const MAIN_NAV: NavEntry[] = [
  { to: "/workspace", labelKey: "nav.workspace", icon: SquaresFour, end: true },
  { to: "/ai", labelKey: "nav.ai", icon: Robot },
  { to: "/tools", labelKey: "nav.tools", icon: Wrench },
  { to: "/websites", labelKey: "nav.websites", icon: GlobeHemisphereWest },
  { to: "/projects", labelKey: "nav.projects", icon: FolderOpen },
  { to: "/tech-stack", labelKey: "nav.techStack", icon: Stack },
  { to: "/learning-journey", labelKey: "nav.learning", icon: GraduationCap },
  { to: "/setup", labelKey: "nav.setup", icon: Desktop },
];

const SECONDARY_NAV: NavEntry[] = [
  { to: "/timeline", labelKey: "nav.timeline", icon: ClockCounterClockwise },
  { to: "/statistics", labelKey: "nav.statistics", icon: ChartBar },
  { to: "/about", labelKey: "nav.about", icon: UserCircle },
  { to: "/contact", labelKey: "nav.contact", icon: EnvelopeSimple },
];

const ADMIN_NAV: NavEntry = { to: "/admin", labelKey: "nav.admin", icon: Gear };

const NavGroup = ({ entries, onNavigate }: { entries: NavEntry[]; onNavigate?: () => void }) => {
  const { t } = useLocale();

  return (
    <div className="sidebar-nav">
      {entries.map((entry) => {
        const ItemIcon = entry.icon;
        return (
          <NavLink
            key={entry.to}
            to={entry.to}
            end={entry.end}
            onClick={onNavigate}
            className={({ isActive }) => cn("nav-item", isActive && "active")}
          >
            <ItemIcon size={18} weight="duotone" aria-hidden="true" />
            <span>{t(entry.labelKey)}</span>
          </NavLink>
        );
      })}
    </div>
  );
};

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLocale();

  return (
    <nav aria-label="Navigasi utama" className="flex flex-col gap-4">
      <NavGroup entries={MAIN_NAV} onNavigate={onNavigate} />
      <div>
        <div className="nav-label">Explore</div>
        <NavGroup entries={SECONDARY_NAV} onNavigate={onNavigate} />
      </div>
      <div>
        <div className="nav-label">System</div>
        <NavGroup entries={[ADMIN_NAV]} onNavigate={onNavigate} />
        <span className="sr-only">{t("nav.admin")}</span>
      </div>
    </nav>
  );
}
