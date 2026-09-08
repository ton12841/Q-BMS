"use client";

import { useParams, useRouter } from "next/navigation";
import QBMSAppShell, {
  QBMSIcon,
  type QBMSIconName,
} from "@/components/layout/QBMSAppShell";
import { useI18n } from "@/i18n/useQBMSI18n";
import { getQaModule } from "./qaModuleRegistry";
import styles from "./ModuleLandingPage.module.css";

export default function ModuleLandingPageClient() {
  const params = useParams<{ moduleKey: string }>();
  const router = useRouter();
  const { locale } = useI18n();
  const config = getQaModule(String(params?.moduleKey || ""));

  const c =
    locale === "th"
      ? {
          planned: "Real Data Workspace",
          description:
            "Module นี้ยังอยู่ระหว่างการพัฒนา Real Data สามารถเปิด QA Data Mode เพื่อดูหน้าตา Populated UI ได้ก่อน",
          qa: "เปิด QA Data Mode",
          back: "กลับ Modules & Tools",
          status: "Implementation Status",
          architecture: "อยู่ใน Q BMS Architecture แล้ว",
          noModule: "ไม่พบ Module",
        }
      : locale === "lo"
        ? {
            planned: "Real Data Workspace",
            description:
              "Module ນີ້ຍັງຢູ່ໃນການພັດທະນາ Real Data. ສາມາດເປີດ QA Data Mode ເພື່ອເບິ່ງ Populated UI ໄດ້ກ່ອນ",
            qa: "ເປີດ QA Data Mode",
            back: "ກັບ Modules & Tools",
            status: "Implementation Status",
            architecture: "ຢູ່ໃນ Q BMS Architecture ແລ້ວ",
            noModule: "ບໍ່ພົບ Module",
          }
        : {
            planned: "Real Data Workspace",
            description:
              "This module is not fully implemented for real data yet. Open QA Data Mode to preview the populated UI.",
            qa: "Open QA Data Mode",
            back: "Back to Modules & Tools",
            status: "Implementation Status",
            architecture: "Registered in Q BMS Architecture",
            noModule: "Module not found",
          };

  if (!config) {
    return (
      <QBMSAppShell pageTitle={c.noModule} pageDescription="">
        <div className={styles.empty}>{c.noModule}</div>
      </QBMSAppShell>
    );
  }

  return (
    <QBMSAppShell
      pageTitle={config.canonicalName}
      pageDescription={config.summary}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <span className={styles.icon}>
            <QBMSIcon name={config.icon as QBMSIconName} size={28} />
          </span>
          <div>
            <span className={styles.eyebrow}>{c.planned}</span>
            <h2>{config.canonicalName}</h2>
            <p>{c.description}</p>
          </div>
          <span className={styles.status}>
            {c.status}: {config.status}
          </span>
        </section>

        <section className={styles.architecture}>
          <QBMSIcon name="check" size={18} />
          <div>
            <strong>{c.architecture}</strong>
            <p>{config.summary}</p>
          </div>
        </section>

        <section className={styles.actions}>
          <button
            className={styles.primary}
            type="button"
            onClick={() => router.push(`/qa-data/${config.key}`)}
          >
            <QBMSIcon name="sparkle" size={16} />
            {c.qa}
          </button>
          <button type="button" onClick={() => router.push("/")}>
            {c.back}
          </button>
        </section>
      </div>
    </QBMSAppShell>
  );
}
