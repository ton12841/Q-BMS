"use client";

import Link from "next/link";
import {useCallback, useEffect, useMemo, useState} from "react";
import QBMSAppShell, {QBMSIcon} from "@/components/layout/QBMSAppShell";
import {useI18n} from "@/i18n/useQBMSI18n";
import {fetchAuthSession} from "@/modules/auth/api/auth.api";
import {
  createBusinessUnit,
  deleteBusinessUnit,
  fetchBusinessUnits,
  updateBusinessUnit,
  type BusinessUnit,
  type BusinessUnitWritePayload,
} from "@/modules/organization/api/organization.api";
import styles from "./BusinessUnitsManagement.module.css";

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(
    locale === "th" ? "th-TH" : locale === "lo" ? "lo-LA" : "en-GB",
    {day: "2-digit", month: "short", year: "numeric"}
  ).format(date);
}

type Editor = {mode: "create" | "edit"; row?: BusinessUnit} | null;

export default function BusinessUnitsPageClient() {
  const {locale, t} = useI18n();
  const [rows, setRows] = useState<BusinessUnit[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const [message, setMessage] = useState<{tone:"ok"|"error"; text:string} | null>(null);

  const c = locale === "th"
    ? {
        add:"เพิ่ม Business Unit", edit:"แก้ไข", delete:"ลบ", actions:"Actions",
        managed:"HR จัดการได้", viewOnly:"ดูอย่างเดียว",
        createTitle:"สร้าง Business Unit", editTitle:"แก้ไข Business Unit",
        code:"Code", name:"ชื่อ", description:"รายละเอียด", status:"สถานะ", order:"ลำดับ",
        cancel:"ยกเลิก", save:"บันทึก", saving:"กำลังบันทึก...",
        saved:"บันทึก Business Unit เรียบร้อยแล้ว", deleted:"ลบ Business Unit เรียบร้อยแล้ว",
        confirm:"ลบ Business Unit นี้ถาวรหรือไม่? ระบบจะอนุญาตเฉพาะรายการที่ยังไม่เคยถูกใช้งาน",
        hint:"Business Unit ที่ถูกใช้งานแล้วจะลบไม่ได้ ให้เปลี่ยน Status เป็น INACTIVE แทน",
      }
    : locale === "lo"
      ? {
          add:"ເພີ່ມ Business Unit", edit:"ແກ້ໄຂ", delete:"ລຶບ", actions:"Actions",
          managed:"HR ຈັດການໄດ້", viewOnly:"ເບິ່ງຢ່າງດຽວ",
          createTitle:"ສ້າງ Business Unit", editTitle:"ແກ້ໄຂ Business Unit",
          code:"Code", name:"ຊື່", description:"ລາຍລະອຽດ", status:"ສະຖານະ", order:"ລຳດັບ",
          cancel:"ຍົກເລີກ", save:"ບັນທຶກ", saving:"ກຳລັງບັນທຶກ...",
          saved:"ບັນທຶກ Business Unit ສຳເລັດ", deleted:"ລຶບ Business Unit ສຳເລັດ",
          confirm:"ລຶບ Business Unit ນີ້ຖາວອນບໍ? ລະບົບອະນຸຍາດສະເພາະລາຍການທີ່ຍັງບໍ່ເຄີຍຖືກໃຊ້",
          hint:"Business Unit ທີ່ຖືກໃຊ້ແລ້ວຈະລຶບບໍ່ໄດ້; ໃຫ້ປ່ຽນ Status ເປັນ INACTIVE",
        }
      : {
          add:"Add Business Unit", edit:"Edit", delete:"Delete", actions:"Actions",
          managed:"HR managed", viewOnly:"View only",
          createTitle:"Create Business Unit", editTitle:"Edit Business Unit",
          code:"Code", name:"Name", description:"Description", status:"Status", order:"Order",
          cancel:"Cancel", save:"Save", saving:"Saving...",
          saved:"Business Unit saved successfully.", deleted:"Business Unit deleted successfully.",
          confirm:"Permanently delete this Business Unit? Deletion is allowed only when it has never been used.",
          hint:"Used Business Units cannot be deleted. Change Status to INACTIVE instead.",
        };

  const load = useCallback(async (refresh=false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setMessage(null);
    try {
      setRows(await fetchBusinessUnits(locale));
    } catch (error) {
      setMessage({tone:"error", text:error instanceof Error ? error.message : t("businessUnit.errorTitle")});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locale, t]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([fetchBusinessUnits(locale, controller.signal), fetchAuthSession(controller.signal)])
      .then(([data, session]) => {
        setRows(data);
        setCanManage(
          session.sessionKind === "DEVELOPMENT_PREVIEW" ||
          session.isSuperAdmin ||
          session.permissions.includes("organization.master.manage")
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setMessage({tone:"error", text:error instanceof Error ? error.message : t("businessUnit.errorTitle")});
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [locale, t]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.code,row.name,row.description,row.status].filter(Boolean).join(" ").toLowerCase().includes(needle)
    );
  }, [query, rows]);

  async function save(payload: BusinessUnitWritePayload) {
    setSaving(true);
    setMessage(null);
    try {
      if (editor?.mode === "edit" && editor.row) {
        await updateBusinessUnit(editor.row.id, payload);
      } else {
        await createBusinessUnit(payload);
      }
      setEditor(null);
      await load();
      setMessage({tone:"ok", text:c.saved});
    } catch (error) {
      setMessage({tone:"error", text:error instanceof Error ? error.message : "Unable to save Business Unit."});
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: BusinessUnit) {
    if (!window.confirm(c.confirm)) return;
    setDeletingId(row.id);
    setMessage(null);
    try {
      await deleteBusinessUnit(row.id);
      await load();
      setMessage({tone:"ok", text:c.deleted});
    } catch (error) {
      setMessage({tone:"error", text:error instanceof Error ? error.message : "Unable to delete Business Unit."});
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = rows.filter((r)=>r.status==="ACTIVE").length;

  return <QBMSAppShell
    pageTitle={t("businessUnit.pageTitle")}
    pageDescription={t("businessUnit.pageDescription")}
    searchValue={query}
    onSearchChange={setQuery}
    searchPlaceholder={t("businessUnit.searchPlaceholder")}
  >
    <div className="qbms-breadcrumb">
      <Link href="/">{t("shell.modulesTools")}</Link><span>›</span>
      <Link href="/organization">{t("organization.pageTitle")}</Link><span>›</span>
      <strong>{t("businessUnit.pageTitle")}</strong>
    </div>

    <section className="qbms-master-header">
      <div>
        <div className="qbms-eyebrow">ORGANIZATION / MASTER DATA</div>
        <h2>{t("businessUnit.pageTitle")}</h2>
        <p>{t("businessUnit.heroDescription")}</p>
      </div>
      <div className="qbms-master-header-actions">
        <span className={canManage ? styles.manageBadge : "qbms-readonly-badge"}>
          {canManage ? c.managed : c.viewOnly}
        </span>
        <button className="qbms-secondary-button" type="button" onClick={()=>load(true)} disabled={refreshing}>
          <QBMSIcon name="refresh" size={16}/>
          {refreshing ? t("common.refreshing") : t("common.refresh")}
        </button>
        {canManage ? <button className={styles.primary} type="button" onClick={()=>setEditor({mode:"create"})}>
          <QBMSIcon name="plus" size={16}/>{c.add}
        </button> : null}
      </div>
    </section>

    {message ? <div className={message.tone==="ok" ? styles.success : styles.error}>{message.text}</div> : null}

    <section className="qbms-master-stats">
      <div className="qbms-stat-card"><span>{t("businessUnit.total")}</span><strong>{rows.length}</strong><small>{t("businessUnit.master")}</small></div>
      <div className="qbms-stat-card"><span>{t("common.active")}</span><strong>{activeCount}</strong><small>{t("businessUnit.availableForUse")}</small></div>
      <div className="qbms-stat-card"><span>{t("common.inactive")}</span><strong>{rows.length-activeCount}</strong><small>{t("businessUnit.notSelectable")}</small></div>
    </section>

    <section className="qbms-master-panel">
      <div className="qbms-master-panel-heading">
        <div><h3>{t("businessUnit.masterTitle")}</h3><p>{t("businessUnit.masterDescription")}</p></div>
        <span>{t("businessUnit.count",{shown:filtered.length,total:rows.length})}</span>
      </div>

      {loading ? <div className="qbms-loading-state"><span className="qbms-loading-spinner"/><strong>{t("businessUnit.loadingTitle")}</strong><p>{t("businessUnit.loadingBody")}</p></div>
      : <div className="qbms-table-wrap">
        <table className="qbms-master-table">
          <thead><tr>
            <th>{t("businessUnit.pageTitle")}</th><th>{t("common.code")}</th><th>{t("common.description")}</th>
            <th>{t("common.status")}</th><th>{t("common.order")}</th><th>{t("common.updated")}</th>
            {canManage ? <th>{c.actions}</th> : null}
          </tr></thead>
          <tbody>
            {filtered.length ? filtered.map((row)=><tr key={row.id}>
              <td><div className="qbms-business-unit-cell"><span className="qbms-business-unit-mark">{row.name.slice(0,1).toUpperCase()}</span><div><strong>{row.name}</strong><small>{t("businessUnit.entityLabel")}</small></div></div></td>
              <td><span className="qbms-code-chip">{row.code}</span></td>
              <td className="qbms-description-cell">{row.description || "-"}</td>
              <td><span className={`qbms-status-pill ${row.status==="ACTIVE"?"active":"inactive"}`}><span/>{row.status==="ACTIVE"?t("common.active"):t("common.inactive")}</span></td>
              <td>{row.sort_order}</td><td>{formatDate(row.updated_at,locale)}</td>
              {canManage ? <td><div className={styles.actions}>
                <button type="button" onClick={()=>setEditor({mode:"edit",row})}>{c.edit}</button>
                <button type="button" className={styles.delete} disabled={deletingId===row.id} onClick={()=>remove(row)}>{deletingId===row.id?"...":c.delete}</button>
              </div></td> : null}
            </tr>) : <tr><td colSpan={canManage?7:6}><div className="qbms-empty-table"><QBMSIcon name="search" size={22}/><strong>{t("businessUnit.emptyTitle")}</strong><span>{t("businessUnit.emptyBody")}</span></div></td></tr>}
          </tbody>
        </table>
      </div>}
    </section>

    {canManage ? <div className={styles.hint}><QBMSIcon name="info" size={14}/>{c.hint}</div> : null}

    <div className="qbms-page-footer-action"><Link href="/organization" className="qbms-back-link"><QBMSIcon name="arrowLeft" size={16}/>{t("businessUnit.back")}</Link></div>

    {editor ? <BusinessUnitEditor row={editor.row} saving={saving} labels={c} onClose={()=>setEditor(null)} onSave={save}/> : null}
  </QBMSAppShell>;
}

function BusinessUnitEditor({
  row,saving,labels,onClose,onSave,
}:{
  row?:BusinessUnit;
  saving:boolean;
  labels:{createTitle:string;editTitle:string;code:string;name:string;description:string;status:string;order:string;cancel:string;save:string;saving:string};
  onClose:()=>void;
  onSave:(payload:BusinessUnitWritePayload)=>Promise<void>;
}) {
  return <div className={styles.backdrop} onMouseDown={onClose}>
    <div className={styles.modal} onMouseDown={(event)=>event.stopPropagation()}>
      <header><div><span>REAL DATA · ORGANIZATION MASTER</span><h3>{row?labels.editTitle:labels.createTitle}</h3></div><button type="button" onClick={onClose}>×</button></header>
      <form onSubmit={(event)=>{
        event.preventDefault();
        const fd=new FormData(event.currentTarget);
        void onSave({
          code:String(fd.get("code")||"").trim().toUpperCase(),
          name:String(fd.get("name")||"").trim(),
          description:String(fd.get("description")||"").trim(),
          status:String(fd.get("status")||"ACTIVE") as "ACTIVE"|"INACTIVE",
          sort_order:Number(fd.get("sort_order")||0),
        });
      }}>
        <label>{labels.code}<input name="code" defaultValue={row?.code||""} maxLength={50} required/></label>
        <label>{labels.name}<input name="name" defaultValue={row?.name||""} maxLength={150} required/></label>
        <label className={styles.full}>{labels.description}<textarea name="description" defaultValue={row?.description||""} rows={3}/></label>
        <label>{labels.status}<select name="status" defaultValue={row?.status||"ACTIVE"}><option>ACTIVE</option><option>INACTIVE</option></select></label>
        <label>{labels.order}<input name="sort_order" type="number" min={0} defaultValue={row?.sort_order??0}/></label>
        <footer><button type="button" onClick={onClose} disabled={saving}>{labels.cancel}</button><button className={styles.primary} type="submit" disabled={saving}>{saving?labels.saving:labels.save}</button></footer>
      </form>
    </div>
  </div>;
}
