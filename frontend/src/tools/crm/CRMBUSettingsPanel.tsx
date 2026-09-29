"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  fetchCRMBUSettings,
  saveCRMBUGeneralSetting,
  saveCRMBUMemberSetting,
  saveCRMCommissionSetting,
  saveCRMPipelineSetting,
  saveCRMPointSetting,
  saveCRMProductMasterSetting,
  saveCRMSalesTargetSetting,
  saveCRMSalesTeamSetting,
} from "./api/crm.api";
import type {
  CRMAccessProfile,
  CRMBUSettingsSnapshot,
  CRMCommissionPlanSetting,
  CRMCommissionTier,
  CRMPipelineStageSetting,
  CRMPointRule,
  CRMProductOption,
} from "./crm.types";
import styles from "./CRMBUSettingsPanel.module.css";

type SettingsTab = "general" | "products" | "members" | "teams" | "roles" | "pipeline" | "points" | "target" | "commission";
type ScopeType = "BU" | "TEAM" | "USER";

const TABS: Array<[SettingsTab, string]> = [
  ["general", "General"], ["products", "Product Master"], ["members", "Members"], ["teams", "Sales Teams"], ["roles", "Roles & Access"],
  ["pipeline", "Pipeline"], ["points", "Point Settings"], ["target", "Sales Target"], ["commission", "Commission Settings"],
];

function num(value: FormDataEntryValue | null) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function today() { return new Date().toISOString().slice(0, 10); }
function fmt(value: number) { return new Intl.NumberFormat("en-US").format(value || 0); }

function emptyCommissionTiers(): CRMCommissionTier[] {
  return [
    { tierCode: "BASE", name: "Base", minSWPoints: 0, maxSWPoints: 29, lakPerSWPoint: 0, position: 1 },
    { tierCode: "TIER_1", name: "Tier 1", minSWPoints: 30, maxSWPoints: 35, lakPerSWPoint: 0, position: 2 },
    { tierCode: "TIER_2", name: "Tier 2", minSWPoints: 36, maxSWPoints: 44, lakPerSWPoint: 0, position: 3 },
    { tierCode: "TIER_3", name: "Tier 3", minSWPoints: 45, maxSWPoints: 59, lakPerSWPoint: 0, position: 4 },
    { tierCode: "TIER_4", name: "Tier 4", minSWPoints: 60, maxSWPoints: null, lakPerSWPoint: 0, position: 5 },
  ];
}

function scopeLabel(plan: CRMCommissionPlanSetting) {
  if (plan.scopeType === "USER") return `Individual · ${plan.ownerName || plan.ownerUserId || "—"}`;
  if (plan.scopeType === "TEAM") return `Team · ${plan.teamName || plan.teamId || "—"}`;
  return "BU Default";
}

export default function CRMBUSettingsPanel({ businessUnit, period, access }: { businessUnit: string; period: string; access: CRMAccessProfile }) {
  const [tab, setTab] = useState<SettingsTab>("general");
  const [data, setData] = useState<CRMBUSettingsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pointRules, setPointRules] = useState<CRMPointRule[]>([]);
  const [pointProductSearch, setPointProductSearch] = useState("");
  const [pointProductCode, setPointProductCode] = useState("");
  const [pipelineStages, setPipelineStages] = useState<CRMPipelineStageSetting[]>([]);
const [productSearch, setProductSearch] = useState("");
const [editingProductId, setEditingProductId] = useState("");
const [productName, setProductName] = useState("");
const [productType, setProductType] = useState<"SOFTWARE" | "HARDWARE">("SOFTWARE");
const [productCategory, setProductCategory] = useState("");
const [productUnit, setProductUnit] = useState("License / Year");
const [productInventoryManaged, setProductInventoryManaged] = useState(false);
const [productPrice, setProductPrice] = useState(0);
const [productCurrency, setProductCurrency] = useState<"LAK" | "THB" | "USD">("LAK");
const [productStatus, setProductStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
const [productDescription, setProductDescription] = useState("");

  const [memberUserId, setMemberUserId] = useState("");
  const [memberStatus, setMemberStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [memberEffectiveFrom, setMemberEffectiveFrom] = useState(today());
  const [memberEffectiveTo, setMemberEffectiveTo] = useState("");
  const [memberRoleCodes, setMemberRoleCodes] = useState<string[]>([]);
  const [memberTeamIds, setMemberTeamIds] = useState<string[]>([]);

  const [editingTeamId, setEditingTeamId] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamManagerId, setTeamManagerId] = useState("");
  const [teamStatus, setTeamStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [targetScope, setTargetScope] = useState<ScopeType>("BU");
  const [targetScopeRef, setTargetScopeRef] = useState("");

  const [commissionScope, setCommissionScope] = useState<ScopeType>("BU");
  const [commissionScopeRef, setCommissionScopeRef] = useState("");
  const [commissionTiers, setCommissionTiers] = useState<CRMCommissionTier[]>(emptyCommissionTiers());

  const membership = access.memberships.find((item) => item.businessUnit === businessUnit);
  const capabilities = useMemo(() => new Set(membership?.roles.flatMap((role) => role.capabilities) || []), [membership]);
  const can = (capability: string) => access.isSuperAdmin || capabilities.has("settings.manage") || capabilities.has(capability);
  const canManageProducts = can("product.manage") || can("points.manage");

  const activeMembers = useMemo(() => {
    if (!data) return [];
    const activeIds = new Set(data.members.filter((member) => member.status === "ACTIVE").map((member) => member.userId));
    return data.users.filter((user) => activeIds.has(user.id));
  }, [data]);

  const availablePointProducts = useMemo(() => {
    if (!data) return [];
    const configured = new Set(pointRules.map((rule) => rule.productCode));
    const query = pointProductSearch.trim().toLowerCase();
    return data.productOptions.filter((product) => {
      if (product.status !== "ACTIVE" || configured.has(product.productCode)) return false;
      if (!query) return true;
      return [product.productCode, product.productName, product.pointType, product.unitLabel || ""]
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [data, pointRules, pointProductSearch]);

const filteredProducts = useMemo(() => {
  if (!data) return [];
  const q = productSearch.trim().toLowerCase();
  if (!q) return data.productOptions;
  return data.productOptions.filter((product) =>
    [product.productCode, product.productName, product.category || "", product.pointType, product.unitLabel || ""]
      .some((value) => value.toLowerCase().includes(q))
  );
}, [data, productSearch]);


  const selectedPointProduct = useMemo(
    () => data?.productOptions.find((product) => product.productCode === pointProductCode) || null,
    [data, pointProductCode]
  );

  const selectedTarget = useMemo(() => {
    if (!data) return null;
    return data.targets.find((target) => {
      if (targetScope === "TEAM") return target.teamId === targetScopeRef;
      if (targetScope === "USER") return target.ownerUserId === targetScopeRef;
      return !target.teamId && !target.ownerUserId;
    }) || null;
  }, [data, targetScope, targetScopeRef]);

  const selectedCommissionPlan = useMemo(() => {
    if (!data) return null;
    return data.commissionPlans.find((plan) => {
      if (plan.scopeType !== commissionScope) return false;
      if (commissionScope === "TEAM") return plan.teamId === commissionScopeRef;
      if (commissionScope === "USER") return plan.ownerUserId === commissionScopeRef;
      return true;
    }) || null;
  }, [data, commissionScope, commissionScopeRef]);

  const commissionTemplate = useMemo(() => {
    if (!data) return null;
    return selectedCommissionPlan || data.commissionPlans.find((plan) => plan.scopeType === "BU") || data.commissionPlans[0] || null;
  }, [data, selectedCommissionPlan]);

  async function load() {
    if (!businessUnit || businessUnit === "ALL") return;
    setLoading(true); setError("");
    try {
      const snapshot = await fetchCRMBUSettings(businessUnit, period);
      setData(snapshot);
      setPointRules(snapshot.pointRules.map((x) => ({ ...x })));
      setPointProductCode("");
      setPointProductSearch("");
      setPipelineStages(snapshot.pipelineStages.map((x) => ({ ...x })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot load CRM BU Settings.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [businessUnit, period]);

  useEffect(() => {
    const tiers = commissionTemplate?.tiers?.length ? commissionTemplate.tiers : emptyCommissionTiers();
    setCommissionTiers(tiers.map((tier) => ({ ...tier, id: selectedCommissionPlan ? tier.id : undefined })));
  }, [commissionTemplate, selectedCommissionPlan, commissionScope, commissionScopeRef, period]);

  async function runSave(action: () => Promise<unknown>, ok: string) {
    setSaving(true); setError(""); setMessage("");
    try { await action(); setMessage(ok); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Save failed."); }
    finally { setSaving(false); }
  }

  function removePointRule(productCode: string) {
    if (locked) return;
    setPointRules((rows) => rows.filter((row) => row.productCode !== productCode));
  }

  function addSelectedPointProduct() {
    if (!selectedPointProduct || locked) return;
    setPointRules((rows) => [
      ...rows,
      {
        id: "",
        productCode: selectedPointProduct.productCode,
        productName: selectedPointProduct.productName,
        pointType: selectedPointProduct.pointType,
        unitLabel: selectedPointProduct.unitLabel,
        pointsPerUnit: 0,
        locked: false,
      },
    ]);
    setPointProductCode("");
    setPointProductSearch("");
  }

function clearProductForm() {
  setEditingProductId("");
  setProductName("");
  setProductType("SOFTWARE");
  setProductCategory("");
  setProductUnit("License / Year");
  setProductInventoryManaged(false);
  setProductPrice(0);
  setProductCurrency("LAK");
  setProductStatus("ACTIVE");
  setProductDescription("");
}

function editProduct(product: CRMProductOption) {
  setEditingProductId(product.id || product.productCode);
  setProductName(product.productName);
  setProductType(product.pointType);
  setProductCategory(product.category || "");
  setProductUnit(product.unitLabel || (product.pointType === "SOFTWARE" ? "License / Year" : "Unit"));
  setProductInventoryManaged(Boolean(product.inventoryManaged));
  setProductPrice(Number(product.defaultUnitPrice || 0));
  setProductCurrency((product.currency || "LAK") as "LAK" | "THB" | "USD");
  setProductStatus(product.status);
  setProductDescription(product.description || "");
}

function submitProduct(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();
  void runSave(() => saveCRMProductMasterSetting(businessUnit, {
    productId: editingProductId || undefined,
    productName,
    productType,
    category: productCategory || undefined,
    unitLabel: productUnit || undefined,
    inventoryManaged: productType === "HARDWARE" && productInventoryManaged,
    defaultUnitPrice: productPrice,
    currency: productCurrency,
    status: productStatus,
    description: productDescription || undefined,
  }), editingProductId ? "Product Master updated." : "Product created in Product Master.").then(() => clearProductForm());
}

  function selectMember(userId: string) {
    setMemberUserId(userId);
    const existing = data?.members.find((member) => member.userId === userId);
    setMemberStatus(existing?.status || "ACTIVE");
    setMemberEffectiveFrom(existing?.effectiveFrom?.slice(0, 10) || today());
    setMemberEffectiveTo(existing?.effectiveTo?.slice(0, 10) || "");
    setMemberRoleCodes(existing?.roleCodes || []);
    setMemberTeamIds(existing?.teamIds || []);
  }

  function editTeam(teamId: string) {
    const team = data?.teams.find((item) => item.id === teamId);
    if (!team) return;
    setEditingTeamId(team.id);
    setTeamCode(team.teamCode);
    setTeamName(team.name);
    setTeamManagerId(team.managerUserId || "");
    setTeamStatus(team.status);
  }

  function clearTeam() {
    setEditingTeamId(""); setTeamCode(""); setTeamName(""); setTeamManagerId(""); setTeamStatus("ACTIVE");
  }

  if (businessUnit === "ALL") return <div className={styles.notice}>Select one Business Unit to open CRM BU Settings.</div>;
  if (loading) return <div className={styles.notice}>Loading CRM BU Settings…</div>;
  if (!data) return <div className={styles.notice}>{error || "CRM BU Settings unavailable."}</div>;

  const locked = data.periodLocked;

  function submitGeneral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fd = new FormData(event.currentTarget);
    void runSave(() => saveCRMBUGeneralSetting(businessUnit, {
      currency: String(fd.get("currency") || "LAK"), timezone: String(fd.get("timezone") || "Asia/Vientiane"),
      defaultSWPointTarget: num(fd.get("defaultSWPointTarget")), period,
    }), "CRM BU General Settings saved.");
  }

  function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSave(() => saveCRMBUMemberSetting(businessUnit, {
      userId: memberUserId, status: memberStatus, effectiveFrom: memberEffectiveFrom,
      effectiveTo: memberEffectiveTo || undefined, roleCodes: memberRoleCodes, teamIds: memberTeamIds,
    }), "CRM Member access saved.");
  }

  function submitTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSave(() => saveCRMSalesTeamSetting(businessUnit, {
      teamId: editingTeamId || undefined, teamCode, name: teamName, managerUserId: teamManagerId || undefined, status: teamStatus,
    }), editingTeamId ? "Sales Team updated." : "Sales Team created.");
  }

  function submitTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fd = new FormData(event.currentTarget);
    void runSave(() => saveCRMSalesTargetSetting(businessUnit, {
      period,
      ownerUserId: targetScope === "USER" ? targetScopeRef : undefined,
      teamId: targetScope === "TEAM" ? targetScopeRef : undefined,
      targetSWPoints: num(fd.get("targetSWPoints")), targetRevenue: num(fd.get("targetRevenue")),
      currency: String(fd.get("currency") || data?.general.currency || "LAK"),
    }), "Sales Target saved.");
  }

  function submitCommission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fd = new FormData(event.currentTarget);
    const tiers = commissionTiers.map((tier, index) => ({
      ...tier, position: index + 1,
      minSWPoints: num(fd.get(`tierMin:${index}`)),
      maxSWPoints: String(fd.get(`tierMax:${index}`) || "").trim() === "" ? null : num(fd.get(`tierMax:${index}`)),
      lakPerSWPoint: num(fd.get(`tierRate:${index}`)),
    }));
    void runSave(() => saveCRMCommissionSetting(businessUnit, {
      period, scopeType: commissionScope,
      teamId: commissionScope === "TEAM" ? commissionScopeRef : undefined,
      ownerUserId: commissionScope === "USER" ? commissionScopeRef : undefined,
      name: String(fd.get("planName") || "Standard Commission"),
      hardwareLAKPerPoint: num(fd.get("hardwareRate")),
      status: String(fd.get("planStatus") || "OPEN") as "OPEN" | "LOCKED" | "INACTIVE",
      ruleSource: String(fd.get("ruleSource") || "") || undefined, tiers,
    }), "Commission Settings saved.");
  }

  const commissionFormKey = `${period}:${commissionScope}:${commissionScopeRef}:${selectedCommissionPlan?.id || "new"}`;
  const planDefaults = selectedCommissionPlan || commissionTemplate;

  return <section className={styles.root}>
    <header className={styles.header}>
      <div><span>CRM BU SETTINGS</span><h3>{data.businessUnit.code} · {data.businessUnit.name}</h3><p>CRM owns Tool roles, BU membership, teams and commercial settings. BMS Core remains the owner of Employee identity and future Tool Access approval/provisioning.</p></div>
      <div className={styles.badges}><b>{period}</b><span>{locked ? "LOCKED" : "OPEN"}</span></div>
    </header>
    <nav className={styles.tabs}>{TABS.map(([key,label]) => <button type="button" key={key} className={tab === key ? styles.active : ""} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {message && <div className={styles.success}>{message}</div>}{error && <div className={styles.error}>{error}</div>}

    {tab === "general" && <form className={styles.card} onSubmit={submitGeneral}>
      <div className={styles.title}><div><h4>General</h4><p>Default operating context for this CRM Business Unit.</p></div></div>
      <div className={styles.grid3}>
        <label>Currency<select name="currency" defaultValue={data.general.currency}><option>LAK</option><option>THB</option><option>USD</option></select></label>
        <label>Timezone<input name="timezone" defaultValue={data.general.timezone} /></label>
        <label>Default SW Point Target<input name="defaultSWPointTarget" type="number" min="0" step="1" defaultValue={data.general.defaultSWPointTarget} /></label>
      </div>
      <div className={styles.actions}><button disabled={saving || !can("settings.manage")}>Save General Settings</button></div>
    </form>}

{tab === "products" && <div className={styles.stack}>
  <div className={styles.notice}><b>Shared Product Master</b><br />This is the source of truth used by CRM Product Selectors, Point Settings and Deal Product Lines. Inactive products stay in history but cannot be added to new Deals or Point Rules.</div>
  <form className={styles.card} onSubmit={submitProduct}>
    <div className={styles.title}><div><h4>{editingProductId ? "Edit Product" : "+ Create Product"}</h4><p>Product Code is generated automatically and remains stable. Product name, type, unit and default price can be maintained here.</p></div>{editingProductId && <button type="button" className={styles.tableButton} onClick={clearProductForm}>New Product</button>}</div>
    <div className={styles.grid3}>
      <label>Product Code<input disabled value={editingProductId ? (data.productOptions.find((p) => p.id === editingProductId || p.productCode === editingProductId)?.productCode || editingProductId) : "Auto: PRD-xxxx"} /></label>
      <label>Product Name<input required value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Kitchen Display System" /></label>
      <label>Product Type<select value={productType} onChange={(e) => { const type = e.target.value as "SOFTWARE" | "HARDWARE"; setProductType(type); setProductUnit(type === "SOFTWARE" ? "License / Year" : "Unit"); if (type === "SOFTWARE") setProductInventoryManaged(false); }}><option value="SOFTWARE">Software</option><option value="HARDWARE">Hardware</option></select></label>
      <label>Category<input value={productCategory} onChange={(e) => setProductCategory(e.target.value)} placeholder="POS Software / POS Hardware / Peripheral" /></label>
      <label>Unit<input value={productUnit} onChange={(e) => setProductUnit(e.target.value)} placeholder="License / Year / Unit" /></label>
      <label>Default Price<input type="number" min="0" value={productPrice} onChange={(e) => setProductPrice(Number(e.target.value || 0))} /></label>
      <label>Currency<select value={productCurrency} onChange={(e) => setProductCurrency(e.target.value as "LAK" | "THB" | "USD")}><option>LAK</option><option>THB</option><option>USD</option></select></label>
      <label>Status<select value={productStatus} onChange={(e) => setProductStatus(e.target.value as "ACTIVE" | "INACTIVE")}><option>ACTIVE</option><option>INACTIVE</option></select></label>
      <label>Inventory Managed<select disabled={productType !== "HARDWARE"} value={productType === "HARDWARE" && productInventoryManaged ? "YES" : "NO"} onChange={(e) => setProductInventoryManaged(e.target.value === "YES")}><option value="NO">No</option><option value="YES">Yes</option></select></label>
    </div>
    <label>Description<textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} rows={3} placeholder="Optional product note / specification" /></label>
    <div className={styles.actions}><button disabled={saving || !productName.trim() || !canManageProducts}>{editingProductId ? "Save Product" : "Create Product"}</button></div>
  </form>
  <div className={styles.card}>
    <div className={styles.title}><div><h4>Products</h4><p>Search, edit or deactivate products available to {businessUnit}. Deactivate instead of deleting so Deal / Point / Commission history remains intact.</p></div><b>{filteredProducts.length} product(s)</b></div>
    <div className={styles.grid3}><label>Search Product<input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search code / name / category" /></label></div>
    <div className={styles.tableWrap}><table><thead><tr><th>Code</th><th>Product</th><th>Type</th><th>Category</th><th>Unit</th><th>Default Price</th><th>Inventory</th><th>Status</th><th>Action</th></tr></thead><tbody>
      {filteredProducts.length ? filteredProducts.map((product) => <tr key={product.id || product.productCode}><td><b>{product.productCode}</b></td><td><b>{product.productName}</b><small>{product.description || "—"}</small></td><td>{product.pointType}</td><td>{product.category || "—"}</td><td>{product.unitLabel || "—"}</td><td>{fmt(Number(product.defaultUnitPrice || 0))} {product.currency || "LAK"}</td><td>{product.inventoryManaged ? "YES" : "NO"}</td><td>{product.status}</td><td><button type="button" className={styles.tableButton} disabled={!canManageProducts} onClick={() => editProduct(product)}>Edit</button></td></tr>) : <tr><td colSpan={9}>No Product found.</td></tr>}
    </tbody></table></div>
  </div>
</div>}

    {tab === "members" && <div className={styles.stack}>
      <form className={styles.card} onSubmit={submitMember}>
        <div className={styles.title}><div><h4>CRM Members</h4><p>One employee can belong to multiple CRM BUs and hold multiple CRM Roles. This is Tool membership; it does not edit Employee Master.</p></div></div>
        <div className={styles.grid3}>
          <label>Employee / User<select value={memberUserId} onChange={(event) => selectMember(event.target.value)} required><option value="">Select employee</option>{data.users.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}</select></label>
          <label>Status<select value={memberStatus} onChange={(event) => setMemberStatus(event.target.value as "ACTIVE" | "INACTIVE")}><option>ACTIVE</option><option>INACTIVE</option></select></label>
          <label>Effective From<input type="date" value={memberEffectiveFrom} onChange={(event) => setMemberEffectiveFrom(event.target.value)} /></label>
          <label>Effective To<input type="date" value={memberEffectiveTo} onChange={(event) => setMemberEffectiveTo(event.target.value)} /></label>
        </div>
        <div className={styles.split}>
          <div><b>CRM Roles</b><div className={styles.checks}>{data.roles.map((r) => <label key={r.code}><input type="checkbox" checked={memberRoleCodes.includes(r.code)} onChange={(event) => setMemberRoleCodes((items) => event.target.checked ? [...new Set([...items, r.code])] : items.filter((code) => code !== r.code))} />{r.name}<small>L{r.accessLevel} · {r.dataScope}</small></label>)}</div></div>
          <div><b>Sales Teams</b><div className={styles.checks}>{data.teams.length ? data.teams.map((t) => <label key={t.id}><input type="checkbox" checked={memberTeamIds.includes(t.id)} onChange={(event) => setMemberTeamIds((items) => event.target.checked ? [...new Set([...items, t.id])] : items.filter((id) => id !== t.id))} />{t.name}<small>{t.memberCount} member(s)</small></label>) : <span className={styles.muted}>Create a Sales Team first.</span>}</div></div>
        </div>
        <div className={styles.actions}><button disabled={saving || !memberUserId || !memberRoleCodes.length || !can("members.manage")}>Save Member Access</button></div>
      </form>
      <div className={styles.card}><h4>Current Members</h4><div className={styles.tableWrap}><table><thead><tr><th>Employee</th><th>Roles</th><th>Teams</th><th>Status</th><th>Effective</th><th></th></tr></thead><tbody>{data.members.map((m) => <tr key={m.id}><td><b>{m.name}</b><small>{m.email}</small></td><td>{m.roleCodes.join(", ") || "—"}</td><td>{m.teamIds.map((id) => data.teams.find((t) => t.id === id)?.name || id).join(", ") || "—"}</td><td>{m.status}</td><td>{m.effectiveFrom}{m.effectiveTo ? ` → ${m.effectiveTo}` : ""}</td><td><button type="button" className={styles.tableButton} onClick={() => selectMember(m.userId)}>Edit</button></td></tr>)}</tbody></table></div></div>
    </div>}

    {tab === "teams" && <div className={styles.stack}>
      <form className={styles.card} onSubmit={submitTeam}><div className={styles.title}><div><h4>{editingTeamId ? "Edit Sales Team" : "Sales Teams"}</h4><p>CRM grouping only; this does not create or change HR Departments.</p></div>{editingTeamId && <button type="button" className={styles.linkButton} onClick={clearTeam}>+ New Team</button>}</div>
        <div className={styles.grid3}><label>Team Code<input value={teamCode} onChange={(event) => setTeamCode(event.target.value)} placeholder="DIRECT_SALES" required /></label><label>Team Name<input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Direct Sales" required /></label><label>Manager<select value={teamManagerId} onChange={(event) => setTeamManagerId(event.target.value)}><option value="">No Manager</option>{data.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label>Status<select value={teamStatus} onChange={(event) => setTeamStatus(event.target.value as "ACTIVE" | "INACTIVE")}><option>ACTIVE</option><option>INACTIVE</option></select></label></div>
        <div className={styles.actions}><button disabled={saving || !can("teams.manage")}>{editingTeamId ? "Save Team Changes" : "Add Sales Team"}</button></div></form>
      <div className={styles.cards}>{data.teams.map((t) => <article key={t.id}><b>{t.name}</b><span>{t.teamCode}</span><small>Manager: {t.managerName || "—"} · {t.memberCount} member(s) · {t.status}</small>{can("teams.manage") && <button type="button" className={styles.tableButton} onClick={() => editTeam(t.id)}>Edit</button>}</article>)}</div>
    </div>}

    {tab === "roles" && <div className={styles.stack}><div className={styles.notice}><b>Multi-role + scoped access</b><br />A CRM member can hold more than one role. Effective Tool access is the union of CRM role capabilities inside the assigned CRM BU. Future BMS Tool Access approval remains the outer gate.</div><div className={styles.cards}>{data.roles.map((r) => <article key={r.code}><div className={styles.roleTop}><b>{r.name}</b><span>Level {r.accessLevel} · {r.dataScope}</span></div><p>{r.description}</p><div className={styles.chips}>{r.capabilities.map((x) => <span key={x}>{x}</span>)}</div></article>)}</div></div>}

    {tab === "pipeline" && <div className={styles.card}><div className={styles.title}><div><h4>Pipeline Settings</h4><p>Closed Won stays system-controlled after Finance confirmation + Invoice.</p></div></div><div className={styles.tableWrap}><table><thead><tr><th>#</th><th>Stage</th><th>Label</th><th>Enabled</th><th>Control</th></tr></thead><tbody>{pipelineStages.map((s,i) => <tr key={s.stageCode}><td><input className={styles.smallInput} type="number" value={s.position} onChange={(e) => setPipelineStages((rows) => rows.map((x,j) => j===i ? {...x,position:Number(e.target.value)} : x))} /></td><td><b>{s.stageCode}</b></td><td><input value={s.label} onChange={(e) => setPipelineStages((rows) => rows.map((x,j) => j===i ? {...x,label:e.target.value} : x))} /></td><td><input type="checkbox" checked={s.isEnabled} disabled={s.stageCode === "CLOSED_WON"} onChange={(e) => setPipelineStages((rows) => rows.map((x,j) => j===i ? {...x,isEnabled:e.target.checked} : x))} /></td><td>{s.isSystemControlled ? "System" : "Manual / Workflow"}</td></tr>)}</tbody></table></div><div className={styles.actions}><button disabled={saving || !can("pipeline.manage")} onClick={() => void runSave(() => saveCRMPipelineSetting(businessUnit, pipelineStages), "Pipeline Settings saved.")}>Save Pipeline</button></div></div>}

    {tab === "points" && <div className={styles.stack}>
      <div className={styles.notice}>
        <b>Product Source: Shared Product Master</b><br />
        Product is selected from Product Master — never free text. Hardware items carry the Inventory-managed flag for future Inventory integration.
      </div>
      <div className={styles.card}>
        <div className={styles.title}>
          <div>
            <h4>Point Settings</h4>
            <p>Monthly SW/HW point per selected product. Add or remove products for the selected BU/month. Remove only removes the Point Rule; it never deletes the Product from Product Master.</p>
          </div>
          <b>{data.general.timezone}</b>
        </div>
        {locked && <div className={styles.lock}>Historical period is locked.</div>}
        {!locked && can("points.manage") && <div className={styles.card}>
          <div className={styles.title}><div><h4>+ Add Product Point Rule</h4><p>Select a product from the controlled source. Product name, type and unit are read-only from the source.</p></div></div>
          <div className={styles.grid3}>
            <label>Search Product<input value={pointProductSearch} onChange={(event) => { setPointProductSearch(event.target.value); setPointProductCode(""); }} placeholder="Search name / code / type" /></label>
            <label>Product<select value={pointProductCode} onChange={(event) => setPointProductCode(event.target.value)}>
              <option value="">{availablePointProducts.length ? "Select product" : "No unconfigured product available"}</option>
              {availablePointProducts.map((product) => <option key={product.productCode} value={product.productCode}>
                {product.productName} · {product.productCode} · {product.pointType === "SOFTWARE" ? "SW" : "HW"}
              </option>)}
            </select></label>
            <label>Selected Product<input disabled value={selectedPointProduct ? `${selectedPointProduct.pointType} · ${selectedPointProduct.unitLabel || "—"}${selectedPointProduct.inventoryManaged ? " · Inventory-managed" : ""}` : "Select a product"} /></label>
          </div>
          <div className={styles.actions}><button type="button" disabled={!selectedPointProduct} onClick={addSelectedPointProduct}>Add Product Point Rule</button></div>
        </div>}
        <div className={styles.tableWrap}><table><thead><tr><th>Type</th><th>Product</th><th>Unit</th><th>Point / Unit</th><th>Source</th><th>Action</th></tr></thead><tbody>
          {pointRules.length ? pointRules.map((r,i) => {
            const product = data.productOptions.find((option) => option.productCode === r.productCode);
            return <tr key={r.productCode}><td>{r.pointType}</td><td><b>{r.productName}</b><small>{r.productCode}</small></td><td>{r.unitLabel || "—"}</td><td><input className={styles.pointInput} type="number" min="0" step="1" disabled={locked} value={r.pointsPerUnit} onChange={(e) => setPointRules((rows) => rows.map((x,j) => j===i ? {...x,pointsPerUnit:Number(e.target.value)} : x))} /></td><td>{product?.source === "PRODUCT_MASTER" ? "Product Master" : "Temporary"}{product?.inventoryManaged ? <small>Inventory-ready</small> : null}</td><td>{!locked && can("points.manage") ? <button type="button" className={styles.tableButton} onClick={() => removePointRule(r.productCode)}>Remove</button> : "—"}</td></tr>;
          }) : <tr><td colSpan={6}>No Point Rule configured for this BU/month yet. Add a product from the selector above.</td></tr>}
        </tbody></table></div>
        <div className={styles.actions}><button disabled={saving || locked || !can("points.manage")} onClick={() => void runSave(() => saveCRMPointSetting(businessUnit, period, pointRules), "Point Settings saved.")}>Save Point Settings</button></div>
      </div>
    </div>}

    {tab === "target" && <div className={styles.stack}><form key={`${period}:${targetScope}:${targetScopeRef}:${selectedTarget?.id || "new"}`} className={styles.card} onSubmit={submitTarget}><div className={styles.title}><div><h4>Sales Target</h4><p>Monthly stamped SW Point target. Priority: Individual override → Team → BU Default. Hardware Point is separate.</p></div></div>{locked && <div className={styles.lock}>Historical period is locked.</div>}<div className={styles.grid3}><label>Scope<select value={targetScope} onChange={(event) => { setTargetScope(event.target.value as ScopeType); setTargetScopeRef(""); }}><option value="BU">BU Default</option><option value="TEAM">Sales Team</option><option value="USER">Individual Sales</option></select></label>{targetScope === "TEAM" && <label>Sales Team<select value={targetScopeRef} onChange={(event) => setTargetScopeRef(event.target.value)} required><option value="">Select team</option>{data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}{targetScope === "USER" && <label>Sales Owner<select value={targetScopeRef} onChange={(event) => setTargetScopeRef(event.target.value)} required><option value="">Select CRM member</option>{activeMembers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>}<label>SW Point Target<input name="targetSWPoints" type="number" min="0" step="1" defaultValue={selectedTarget?.targetSWPoints ?? data.general.defaultSWPointTarget} /></label><label>Software Revenue Target<input name="targetRevenue" type="number" min="0" defaultValue={selectedTarget?.targetRevenue ?? 0} /></label><label>Currency<select name="currency" defaultValue={selectedTarget?.currency || data.general.currency}><option>LAK</option><option>THB</option><option>USD</option></select></label></div>{selectedTarget && <div className={styles.formula}>Editing an existing {targetScope.toLowerCase()} target for {period}.</div>}<div className={styles.actions}><button disabled={saving || locked || ((targetScope === "TEAM" || targetScope === "USER") && !targetScopeRef) || !can("targets.manage")}>Save Target</button></div></form><div className={styles.card}><h4>{period} Targets</h4><div className={styles.tableWrap}><table><thead><tr><th>Scope</th><th>SW Point</th><th>Revenue</th><th>Status</th></tr></thead><tbody>{data.targets.map((t) => <tr key={t.id}><td>{t.ownerName ? `Individual · ${t.ownerName}` : t.teamName ? `Team · ${t.teamName}` : "BU Default"}</td><td><b>{t.targetSWPoints}</b></td><td>{fmt(t.targetRevenue)} {t.currency}</td><td>{t.locked ? "LOCKED" : "OPEN"}</td></tr>)}</tbody></table></div></div></div>}

    {tab === "commission" && <div className={styles.stack}>
      <div className={styles.notice}><b>Commission precedence</b><br />Individual override → Sales Team plan → BU Default. QPOS uses Final SW Tier for all monthly SW Point and fixed LAK per HW Point.</div>
      <form key={commissionFormKey} className={styles.card} onSubmit={submitCommission}><div className={styles.title}><div><h4>Commission Settings</h4><p>Software tier is non-progressive. Historical months are locked by running month.</p></div></div>{locked && <div className={styles.lock}>Historical period is locked.</div>}
        <div className={styles.grid3}>
          <label>Scope<select value={commissionScope} onChange={(event) => { setCommissionScope(event.target.value as ScopeType); setCommissionScopeRef(""); }}><option value="BU">BU Default</option><option value="TEAM">Sales Team</option><option value="USER">Individual Sales</option></select></label>
          {commissionScope === "TEAM" && <label>Sales Team<select value={commissionScopeRef} onChange={(event) => setCommissionScopeRef(event.target.value)} required><option value="">Select team</option>{data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
          {commissionScope === "USER" && <label>Sales Owner<select value={commissionScopeRef} onChange={(event) => setCommissionScopeRef(event.target.value)} required><option value="">Select CRM member</option>{activeMembers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>}
          <label>Plan Name<input name="planName" defaultValue={selectedCommissionPlan?.name || (commissionScope === "BU" ? planDefaults?.name : `${businessUnit} ${commissionScope === "TEAM" ? "Team" : "Individual"} Commission`) || "Standard Commission"} /></label>
          <label>Hardware LAK / HW Point<input name="hardwareRate" type="number" min="0" defaultValue={planDefaults?.hardwareLAKPerPoint || 0} /></label>
          <label>Rule Source<input name="ruleSource" defaultValue={planDefaults?.ruleSource || ""} /></label>
          <label>Status<select name="planStatus" defaultValue={selectedCommissionPlan?.status || "OPEN"}><option>OPEN</option><option>LOCKED</option><option>INACTIVE</option></select></label>
        </div>
        {!selectedCommissionPlan && commissionScope !== "BU" && <div className={styles.formula}>No {commissionScope.toLowerCase()} override exists for this scope yet. Values below are copied from the BU/default template; Save creates the override for {period}.</div>}
        <div className={styles.tableWrap}><table><thead><tr><th>Tier</th><th>Min SW Point</th><th>Max SW Point</th><th>LAK / SW Point</th></tr></thead><tbody>{commissionTiers.map((tier,i) => <tr key={tier.tierCode}><td><b>{tier.name}</b><small>{tier.tierCode}</small></td><td><input name={`tierMin:${i}`} type="number" min="0" defaultValue={tier.minSWPoints} disabled={locked} /></td><td><input name={`tierMax:${i}`} type="number" min="0" defaultValue={tier.maxSWPoints ?? ""} placeholder="60+ = blank" disabled={locked} /></td><td><input name={`tierRate:${i}`} type="number" min="0" defaultValue={tier.lakPerSWPoint} disabled={locked} /></td></tr>)}</tbody></table></div>
        <div className={styles.formula}>QPOS example: 38 SW Point at Tier 2 = <b>38 × 150,000 = 5,700,000 LAK</b>. The final tier rate applies to all 38 points, not progressively.</div>
        <div className={styles.actions}><button disabled={saving || locked || ((commissionScope === "TEAM" || commissionScope === "USER") && !commissionScopeRef) || !can("commission.manage")}>Save Commission Settings</button></div>
      </form>
      <div className={styles.card}><h4>{period} Commission Plans</h4><div className={styles.tableWrap}><table><thead><tr><th>Priority / Scope</th><th>Plan</th><th>SW Tier</th><th>HW Rate</th><th>Status</th></tr></thead><tbody>{data.commissionPlans.length ? data.commissionPlans.map((plan) => <tr key={`${plan.scopeType}:${plan.teamId || plan.ownerUserId || "BU"}`}><td><b>{scopeLabel(plan)}</b>{plan.isTemplate && <small>Template from previous month — not stamped yet</small>}</td><td>{plan.name}<small>{plan.ruleSource || "No rule source"}</small></td><td>{plan.tiers.length} tier(s)</td><td>{fmt(plan.hardwareLAKPerPoint)} LAK / Point</td><td>{plan.status}</td></tr>) : <tr><td colSpan={5}>No commission plan for this BU yet.</td></tr>}</tbody></table></div></div>
    </div>}
  </section>;
}
