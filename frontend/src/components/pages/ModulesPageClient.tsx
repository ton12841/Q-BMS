"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import QBMSAppShell, {
  QBMSIcon,
  type QBMSIconName,
} from "@/components/layout/QBMSAppShell";
import { useI18n } from "@/i18n/useQBMSI18n";

type ModuleCard = {
  titleKey: string;
  descriptionKey: string;
  icon: QBMSIconName;
  tagKey?: string;
  status?: "active" | "hold";
  href: string;
};

const groups: Array<{
  titleKey: string;
  descriptionKey: string;
  cards: ModuleCard[];
}> = [
  {
    titleKey: "modules.peopleOrg.title",
    descriptionKey: "modules.peopleOrg.description",
    cards: [
      { titleKey: "modules.employee.title", descriptionKey: "modules.employee.description", icon: "users", tagKey: "modules.tag.module", href: "/employee" },
      { titleKey: "modules.organization.title", descriptionKey: "modules.organization.description", icon: "building", tagKey: "modules.tag.module", href: "/organization" },
      { titleKey: "modules.hrm.title", descriptionKey: "modules.hrm.description", icon: "briefcase", tagKey: "modules.tag.tool", href: "/hrm" },
    ],
  },
  {
    titleKey: "modules.sharedMasters.title",
    descriptionKey: "modules.sharedMasters.description",
    cards: [
      { titleKey: "modules.customer.title", descriptionKey: "modules.customer.description", icon: "users", tagKey: "modules.tag.module", href: "/module/customer" },
      { titleKey: "modules.product.title", descriptionKey: "modules.product.description", icon: "box", tagKey: "modules.tag.module", href: "/module/product" },
      { titleKey: "modules.supplier.title", descriptionKey: "modules.supplier.description", icon: "briefcase", tagKey: "modules.tag.module", href: "/module/supplier-vendor" },
      { titleKey: "modules.location.title", descriptionKey: "modules.location.description", icon: "building", tagKey: "modules.tag.module", href: "/module/location-site" },
      { titleKey: "modules.asset.title", descriptionKey: "modules.asset.description", icon: "box", tagKey: "modules.tag.module", href: "/module/asset" },
      { titleKey: "modules.document.title", descriptionKey: "modules.document.description", icon: "report", tagKey: "modules.tag.module", href: "/module/document" },
      { titleKey: "modules.taskApproval.title", descriptionKey: "modules.taskApproval.description", icon: "layers", tagKey: "modules.tag.module", href: "/module/task-approval" },
      { titleKey: "modules.notification.title", descriptionKey: "modules.notification.description", icon: "bell", tagKey: "modules.tag.module", href: "/module/notification" },
    ],
  },
  {
    titleKey: "modules.businessOps.title",
    descriptionKey: "modules.businessOps.description",
    cards: [
      { titleKey: "modules.inventory.title", descriptionKey: "modules.inventory.description", icon: "box", tagKey: "modules.tag.tool", href: "/module/inventory" },
      { titleKey: "modules.installation.title", descriptionKey: "modules.installation.description", icon: "wrench", tagKey: "modules.tag.tool", href: "/module/installation" },
      { titleKey: "modules.procurement.title", descriptionKey: "modules.procurement.description", icon: "cart", tagKey: "modules.tag.tool", href: "/module/procurement" },
    ],
  },
  {
    titleKey: "modules.management.title",
    descriptionKey: "modules.management.description",
    cards: [
      { titleKey: "modules.financial.title", descriptionKey: "modules.financial.description", icon: "wallet", tagKey: "modules.tag.tool", href: "/module/financial" },
      { titleKey: "modules.managementDashboard.title", descriptionKey: "modules.managementDashboard.description", icon: "chart", tagKey: "modules.tag.tool", href: "/module/management-dashboard" },
      { titleKey: "modules.crm.title", descriptionKey: "modules.crm.description", icon: "grid", tagKey: "modules.tag.tool", href: "/module/crm", status: "hold" },
    ],
  },
  {
    titleKey: "modules.platformAdmin.title",
    descriptionKey: "modules.platformAdmin.description",
    cards: [
      { titleKey: "modules.itAdmin.title", descriptionKey: "modules.itAdmin.description", icon: "network", tagKey: "modules.tag.tool", href: "/it-admin" },
      { titleKey: "modules.superAdmin.title", descriptionKey: "modules.superAdmin.description", icon: "shield", tagKey: "modules.tag.tool", href: "/super-admin" },
    ],
  },
];

export default function ModulesPageClient() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const visibleGroups = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return groups;

    return groups
      .map((group) => ({
        ...group,
        cards: group.cards.filter((card) =>
          [t(card.titleKey), t(card.descriptionKey), card.tagKey ? t(card.tagKey) : ""]
            .join(" ")
            .toLowerCase()
            .includes(value)
        ),
      }))
      .filter((group) => group.cards.length > 0);
  }, [query, t]);

  return (
    <QBMSAppShell
      pageTitle={t("modules.pageTitle")}
      pageDescription={t("modules.pageDescription")}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={t("modules.searchPlaceholder")}
    >
      <section className="qbms-welcome">
        <div>
          <div className="qbms-eyebrow">
            <QBMSIcon name="sparkle" size={15} />
            Q BUSINESS MANAGEMENT SYSTEM
          </div>
          <h2>{t("modules.heroTitle")}</h2>
          <p>{t("modules.heroDescription")}</p>
        </div>

        <div className="qbms-overview-pills">
          <span><strong>10</strong> {t("modules.modules")}</span>
          <span><strong>9</strong> {t("modules.tools")}</span>
          <span className="ok"><span /> {t("modules.platformReady")}</span>
        </div>
      </section>

      <div className="qbms-groups">
        {visibleGroups.length ? (
          visibleGroups.map((group) => (
            <section className="qbms-module-group" key={group.titleKey}>
              <div className="qbms-group-heading">
                <div>
                  <h3>{t(group.titleKey)}</h3>
                  <p>{t(group.descriptionKey)}</p>
                </div>
                <span>{t("common.items", { count: group.cards.length })}</span>
              </div>

              <div className="qbms-module-grid">
                {group.cards.map((card) => (
                  <Link className="qbms-module-card" href={card.href} key={card.titleKey}>
                    <span className="qbms-module-icon">
                      <QBMSIcon name={card.icon} size={22} />
                    </span>
                    <span className="qbms-module-copy">
                      <span className="qbms-module-title-row">
                        <strong>{t(card.titleKey)}</strong>
                        {card.tagKey && <span className="qbms-module-tag">{t(card.tagKey)}</span>}
                        {card.status === "hold" && <span className="qbms-hold-tag">{t("modules.tag.hold")}</span>}
                      </span>
                      <span className="qbms-module-description">{t(card.descriptionKey)}</span>
                    </span>
                    <span className="qbms-card-arrow">
                      <QBMSIcon name="chevron" size={18} />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))
        ) : (
          <section className="qbms-placeholder">
            <span className="qbms-placeholder-icon">
              <QBMSIcon name="search" size={28} />
            </span>
            <h3>{t("common.noResults")}</h3>
            <p>{t("modules.noResultsBody")}</p>
          </section>
        )}
      </div>
    </QBMSAppShell>
  );
}
