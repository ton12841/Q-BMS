"use client";

import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/i18n/useQBMSI18n";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import shellPolish from "./QBMSAppShellPolish.module.css";
import { resolveQaModuleByPath } from "@/qa/module-data/qaModuleRegistry";
import {
  fetchAuthSession,
  logoutSession,
  type AuthSession,
} from "@/modules/auth/api/auth.api";

export type QBMSIconName =
  | "home"
  | "grid"
  | "dashboard"
  | "report"
  | "bell"
  | "star"
  | "settings"
  | "menu"
  | "search"
  | "users"
  | "building"
  | "briefcase"
  | "box"
  | "wrench"
  | "wallet"
  | "cart"
  | "chart"
  | "shield"
  | "chevron"
  | "sparkle"
  | "layers"
  | "badge"
  | "network"
  | "refresh"
  | "arrowLeft"
  | "check"
  | "clock"
  | "plus"
  | "info"
  | "lock"
  | "pause";

type NavItem = {
  key: string;
  labelKey: string;
  icon: QBMSIconName;
  badge?: string;
};

type QBMSAppShellProps = {
  pageTitle: string;
  pageDescription: string;
  children: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
};

const navigation: NavItem[] = [
  { key: "home", labelKey: "shell.home", icon: "home" },
  { key: "modules", labelKey: "shell.modulesTools", icon: "grid" },
  { key: "dashboard", labelKey: "shell.myDashboard", icon: "dashboard" },
  { key: "reports", labelKey: "shell.reports", icon: "report" },
  { key: "alerts", labelKey: "shell.alerts", icon: "bell" },
  { key: "favorites", labelKey: "shell.favorites", icon: "star" },
  { key: "settings", labelKey: "shell.settings", icon: "settings" },
];

export function QBMSIcon({
  name,
  size = 20,
}: {
  name: QBMSIconName;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<QBMSIconName, ReactNode> = {
    home: (
      <>
        <path d="M3 10.8 12 3l9 7.8" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.4" />
        <rect x="14" y="3" width="7" height="7" rx="1.4" />
        <rect x="3" y="14" width="7" height="7" rx="1.4" />
        <rect x="14" y="14" width="7" height="7" rx="1.4" />
      </>
    ),
    dashboard: (
      <>
        <path d="M4 13a8 8 0 1 1 16 0" />
        <path d="m12 13 4-4" />
        <path d="M5 19h14" />
      </>
    ),
    report: (
      <>
        <path d="M5 3h10l4 4v14H5z" />
        <path d="M14 3v5h5" />
        <path d="M8 13h8M8 17h6" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="9" r="3" />
        <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
        <circle cx="17" cy="8" r="2.2" />
        <path d="M15.5 14.6A4.5 4.5 0 0 1 21 19" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V5l8-3v19" />
        <path d="M12 8h8v13" />
        <path d="M7 8h2M7 12h2M7 16h2M15 11h2M15 15h2M3 21h18" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5h6v2M3 12h18M10 12v2h4v-2" />
      </>
    ),
    box: (
      <>
        <path d="m4 7 8-4 8 4-8 4z" />
        <path d="M4 7v10l8 4 8-4V7M12 11v10" />
      </>
    ),
    wrench: <path d="M14.5 6.5a4 4 0 0 0-5-5L12 4 9 7 6.5 4.5a4 4 0 0 0 5 5L4 17a2 2 0 0 0 3 3l7.5-7.5a4 4 0 0 0 5-5L17 10l-3-3z" />,
    wallet: (
      <>
        <path d="M4 5h15a2 2 0 0 1 2 2v12H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12" />
        <path d="M16 11h5v5h-5a2.5 2.5 0 0 1 0-5Z" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
        <path d="M2 20h22" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 20 5v6c0 5.2-3.4 9-8 11-4.6-2-8-5.8-8-11V5z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    sparkle: (
      <>
        <path d="m12 3 1.1 3.1L16 7.2l-2.9 1.1L12 11l-1.1-2.7L8 7.2l2.9-1.1z" />
        <path d="m18 13 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8z" />
      </>
    ),
    layers: (
      <>
        <path d="m12 3 9 5-9 5-9-5z" />
        <path d="m3 12 9 5 9-5" />
        <path d="m3 16 9 5 9-5" />
      </>
    ),
    badge: (
      <>
        <circle cx="12" cy="9" r="5" />
        <path d="m8.5 13-1 8 4.5-2 4.5 2-1-8" />
      </>
    ),
    network: (
      <>
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="18" r="2" />
        <path d="M12 7v4M5 16v-3h14v3M12 11H5M12 11h7" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 6v5h-5" />
        <path d="M4 18v-5h5" />
        <path d="M6.1 9a7 7 0 0 1 11.5-2.6L20 9" />
        <path d="M17.9 15A7 7 0 0 1 6.4 17.6L4 15" />
      </>
    ),
    arrowLeft: <path d="m15 18-6-6 6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6" />
        <path d="M12 7h.01" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    pause: (
      <>
        <path d="M9 6v12" />
        <path d="M15 6v12" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default function QBMSAppShell({
  pageTitle,
  pageDescription,
  children,
  searchValue = "",
  onSearchChange,
  searchPlaceholder,
}: QBMSAppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [temporaryView, setTemporaryView] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchAuthSession(controller.signal)
      .then((session) => {
        if (!session.hasWorkspaceSession) {
          logoutSession()
            .catch(() => undefined)
            .finally(() => router.replace("/login"));
          return;
        }

        if (
          session.sessionKind !== "DEVELOPMENT_PREVIEW" &&
          !session.canAccessWorkspace
        ) {
          router.replace("/onboarding/profile");
          return;
        }

        setAuthSession(session);
      })
      .catch(() => {
        // Abort is expected when React/Next.js unmounts this shell during
        // navigation or Fast Refresh. Never turn that normal abort into an
        // authentication redirect, otherwise /login and / can loop.
        if (controller.signal.aborted) return;
        router.replace("/login");
      });

    return () => controller.abort();
  }, [router]);

  async function handleLogout() {
    if (signingOut) return;

    setSigningOut(true);
    try {
      await logoutSession();
    } finally {
      window.location.replace("/login");
    }
  }

  const isDevelopmentPreview =
    authSession?.sessionKind === "DEVELOPMENT_PREVIEW";
  const displayName = isDevelopmentPreview
    ? t("authSession.developmentPreview")
    : authSession?.user?.displayName || t("authSession.sessionChecking");
  const accessLabel = isDevelopmentPreview
    ? locale === "th" ? "โหมดพัฒนาในเครื่อง" : "Local development"
    : authSession?.roles?.[0]?.name || authSession?.user?.email || "Q BMS";
  const avatarText = isDevelopmentPreview
    ? "DEV"
    : (authSession?.user?.nickname || authSession?.user?.firstName || "QB")
        .slice(0, 2)
        .toUpperCase();

  const canOpenSuperAdmin =
    isDevelopmentPreview || Boolean(authSession?.isSuperAdmin);

  const qaModule = resolveQaModuleByPath(pathname);
  const isQaDataMode = Boolean(pathname?.startsWith("/qa-data/"));

  function openQaDataMode() {
    if (!qaModule) return;
    router.push(`/qa-data/${qaModule.key}`);
  }

  function openRealDataMode() {
    if (!qaModule) return;
    router.push(qaModule.realHref);
  }

  const superAdminLabel =
    locale === "th"
      ? "ผู้ดูแลระบบ"
      : locale === "lo"
        ? "ຜູ້ເບິ່ງແຍງລະບົບ"
        : "Super Admin";

  const canOpenAccessControl =
    canOpenSuperAdmin ||
    Boolean(authSession?.permissions?.includes("system.access_control.view"));

  function handleNavigation(item: NavItem) {
    if (item.key === "home") {
      setTemporaryView(null);
      router.push("/workspace");
      return;
    }

    if (item.key === "modules") {
      setTemporaryView(null);
      router.push("/");
      return;
    }

    setTemporaryView(item.labelKey);
  }

  function openSuperAdmin() {
    setTemporaryView(null);
    router.push("/super-admin");
  }

  function handleModulesToolsClickCapture(
    event: ReactMouseEvent<HTMLElement>
  ) {
    if (pathname !== "/" || !canOpenSuperAdmin) {
      return;
    }

    const target =
      event.target instanceof HTMLElement ? event.target : null;

    const interactive = target?.closest(
      'button, a, [role="button"], [tabindex="0"]'
    ) as HTMLElement | null;

    if (!interactive) {
      return;
    }

    const text = (interactive.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (!text.includes("super admin")) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    openSuperAdmin();
  }

  const temporaryLabel = temporaryView ? t(temporaryView) : null;

  return (
    <div className={`qbms-app-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className="qbms-sidebar">
        <div className="qbms-brand">
          <img src="/qbms-logo.png" alt="Q BMS" />
          <div className="qbms-brand-copy">
            <strong>Q BMS</strong>
            <span>{t("shell.brandSubtitle")}</span>
          </div>
        </div>

        <nav className="qbms-nav" aria-label="Primary">
          {navigation.map((item) => {
            const active =
              temporaryView === item.labelKey ||
              (!temporaryView && item.key === "home" && pathname?.startsWith("/workspace")) ||
              (
                !temporaryView &&
                item.key === "modules" &&
                !pathname?.startsWith("/workspace") &&
                !pathname?.startsWith("/super-admin")
              );

            return (
              <button
                type="button"
                key={item.key}
                className={`qbms-nav-item ${active ? "active" : ""}`}
                onClick={() => handleNavigation(item)}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <span className="qbms-nav-icon">
                  <QBMSIcon name={item.icon} />
                </span>
                <span className="qbms-nav-label">{t(item.labelKey)}</span>
                {item.badge && <span className="qbms-nav-badge">{item.badge}</span>}
              </button>
            );
          })}

          {canOpenSuperAdmin && (
            <button
              type="button"
              className={`qbms-nav-item ${
                !temporaryView && pathname?.startsWith("/super-admin")
                  ? "active"
                  : ""
              }`}
              onClick={openSuperAdmin}
              title={collapsed ? superAdminLabel : undefined}
            >
              <span className="qbms-nav-icon">
                <QBMSIcon name="shield" />
              </span>
              <span className="qbms-nav-label">{superAdminLabel}</span>
            </button>
          )}
        </nav>

        <div className="qbms-sidebar-footer">
          <div className="qbms-product-mini">
            <span className="qbms-mini-logo">
              <img src="/qbms-logo.png" alt="" />
            </span>
            <span className="qbms-footer-copy">
              <strong>Q BMS</strong>
              <small>v2.3.3.4</small>
            </span>
          </div>

          <div className="qbms-system-status">
            <span className="qbms-status-dot" />
            <span className="qbms-footer-copy">{t("shell.systemOperational")}</span>
          </div>
        </div>
      </aside>

      <section className="qbms-main">
        <header className="qbms-topbar">
          <div className="qbms-topbar-left">
            <button
              className="qbms-icon-button qbms-menu-button"
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label="Toggle sidebar"
            >
              <QBMSIcon name="menu" />
            </button>

            <div className="qbms-page-title">
              <h1>{temporaryLabel || pageTitle}</h1>
              <p>
                {temporaryView
                  ? t("shell.reservedDescription")
                  : pageDescription}
              </p>
            </div>
          </div>

          <div className="qbms-topbar-center">
            <label className="qbms-search">
              <QBMSIcon name="search" size={18} />
              <input
                value={temporaryView ? "" : searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder={temporaryView ? t("common.search") : searchPlaceholder || t("shell.searchPlaceholder")}
                disabled={Boolean(temporaryView)}
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>

          <div className="qbms-topbar-actions">
            <LanguageSwitcher />

            <button
              className="qbms-icon-button qbms-notification"
              type="button"
              aria-label="Notifications"
            >
              <QBMSIcon name="bell" />
              <span />
            </button>

            <div className="qbms-user-menu-wrap">
              <button
                className={`qbms-user-chip ${isDevelopmentPreview ? shellPolish.developmentChip : ""}`}
                type="button"
                onClick={() => setUserMenuOpen((value) => !value)}
                aria-expanded={userMenuOpen}
              >
                <span className={`qbms-avatar ${isDevelopmentPreview ? "is-development" : ""}`}>
                  {avatarText}
                </span>
                <span className="qbms-user-copy">
                  <strong>{displayName}</strong>
                  <small>{accessLabel}</small>
                </span>
                <span className="qbms-user-caret">⌄</span>
              </button>

              {userMenuOpen && (
                <div className="qbms-user-menu">
                  <div className="qbms-user-menu-status">
                    <span>{t("authSession.roles")}</span>
                    <strong>
                      {isDevelopmentPreview
                        ? t("authSession.noRoles")
                        : authSession?.roles?.map((role) => role.name).join(", ") || "—"}
                    </strong>
                  </div>
                  {canOpenAccessControl && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        router.push("/super-admin/access-control");
                      }}
                    >
                      Access Control
                    </button>
                  )}
                  <button type="button" onClick={handleLogout} disabled={signingOut}>
                    {t("authSession.signOut")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="qbms-content" onClickCapture={handleModulesToolsClickCapture}>
          {isDevelopmentPreview && qaModule && !temporaryView ? (
            <section className={shellPolish.qaDataBar}>
              <div className={shellPolish.qaDataCopy}>
                <span className={shellPolish.qaDataEyebrow}>DEVELOPMENT PREVIEW</span>
                <strong>{qaModule.canonicalName}</strong>
                <small>
                  {isQaDataMode
                    ? "QA sample data is isolated and never saved to real records."
                    : "Switch to QA Data Mode to preview this module with populated sample data."}
                </small>
              </div>

              <div className={shellPolish.qaDataSwitch} aria-label="Data view">
                <button
                  type="button"
                  className={!isQaDataMode ? shellPolish.qaDataActive : ""}
                  onClick={openRealDataMode}
                >
                  Real Data
                </button>
                <button
                  type="button"
                  className={isQaDataMode ? shellPolish.qaDataActive : ""}
                  onClick={openQaDataMode}
                >
                  QA Data Mode
                </button>
              </div>

              {isQaDataMode ? (
                <span className={shellPolish.qaDataWarning}>SAMPLE DATA ONLY</span>
              ) : null}
            </section>
          ) : null}

          {temporaryView ? (
            <section className="qbms-placeholder">
              <span className="qbms-placeholder-icon">
                <QBMSIcon name="grid" size={28} />
              </span>
              <h3>{temporaryLabel}</h3>
              <p>{t("shell.reservedBody")}</p>
              <button
                type="button"
                onClick={() => {
                  setTemporaryView(null);
                  router.push("/");
                }}
              >
                {t("shell.backToModules")}
              </button>
            </section>
          ) : (
            children
          )}
        </main>
      </section>
    </div>
  );
}
