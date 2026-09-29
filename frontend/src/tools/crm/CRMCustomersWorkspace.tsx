"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createCRMCustomerDeal,
  fetchCRMCustomers,
  fetchCRMProductOptions,
  saveCRMCustomerMaster,
} from "./api/crm.api";
import type {
  CRMAccessProfile,
  CRMCustomerMaster,
  CRMCustomerMasterPayload,
  CRMDeal,
  CRMDealProductLineInput,
  CRMProductOption,
} from "./crm.types";
import styles from "./CRMCustomersWorkspace.module.css";

type CRMCustomerScope = "AUTO" | "SELF" | "TEAM" | "BU" | "SHARED";

type OpportunityDraft = {
  currency: "LAK" | "USD" | "THB";
  expectedCloseDate: string;
  productNote: string;
  productLines: CRMDealProductLineInput[];
};

const emptyOpportunity: OpportunityDraft = {
  currency: "LAK",
  expectedCloseDate: "",
  productNote: "",
  productLines: [],
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function pretty(code: string) {
  return String(code || "").replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function canManageCustomer(access: CRMAccessProfile, businessUnit: string) {
  if (access.isSuperAdmin) return true;
  const membership = access.memberships.find((item) => item.businessUnit.toUpperCase() === businessUnit.toUpperCase());
  const capabilities = new Set(membership?.roles.flatMap((role) => role.capabilities || []) || []);
  return capabilities.has("customer.manage") || capabilities.has("settings.manage");
}

function canCreateOpportunity(access: CRMAccessProfile, businessUnit: string) {
  if (access.isSuperAdmin) return true;
  const membership = access.memberships.find((item) => item.businessUnit.toUpperCase() === businessUnit.toUpperCase());
  const capabilities = new Set(membership?.roles.flatMap((role) => role.capabilities || []) || []);
  return ["deal.self.manage", "deal.team.manage", "deal.shared.manage", "settings.manage"].some((capability) => capabilities.has(capability));
}

const emptyForm: CRMCustomerMasterPayload = {
  displayName: "",
  customerType: "BUSINESS",
  legalCompanyName: "",
  primaryContact: "",
  phone: "",
  email: "",
  whatsapp: "",
  province: "",
  status: "ACTIVE",
  note: "",
};

export default function CRMCustomersWorkspace({
  businessUnit,
  scope,
  access,
  deals,
  onOpenDeal,
  onDealCreated,
  readOnly = false,
}: {
  businessUnit: string;
  scope: CRMCustomerScope;
  access: CRMAccessProfile;
  deals: CRMDeal[];
  onOpenDeal: (deal: CRMDeal) => void;
  onDealCreated: (deal: CRMDeal) => void;
  readOnly?: boolean;
}) {
  const [customers, setCustomers] = useState<CRMCustomerMaster[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CRMCustomerMasterPayload>(emptyForm);
  const [selectedCustomer, setSelectedCustomer] = useState<CRMCustomerMaster | null>(null);
  const [opportunityCustomer, setOpportunityCustomer] = useState<CRMCustomerMaster | null>(null);
  const [opportunity, setOpportunity] = useState<OpportunityDraft>(emptyOpportunity);
  const [productOptions, setProductOptions] = useState<CRMProductOption[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [creatingDeal, setCreatingDeal] = useState(false);

  const canManage = canManageCustomer(access, businessUnit) && !readOnly;
  const canCreateDeal = canCreateOpportunity(access, businessUnit) && !readOnly;

  async function load() {
    if (!businessUnit || businessUnit === "ALL") {
      setCustomers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setCustomers(await fetchCRMCustomers(businessUnit, scope));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot load Customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [businessUnit, scope]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) => [
      customer.customerCode,
      customer.displayName,
      customer.legalCompanyName || "",
      customer.primaryContact || "",
      customer.phone || "",
      customer.email || "",
      customer.province || "",
    ].some((value) => value.toLowerCase().includes(q)));
  }, [customers, search]);

  const stats = useMemo(() => ({
    total: customers.length,
    active: customers.filter((item) => item.status === "ACTIVE").length,
    wonDeals: customers.reduce((sum, item) => sum + Number(item.wonDealCount || 0), 0),
    wonValueLAK: customers.reduce((sum, item) => sum + Number(item.wonValueLAK || 0), 0),
  }), [customers]);

  const selectedDeals = useMemo(() => {
    if (!selectedCustomer) return [];
    return deals
      .filter((deal) => deal.customerId === selectedCustomer.id || deal.customerCode === selectedCustomer.customerCode)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
  }, [deals, selectedCustomer]);

  const selectedOpenDeals = useMemo(
    () => selectedDeals.filter((deal) => !["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage)),
    [selectedDeals]
  );

  const selectedPurchasedProducts = useMemo(() => {
    const grouped = new Map<string, { productCode: string; productName: string; pointType: string; quantity: number; wonDeals: number; lastWonAt?: string }>();
    for (const deal of selectedDeals.filter((item) => item.stage === "CLOSED_WON")) {
      const touched = new Set<string>();
      for (const line of deal.productLines || []) {
        const current = grouped.get(line.productCode) || {
          productCode: line.productCode,
          productName: line.productName,
          pointType: line.pointType,
          quantity: 0,
          wonDeals: 0,
          lastWonAt: undefined,
        };
        current.quantity += Number(line.quantity || 0);
        if (!touched.has(line.productCode)) {
          current.wonDeals += 1;
          touched.add(line.productCode);
        }
        const wonAt = deal.closedWonAt || deal.updatedAt;
        if (wonAt && (!current.lastWonAt || new Date(wonAt).getTime() > new Date(current.lastWonAt).getTime())) current.lastWonAt = wonAt;
        grouped.set(line.productCode, current);
      }
    }
    return Array.from(grouped.values()).sort((a, b) => b.quantity - a.quantity || a.productName.localeCompare(b.productName));
  }, [selectedDeals]);

  function createCustomer() {
    setForm({ ...emptyForm });
    setShowForm(true);
    setMessage("");
    setError("");
  }

  function editCustomer(customer: CRMCustomerMaster) {
    setForm({
      customerId: customer.id,
      displayName: customer.displayName,
      legalCompanyName: customer.legalCompanyName || "",
      customerType: customer.customerType,
      primaryContact: customer.primaryContact || "",
      phone: customer.phone || "",
      email: customer.email || "",
      whatsapp: customer.whatsapp || "",
      province: customer.province || "",
      status: customer.status,
      note: customer.note || "",
    });
    setShowForm(true);
    setMessage("");
    setError("");
  }

  async function openOpportunity(customer: CRMCustomerMaster) {
    if (!canCreateDeal || customer.status !== "ACTIVE") return;
    setError("");
    setMessage("");
    setLoadingProducts(true);
    try {
      const options = (await fetchCRMProductOptions(businessUnit)).filter((item) => item.status === "ACTIVE");
      setProductOptions(options);
      setOpportunity({ ...emptyOpportunity, productLines: options[0] ? [{ productCode: options[0].productCode, quantity: 1, unitPrice: Number(options[0].defaultUnitPrice || 0) }] : [] });
      setOpportunityCustomer(customer);
      setSelectedCustomer(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot load Product Master for new Opportunity.");
    } finally {
      setLoadingProducts(false);
    }
  }

  function setOpportunityProduct(index: number, productCode: string) {
    const product = productOptions.find((item) => item.productCode === productCode);
    setOpportunity((current) => ({
      ...current,
      productLines: current.productLines.map((line, lineIndex) => lineIndex === index
        ? { productCode, quantity: line.quantity || 1, unitPrice: Number(product?.defaultUnitPrice || 0) }
        : line),
    }));
  }

  function addOpportunityProduct() {
    const used = new Set(opportunity.productLines.map((line) => line.productCode));
    const product = productOptions.find((item) => !used.has(item.productCode));
    if (!product) return;
    setOpportunity((current) => ({
      ...current,
      productLines: [...current.productLines, { productCode: product.productCode, quantity: 1, unitPrice: Number(product.defaultUnitPrice || 0) }],
    }));
  }

  const opportunityTotal = useMemo(
    () => opportunity.productLines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0), 0),
    [opportunity.productLines]
  );

  async function submitOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!opportunityCustomer || !canCreateDeal || !opportunity.productLines.length) return;
    setCreatingDeal(true);
    setError("");
    setMessage("");
    try {
      const created = await createCRMCustomerDeal(businessUnit, opportunityCustomer.customerCode, {
        currency: opportunity.currency,
        expectedCloseDate: opportunity.expectedCloseDate || undefined,
        productNote: opportunity.productNote.trim() || undefined,
        productLines: opportunity.productLines,
      });
      setMessage(`New Opportunity ${created.id} created for ${opportunityCustomer.displayName}.`);
      setOpportunityCustomer(null);
      setOpportunity({ ...emptyOpportunity });
      await load();
      onDealCreated(created);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot create new Opportunity.");
    } finally {
      setCreatingDeal(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || !form.displayName.trim()) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await saveCRMCustomerMaster(businessUnit, {
        ...form,
        displayName: form.displayName.trim(),
        legalCompanyName: form.legalCompanyName?.trim() || undefined,
        primaryContact: form.primaryContact?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim() || undefined,
        whatsapp: form.whatsapp?.trim() || undefined,
        province: form.province?.trim() || undefined,
        note: form.note?.trim() || undefined,
      });
      setMessage(form.customerId ? "Customer updated." : "Customer created.");
      setShowForm(false);
      setForm({ ...emptyForm });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Customer save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (businessUnit === "ALL") {
    return <section className={styles.page}><div className={styles.empty}>Select a Business Unit to open Customer Master.</div></section>;
  }

  return <section className={styles.page}>
    <header className={styles.header}>
      <div>
        <span className={styles.eyebrow}>SHARED CUSTOMER MASTER · CUSTOMER 360</span>
        <h3>Customers</h3>
        <p>One customer identity with CRM history, purchased products, open opportunities and repeat sales. Finance, Installation, Activation, Inventory and Renewal can reuse the same Customer ID later.</p>
      </div>
      {canManage && <button type="button" className={styles.primaryButton} onClick={createCustomer}>+ Create Customer</button>}
    </header>

    <div className={styles.metrics}>
      <article><span>Customers</span><strong>{stats.total}</strong><small>visible in current scope</small></article>
      <article><span>Active</span><strong>{stats.active}</strong><small>Customer Master status</small></article>
      <article><span>Closed Won Deals</span><strong>{stats.wonDeals}</strong><small>linked CRM history</small></article>
      <article><span>Won Value</span><strong>{money(stats.wonValueLAK)}</strong><small>LAK</small></article>
    </div>

    <div className={styles.toolbar}>
      <label><span>Search Customer</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Code / customer / company / contact / phone / email" /></label>
      <div className={styles.scopeBadge}>Scope: {scope === "AUTO" ? "Role-based" : scope}</div>
    </div>

    {message && <div className={styles.success}>{message}</div>}
    {error && <div className={styles.error}>{error}</div>}

    <div className={styles.tableWrap}>
      <table>
        <thead><tr><th>Customer</th><th>Contact</th><th>Location</th><th>CRM History</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={6}>Loading Customers...</td></tr> : filtered.length ? filtered.map((customer) => <tr key={customer.id}>
            <td><button type="button" className={styles.customerLink} onClick={() => setSelectedCustomer(customer)}><b>{customer.displayName}</b><small>{customer.customerCode}{customer.legalCompanyName ? ` · ${customer.legalCompanyName}` : ""}</small></button></td>
            <td>{customer.primaryContact || "—"}<small>{customer.phone || customer.email || "—"}</small></td>
            <td>{customer.province || "—"}</td>
            <td><b>{customer.wonDealCount} Closed Won</b><small>{money(customer.wonValueLAK)} LAK · {customer.dealCount} total deal(s)</small></td>
            <td><span className={customer.status === "ACTIVE" ? styles.activeStatus : styles.inactiveStatus}>{customer.status}</span></td>
            <td><div className={styles.rowActions}><button type="button" className={styles.tableButton} onClick={() => setSelectedCustomer(customer)}>View 360</button>{canManage && <button type="button" className={styles.tableButton} onClick={() => editCustomer(customer)}>Edit</button>}</div></td>
          </tr>) : <tr><td colSpan={6}>No Customers found in this scope.</td></tr>}
        </tbody>
      </table>
    </div>

    {selectedCustomer && <div className={styles.overlay} onMouseDown={() => setSelectedCustomer(null)}>
      <section className={`${styles.modal} ${styles.customer360}`} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div><span>CUSTOMER 360 · {selectedCustomer.customerCode}</span><h4>{selectedCustomer.displayName}</h4><p>{selectedCustomer.legalCompanyName || "Shared Customer Master"}</p></div>
          <button type="button" onClick={() => setSelectedCustomer(null)}>×</button>
        </div>

        <div className={styles.detailActions}>
          {canCreateDeal && selectedCustomer.status === "ACTIVE" && <button type="button" className={styles.primaryButton} disabled={loadingProducts} onClick={() => void openOpportunity(selectedCustomer)}>+ New Opportunity</button>}
          {canManage && <button type="button" className={styles.secondaryButton} onClick={() => { setSelectedCustomer(null); editCustomer(selectedCustomer); }}>Edit Customer</button>}
        </div>

        <div className={styles.customerHero}>
          <article><span>Status</span><strong>{selectedCustomer.status}</strong><small>{selectedCustomer.customerType}</small></article>
          <article><span>Open Opportunities</span><strong>{selectedOpenDeals.length}</strong><small>{money(selectedOpenDeals.filter((deal) => deal.currency === "LAK").reduce((sum, deal) => sum + deal.value, 0))} LAK pipeline</small></article>
          <article><span>Closed Won</span><strong>{selectedCustomer.wonDealCount}</strong><small>{money(selectedCustomer.wonValueLAK)} LAK lifetime won</small></article>
          <article><span>Products Purchased</span><strong>{selectedPurchasedProducts.length}</strong><small>unique Closed Won products</small></article>
        </div>

        <div className={styles.detailGrid}>
          <div><span>Primary Contact</span><strong>{selectedCustomer.primaryContact || "—"}</strong></div>
          <div><span>Phone</span><strong>{selectedCustomer.phone || "—"}</strong></div>
          <div><span>Email</span><strong>{selectedCustomer.email || "—"}</strong></div>
          <div><span>WhatsApp</span><strong>{selectedCustomer.whatsapp || "—"}</strong></div>
          <div><span>Province</span><strong>{selectedCustomer.province || "—"}</strong></div>
          <div><span>Customer Type</span><strong>{pretty(selectedCustomer.customerType)}</strong></div>
          {selectedCustomer.note && <div className={styles.detailWide}><span>Note</span><strong>{selectedCustomer.note}</strong></div>}
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.sectionTitle}><div><span>PURCHASE HISTORY</span><h5>Products Purchased</h5></div><small>Closed Won Deal Product snapshots</small></div>
          {selectedPurchasedProducts.length ? <div className={styles.productHistory}>
            {selectedPurchasedProducts.map((product) => <article key={product.productCode}>
              <div><span>{product.pointType}</span><strong>{product.productName}</strong><small>{product.productCode}</small></div>
              <div><b>{product.quantity}</b><small>total qty</small></div>
              <div><b>{product.wonDeals}</b><small>won deal(s)</small></div>
              <div><b>{product.lastWonAt ? new Date(product.lastWonAt).toLocaleDateString() : "—"}</b><small>last won</small></div>
            </article>)}
          </div> : <div className={styles.inlineEmpty}>No Closed Won Product history yet.</div>}
        </div>

        <div className={styles.sectionBlock}>
          <div className={styles.sectionTitle}><div><span>CRM HISTORY</span><h5>Deals & Opportunities</h5></div><small>{selectedDeals.length} linked deal(s)</small></div>
          {selectedDeals.length ? <div className={styles.dealHistory}>
            {selectedDeals.map((deal) => <button key={deal.id} type="button" onClick={() => { setSelectedCustomer(null); onOpenDeal(deal); }}>
              <div><strong>{deal.id} · {deal.storeName}</strong><small>{deal.owner} · {deal.productLines?.map((item) => `${item.productName} ×${item.quantity}`).join(" · ") || "No products"}</small></div>
              <div><span className={styles.stageBadge}>{pretty(deal.stage)}</span><b>{money(deal.value)} {deal.currency}</b><small>{deal.expectedCloseDate || deal.closedWonAt?.slice(0, 10) || deal.updatedAt?.slice(0, 10) || "—"}</small></div>
            </button>)}
          </div> : <div className={styles.inlineEmpty}>No linked Deals yet.</div>}
        </div>
      </section>
    </div>}

    {opportunityCustomer && <div className={styles.overlay} onMouseDown={() => !creatingDeal && setOpportunityCustomer(null)}>
      <form className={styles.modal} onSubmit={submitOpportunity} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div><span>EXISTING CUSTOMER · NEW OPPORTUNITY</span><h4>{opportunityCustomer.displayName}</h4><p>Create a new Deal directly from {opportunityCustomer.customerCode}. No duplicate Lead or Customer record is created.</p></div>
          <button type="button" disabled={creatingDeal} onClick={() => setOpportunityCustomer(null)}>×</button>
        </div>
        <div className={styles.formGrid}>
          <label>Currency<select value={opportunity.currency} onChange={(e) => setOpportunity((v) => ({ ...v, currency: e.target.value as "LAK" | "USD" | "THB" }))}><option value="LAK">LAK</option><option value="USD">USD</option><option value="THB">THB</option></select></label>
          <label>Expected Close Date<input type="date" value={opportunity.expectedCloseDate} onChange={(e) => setOpportunity((v) => ({ ...v, expectedCloseDate: e.target.value }))} /></label>
        </div>
        <div className={styles.productBuilder}>
          <div className={styles.productBuilderHeader}><div><span>PRODUCT LINES</span><strong>Product Master</strong></div><button type="button" className={styles.secondaryButton} onClick={addOpportunityProduct} disabled={opportunity.productLines.length >= productOptions.length}>+ Add Product</button></div>
          {opportunity.productLines.length ? opportunity.productLines.map((line, index) => {
            const used = new Set(opportunity.productLines.filter((_, lineIndex) => lineIndex !== index).map((item) => item.productCode));
            return <div className={styles.productRow} key={`${index}-${line.productCode}`}>
              <label>Product<select value={line.productCode} onChange={(e) => setOpportunityProduct(index, e.target.value)}>{productOptions.filter((item) => item.productCode === line.productCode || !used.has(item.productCode)).map((product) => <option key={product.productCode} value={product.productCode}>{product.productCode} · {product.productName}</option>)}</select></label>
              <label>Qty<input type="number" min={1} step={1} value={line.quantity} onChange={(e) => setOpportunity((current) => ({ ...current, productLines: current.productLines.map((item, lineIndex) => lineIndex === index ? { ...item, quantity: Math.max(1, Number(e.target.value || 1)) } : item) }))} /></label>
              <label>Unit Price<input type="number" min={0} step={1} value={line.unitPrice} onChange={(e) => setOpportunity((current) => ({ ...current, productLines: current.productLines.map((item, lineIndex) => lineIndex === index ? { ...item, unitPrice: Math.max(0, Number(e.target.value || 0)) } : item) }))} /></label>
              <div className={styles.lineTotal}><span>Line Total</span><strong>{money(Number(line.quantity || 0) * Number(line.unitPrice || 0))}</strong></div>
              <button type="button" className={styles.removeButton} onClick={() => setOpportunity((current) => ({ ...current, productLines: current.productLines.filter((_, lineIndex) => lineIndex !== index) }))}>Remove</button>
            </div>;
          }) : <div className={styles.inlineEmpty}>No active Product Master items are available.</div>}
          <div className={styles.opportunityTotal}><span>Deal Value</span><strong>{money(opportunityTotal)} {opportunity.currency}</strong></div>
        </div>
        <label className={styles.noteLabel}>Product / Commercial Note<textarea rows={3} value={opportunity.productNote} onChange={(e) => setOpportunity((v) => ({ ...v, productNote: e.target.value }))} /></label>
        <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={() => setOpportunityCustomer(null)} disabled={creatingDeal}>Cancel</button><button type="submit" className={styles.primaryButton} disabled={creatingDeal || !opportunity.productLines.length}>{creatingDeal ? "Creating..." : "Create Opportunity"}</button></div>
      </form>
    </div>}

    {showForm && <div className={styles.overlay} onMouseDown={() => !saving && setShowForm(false)}>
      <form className={styles.modal} onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div><span>{form.customerId ? "EDIT CUSTOMER" : "CREATE CUSTOMER"}</span><h4>{form.customerId ? "Update Customer Master" : "New Customer"}</h4><p>Closed Won normally creates/links a Customer automatically. Manual create is available for existing customers or corrections.</p></div>
          <button type="button" onClick={() => !saving && setShowForm(false)}>×</button>
        </div>
        <div className={styles.formGrid}>
          <label>Customer Code<input disabled value={form.customerId ? (customers.find((item) => item.id === form.customerId)?.customerCode || form.customerId) : "Auto: CUS-xxxxx"} /></label>
          <label>Customer / Store Name<input required value={form.displayName} onChange={(e) => setForm((v) => ({ ...v, displayName: e.target.value }))} /></label>
          <label>Customer Type<select value={form.customerType} onChange={(e) => setForm((v) => ({ ...v, customerType: e.target.value as "BUSINESS" | "INDIVIDUAL" }))}><option value="BUSINESS">Business</option><option value="INDIVIDUAL">Individual</option></select></label>
          <label>Legal Company Name<input value={form.legalCompanyName || ""} onChange={(e) => setForm((v) => ({ ...v, legalCompanyName: e.target.value }))} /></label>
          <label>Primary Contact<input value={form.primaryContact || ""} onChange={(e) => setForm((v) => ({ ...v, primaryContact: e.target.value }))} /></label>
          <label>Phone<input value={form.phone || ""} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} /></label>
          <label>Email<input type="email" value={form.email || ""} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} /></label>
          <label>WhatsApp<input value={form.whatsapp || ""} onChange={(e) => setForm((v) => ({ ...v, whatsapp: e.target.value }))} /></label>
          <label>Province<input value={form.province || ""} onChange={(e) => setForm((v) => ({ ...v, province: e.target.value }))} /></label>
          <label>Status<select value={form.status} onChange={(e) => setForm((v) => ({ ...v, status: e.target.value as "ACTIVE" | "INACTIVE" }))}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option></select></label>
          <label className={styles.full}>Note<textarea rows={3} value={form.note || ""} onChange={(e) => setForm((v) => ({ ...v, note: e.target.value }))} /></label>
        </div>
        <div className={styles.actions}><button type="button" className={styles.secondaryButton} onClick={() => setShowForm(false)} disabled={saving}>Cancel</button><button type="submit" className={styles.primaryButton} disabled={saving || !form.displayName.trim()}>{saving ? "Saving..." : form.customerId ? "Save Customer" : "Create Customer"}</button></div>
      </form>
    </div>}
  </section>;
}
