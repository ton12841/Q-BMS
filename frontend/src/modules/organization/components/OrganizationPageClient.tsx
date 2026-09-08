"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import QBMSAppShell, {
  QBMSIcon,
  type QBMSIconName,
} from "@/components/layout/QBMSAppShell";
import { useI18n } from "@/i18n/useQBMSI18n";

type OrganizationArea = {
  number: string;
  titleKey: string;
  descriptionKey: string;
  icon: QBMSIconName;
  status: "ready" | "next" | "planned";
  href?: string;
};

const areas: OrganizationArea[] = [
  {
    number: "01",
    titleKey: "organization.businessUnit",
    descriptionKey: "organization.businessUnitDescription",
    icon: "building",
    status: "ready",
    href: "/organization/business-units",
  },
  {
    number: "02",
    titleKey: "organization.levelGrade",
    descriptionKey: "organization.levelGradeDescription",
    icon: "badge",
    status: "ready",
    href: "/organization/level-grade",
  },
  {
    number: "03",
    titleKey: "organization.position",
    descriptionKey: "organization.positionDescription",
    icon: "briefcase",
    status: "ready",
    href: "/organization/positions",
  },
  {
    number: "04",
    titleKey: "organization.reportingLines",
    descriptionKey: "organization.reportingLinesDescription",
    icon: "network",
    status: "ready",
    href: "/organization/reporting-lines",
  },
  {
    number: "05",
    titleKey: "organization.organizationChart",
    descriptionKey: "organization.organizationChartDescription",
    icon: "users",
    status: "ready",
    href: "/organization/chart",
  },
];

export default function OrganizationPageClient() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const filteredAreas = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return areas;

    return areas.filter((area) =>
      [t(area.titleKey), t(area.descriptionKey)]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [query, t]);

  function statusLabel(status: OrganizationArea["status"]) {
    if (status === "ready") return t("common.available");
    if (status === "next") return t("common.next");
    return t("common.planned");
  }

  return (
    <QBMSAppShell
      pageTitle={t("organization.pageTitle")}
      pageDescription={t("organization.pageDescription")}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("organization.searchPlaceholder")}
    >
      <div className="qbms-breadcrumb">
        <Link href="/">{t("shell.modulesTools")}</Link>
        <span>›</span>
        <strong>{t("organization.pageTitle")}</strong>
      </div>

      <section className="qbms-organization-hero">
        <div className="qbms-organization-hero-icon">
          <QBMSIcon name="building" size={28} />
        </div>
        <div>
          <div className="qbms-eyebrow">ORGANIZATION MODULE</div>
          <h2>{t("organization.heroTitle")}</h2>
          <p>{t("organization.heroDescription")}</p>
        </div>
        <div className="qbms-foundation-state">
          <span />
          {t("organization.foundationInProgress")}
        </div>
      </section>

      <section className="qbms-org-section">
        <div className="qbms-section-heading-row">
          <div>
            <h3>{t("organization.setupTitle")}</h3>
            <p>{t("organization.setupDescription")}</p>
          </div>
          <span>{t("common.items", { count: filteredAreas.length })}</span>
        </div>

        <div className="qbms-org-area-grid">
          {filteredAreas.map((area) => {
            const content = (
              <>
                <div className="qbms-org-number">{area.number}</div>
                <div className="qbms-org-area-icon">
                  <QBMSIcon name={area.icon} size={23} />
                </div>
                <div className="qbms-org-area-copy">
                  <div className="qbms-org-area-title">
                    <strong>{t(area.titleKey)}</strong>
                    <span className={`qbms-org-state ${area.status}`}>
                      {statusLabel(area.status)}
                    </span>
                  </div>
                  <p>{t(area.descriptionKey)}</p>
                </div>
                <span className="qbms-card-arrow">
                  <QBMSIcon name="chevron" size={18} />
                </span>
              </>
            );

            return area.href ? (
              <Link
                className="qbms-org-area-card enabled"
                href={area.href}
                key={area.titleKey}
              >
                {content}
              </Link>
            ) : (
              <div className="qbms-org-area-card" key={area.titleKey}>
                {content}
              </div>
            );
          })}
        </div>
      </section>
    </QBMSAppShell>
  );
}
