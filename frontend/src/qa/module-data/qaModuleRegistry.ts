export type QaModuleStatus = "READY" | "FOUNDATION" | "PLANNED" | "HOLD";
export type QaPreviewKind = "table" | "kanban" | "dashboard" | "organization";

export type QaMetric = {
  label: string;
  value: string;
  hint?: string;
};

export type QaColumn = {
  key: string;
  label: string;
};

export type QaRow = Record<string, string | number>;

export type QaModuleConfig = {
  key: string;
  titleKey: string;
  canonicalName: string;
  entityType: "MODULE" | "TOOL";
  status: QaModuleStatus;
  realHref: string;
  icon:
    | "users"
    | "building"
    | "briefcase"
    | "box"
    | "wrench"
    | "wallet"
    | "cart"
    | "chart"
    | "shield"
    | "network"
    | "report"
    | "bell"
    | "layers"
    | "grid";
  previewKind: QaPreviewKind;
  summary: string;
  metrics: QaMetric[];
  columns: QaColumn[];
  rows: QaRow[];
  notes: string[];
};

export type OrganizationQaNode = {
  id: string;
  name: string;
  employeeCode: string;
  position: string;
  businessUnit: string;
  grade: string;
  level: string;
  levelIndex: number;
  parentId: string | null;
  dottedTo?: string | null;
};

export const ORGANIZATION_QA_NODES: OrganizationQaNode[] = [
  { id: "qa-ceo", name: "QA David K.", employeeCode: "EMP-QA-001", position: "Chief Executive Officer", businessUnit: "IQURI", grade: "Grade 3", level: "Level I", levelIndex: 0, parentId: null },
  { id: "qa-qpos-head", name: "QA Mali S.", employeeCode: "EMP-QA-002", position: "Head of QPOS", businessUnit: "QPOS", grade: "Grade 5", level: "Level I", levelIndex: 1, parentId: "qa-ceo" },
  { id: "qa-iquri-head", name: "QA Niran P.", employeeCode: "EMP-QA-003", position: "Head of iQuri", businessUnit: "IQURI", grade: "Grade 5", level: "Level I", levelIndex: 1, parentId: "qa-ceo" },
  { id: "qa-lbb-head", name: "QA Lina V.", employeeCode: "EMP-QA-004", position: "Head of LBB", businessUnit: "LBB", grade: "Grade 5", level: "Level I", levelIndex: 1, parentId: "qa-ceo" },
  { id: "qa-sales-mgr", name: "QA Somchai T.", employeeCode: "EMP-QA-005", position: "Sales Manager", businessUnit: "QPOS", grade: "Grade 7", level: "Level II", levelIndex: 2, parentId: "qa-qpos-head" },
  { id: "qa-product-mgr", name: "QA Kanya R.", employeeCode: "EMP-QA-006", position: "Product Manager", businessUnit: "QPOS", grade: "Grade 7", level: "Level II", levelIndex: 2, parentId: "qa-qpos-head", dottedTo: "qa-iquri-head" },
  { id: "qa-finance-mgr", name: "QA Arun C.", employeeCode: "EMP-QA-007", position: "Finance Manager", businessUnit: "IQURI", grade: "Grade 7", level: "Level II", levelIndex: 2, parentId: "qa-iquri-head" },
  { id: "qa-hr-mgr", name: "QA May L.", employeeCode: "EMP-QA-008", position: "HR Manager", businessUnit: "IQURI", grade: "Grade 7", level: "Level II", levelIndex: 2, parentId: "qa-iquri-head" },
  { id: "qa-ops-mgr", name: "QA Vong S.", employeeCode: "EMP-QA-009", position: "Operations Manager", businessUnit: "LBB", grade: "Grade 7", level: "Level II", levelIndex: 2, parentId: "qa-lbb-head" },
  { id: "qa-sales-a", name: "QA Noy A.", employeeCode: "EMP-QA-010", position: "Sales Executive", businessUnit: "QPOS", grade: "Grade 12", level: "Level V", levelIndex: 3, parentId: "qa-sales-mgr" },
  { id: "qa-sales-b", name: "QA Beam K.", employeeCode: "EMP-QA-011", position: "Sales Executive", businessUnit: "QPOS", grade: "Grade 13", level: "Level V", levelIndex: 3, parentId: "qa-sales-mgr" },
  { id: "qa-product-officer", name: "QA Ploy M.", employeeCode: "EMP-QA-012", position: "Product Officer", businessUnit: "QPOS", grade: "Grade 12", level: "Level V", levelIndex: 3, parentId: "qa-product-mgr" },
  { id: "qa-hr-officer", name: "QA Dao P.", employeeCode: "EMP-QA-013", position: "HR Officer", businessUnit: "IQURI", grade: "Grade 12", level: "Level V", levelIndex: 3, parentId: "qa-hr-mgr" },
  { id: "qa-admin-officer", name: "QA Mint N.", employeeCode: "EMP-QA-014", position: "Admin Officer", businessUnit: "IQURI", grade: "Grade 13", level: "Level V", levelIndex: 3, parentId: "qa-hr-mgr", dottedTo: "qa-ops-mgr" },
];

const configs: QaModuleConfig[] = [
  {
    key: "employee",
    titleKey: "modules.employee.title",
    canonicalName: "Employee",
    entityType: "MODULE",
    status: "READY",
    realHref: "/employee",
    icon: "users",
    previewKind: "table",
    summary: "Employee Master populated with employment and organization information.",
    metrics: [
      { label: "Employees", value: "48", hint: "QA sample" },
      { label: "Active", value: "41" },
      { label: "Onboarding", value: "5" },
      { label: "Pre-Onboarding", value: "2" },
    ],
    columns: [
      { key: "employee", label: "Employee" },
      { key: "businessUnit", label: "Business Unit" },
      { key: "position", label: "Position" },
      { key: "grade", label: "Grade / Level" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { employee: "EMP-QA-010 · QA Noy A.", businessUnit: "QPOS", position: "Sales Executive", grade: "G12 · Level V", status: "ACTIVE" },
      { employee: "EMP-QA-012 · QA Ploy M.", businessUnit: "QPOS", position: "Product Officer", grade: "G12 · Level V", status: "ACTIVE" },
      { employee: "EMP-QA-020 · QA Tawan K.", businessUnit: "IQURI_X", position: "Project Officer", grade: "G12 · Level V", status: "ONBOARDING" },
      { employee: "EMP-QA-021 · QA Fon S.", businessUnit: "IQURI", position: "Finance Officer", grade: "G13 · Level V", status: "PRE_ONBOARDING" },
      { employee: "EMP-QA-008 · QA May L.", businessUnit: "IQURI", position: "HR Manager", grade: "G7 · Level II", status: "ACTIVE" },
    ],
    notes: ["No real Employee record is created.", "Organization changes in QA are visual only."],
  },
  {
    key: "organization",
    titleKey: "modules.organization.title",
    canonicalName: "Organization",
    entityType: "MODULE",
    status: "READY",
    realHref: "/organization",
    icon: "building",
    previewKind: "organization",
    summary: "Auto-generated company hierarchy from sample Employee Assignments and Reporting Lines.",
    metrics: [
      { label: "Employees", value: "14" },
      { label: "Primary Lines", value: "13" },
      { label: "Dotted Lines", value: "2" },
      { label: "Top-level", value: "1" },
    ],
    columns: [
      { key: "employee", label: "Employee" },
      { key: "position", label: "Position" },
      { key: "businessUnit", label: "Business Unit" },
      { key: "manager", label: "Primary Manager" },
    ],
    rows: [
      { employee: "QA David K.", position: "Chief Executive Officer", businessUnit: "IQURI", manager: "—" },
      { employee: "QA Mali S.", position: "Head of QPOS", businessUnit: "QPOS", manager: "QA David K." },
      { employee: "QA Somchai T.", position: "Sales Manager", businessUnit: "QPOS", manager: "QA Mali S." },
    ],
    notes: ["Solid line = Primary Reporting.", "Dashed marker = Dotted Reporting.", "Employee view is read-only."],
  },
  {
    key: "customer",
    titleKey: "modules.customer.title",
    canonicalName: "Customer",
    entityType: "MODULE",
    status: "PLANNED",
    realHref: "/module/customer",
    icon: "users",
    previewKind: "table",
    summary: "Shared Customer Master preview with company, contact, segment and lifecycle status.",
    metrics: [
      { label: "Customers", value: "126" },
      { label: "Active", value: "104" },
      { label: "Prospects", value: "18" },
      { label: "Branches", value: "287" },
    ],
    columns: [
      { key: "customer", label: "Customer" },
      { key: "segment", label: "Segment" },
      { key: "contact", label: "Primary Contact" },
      { key: "owner", label: "Owner BU" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { customer: "QA Mekong Coffee Group", segment: "F&B Chain", contact: "QA Contact A.", owner: "QPOS", status: "ACTIVE" },
      { customer: "QA Vientiane Retail", segment: "Retail", contact: "QA Contact B.", owner: "IQURI", status: "PROSPECT" },
      { customer: "QA North Logistics", segment: "Logistics", contact: "QA Contact C.", owner: "IQURI_X", status: "ACTIVE" },
      { customer: "QA Riverside Hotel", segment: "Hospitality", contact: "QA Contact D.", owner: "QPOS", status: "ACTIVE" },
    ],
    notes: ["Customer is a shared master, not CRM-owned.", "CRM and Finance should reference this same Customer ID."],
  },
  {
    key: "product",
    titleKey: "modules.product.title",
    canonicalName: "Product",
    entityType: "MODULE",
    status: "PLANNED",
    realHref: "/module/product",
    icon: "box",
    previewKind: "table",
    summary: "Shared Product / Service catalog preview used by Sales, Inventory and Finance.",
    metrics: [
      { label: "Products", value: "74" },
      { label: "Software", value: "12" },
      { label: "Hardware", value: "43" },
      { label: "Services", value: "19" },
    ],
    columns: [
      { key: "sku", label: "SKU" },
      { key: "product", label: "Product / Service" },
      { key: "category", label: "Category" },
      { key: "owner", label: "Owner BU" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { sku: "QA-SW-QSR", product: "QPOS QSR License", category: "Software", owner: "QPOS", status: "ACTIVE" },
      { sku: "QA-HW-P2", product: "Handheld P2", category: "Hardware", owner: "QPOS", status: "ACTIVE" },
      { sku: "QA-SVC-INSTALL", product: "Installation Service", category: "Service", owner: "IQURI", status: "ACTIVE" },
      { sku: "QA-HW-PRINT", product: "Receipt Printer", category: "Hardware", owner: "QPOS", status: "ACTIVE" },
    ],
    notes: ["Product is a shared master.", "Pricing and stock are owned by their respective tools."],
  },
  {
    key: "supplier-vendor",
    titleKey: "modules.supplier.title",
    canonicalName: "Supplier / Vendor",
    entityType: "MODULE",
    status: "PLANNED",
    realHref: "/module/supplier-vendor",
    icon: "briefcase",
    previewKind: "table",
    summary: "Supplier and Vendor master preview for Procurement, Inventory and Finance.",
    metrics: [
      { label: "Suppliers", value: "36" },
      { label: "Active", value: "31" },
      { label: "Pending Review", value: "3" },
      { label: "Inactive", value: "2" },
    ],
    columns: [
      { key: "vendor", label: "Supplier / Vendor" },
      { key: "category", label: "Category" },
      { key: "country", label: "Country" },
      { key: "payment", label: "Payment Term" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { vendor: "QA Hardware Partner", category: "POS Hardware", country: "Laos", payment: "30 Days", status: "ACTIVE" },
      { vendor: "QA Cloud Services", category: "Cloud", country: "Singapore", payment: "Monthly", status: "ACTIVE" },
      { vendor: "QA Office Supply", category: "Office", country: "Thailand", payment: "15 Days", status: "PENDING REVIEW" },
    ],
    notes: ["One canonical vendor record should be shared across Procurement and Finance."],
  },
  {
    key: "location-site",
    titleKey: "modules.location.title",
    canonicalName: "Location / Site",
    entityType: "MODULE",
    status: "PLANNED",
    realHref: "/module/location-site",
    icon: "building",
    previewKind: "table",
    summary: "Shared office, warehouse, customer site and installation location master.",
    metrics: [
      { label: "Locations", value: "42" },
      { label: "Office", value: "4" },
      { label: "Warehouse", value: "3" },
      { label: "Customer Sites", value: "35" },
    ],
    columns: [
      { key: "code", label: "Location Code" },
      { key: "location", label: "Location / Site" },
      { key: "type", label: "Type" },
      { key: "province", label: "Province" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { code: "QA-LOC-HQ", location: "QA Vientiane HQ", type: "Office", province: "Vientiane Capital", status: "ACTIVE" },
      { code: "QA-WH-01", location: "QA Central Warehouse", type: "Warehouse", province: "Vientiane Capital", status: "ACTIVE" },
      { code: "QA-SITE-101", location: "QA Customer Site 101", type: "Customer Site", province: "Bolikhamxay", status: "ACTIVE" },
    ],
    notes: ["Installation jobs and Assets should reference Location IDs instead of duplicate address data."],
  },
  {
    key: "asset",
    titleKey: "modules.asset.title",
    canonicalName: "Asset",
    entityType: "MODULE",
    status: "FOUNDATION",
    realHref: "/module/asset",
    icon: "box",
    previewKind: "table",
    summary: "Company Asset master preview with ownership, assignment and lifecycle.",
    metrics: [
      { label: "Assets", value: "214" },
      { label: "Assigned", value: "168" },
      { label: "Available", value: "31" },
      { label: "Repair", value: "15" },
    ],
    columns: [
      { key: "asset", label: "Asset" },
      { key: "serial", label: "Serial / Tag" },
      { key: "category", label: "Category" },
      { key: "assigned", label: "Assigned To" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { asset: "QA MacBook Air", serial: "QA-AST-00041", category: "Laptop", assigned: "QA Noy A.", status: "ASSIGNED" },
      { asset: "QA Android Test Device", serial: "QA-AST-00116", category: "Mobile Device", assigned: "QA Product Team", status: "ASSIGNED" },
      { asset: "QA POS Demo Terminal", serial: "QA-AST-00190", category: "Demo Equipment", assigned: "—", status: "AVAILABLE" },
    ],
    notes: ["Asset is shared; HR onboarding and Inventory must reference the same Asset record."],
  },
  {
    key: "document",
    titleKey: "modules.document.title",
    canonicalName: "Document",
    entityType: "MODULE",
    status: "FOUNDATION",
    realHref: "/module/document",
    icon: "report",
    previewKind: "table",
    summary: "Shared document registry preview for Employee, Customer, Procurement and Finance.",
    metrics: [
      { label: "Documents", value: "638" },
      { label: "Employee", value: "301" },
      { label: "Business", value: "267" },
      { label: "Expiring Soon", value: "12" },
    ],
    columns: [
      { key: "document", label: "Document" },
      { key: "owner", label: "Owner" },
      { key: "type", label: "Type" },
      { key: "updated", label: "Last Updated" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { document: "QA Employment Contract", owner: "EMP-QA-010", type: "Employee", updated: "8 Sep 2026", status: "CURRENT" },
      { document: "QA Vendor Agreement", owner: "QA Hardware Partner", type: "Vendor", updated: "4 Sep 2026", status: "CURRENT" },
      { document: "QA Insurance Certificate", owner: "QA Central Warehouse", type: "Location", updated: "1 Sep 2026", status: "EXPIRING" },
    ],
    notes: ["QA documents are metadata-only samples and do not create real files."],
  },
  {
    key: "task-approval",
    titleKey: "modules.taskApproval.title",
    canonicalName: "Task & Approval",
    entityType: "MODULE",
    status: "PLANNED",
    realHref: "/module/task-approval",
    icon: "layers",
    previewKind: "table",
    summary: "Shared task and approval queue used by business tools instead of duplicating workflow logic.",
    metrics: [
      { label: "Open Tasks", value: "27" },
      { label: "Awaiting Approval", value: "11" },
      { label: "Due Today", value: "6" },
      { label: "Overdue", value: "2" },
    ],
    columns: [
      { key: "task", label: "Task / Request" },
      { key: "module", label: "Source" },
      { key: "owner", label: "Owner / Approver" },
      { key: "due", label: "Due" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { task: "QA Leave Request #0182", module: "HRM", owner: "QA HR Manager", due: "Today", status: "AWAITING APPROVAL" },
      { task: "QA PO Approval #0041", module: "Procurement", owner: "QA Finance Manager", due: "9 Sep", status: "PENDING" },
      { task: "QA Installation Acceptance #0108", module: "Installation", owner: "QA Project Manager", due: "10 Sep", status: "IN PROGRESS" },
    ],
    notes: ["Shared approval engine should be referenced by HRM, Procurement, Finance and Installation."],
  },
  {
    key: "notification",
    titleKey: "modules.notification.title",
    canonicalName: "Notification",
    entityType: "MODULE",
    status: "FOUNDATION",
    realHref: "/module/notification",
    icon: "bell",
    previewKind: "table",
    summary: "Notification Center preview for workflow events and user-targeted alerts.",
    metrics: [
      { label: "Unread", value: "8" },
      { label: "Today", value: "14" },
      { label: "Workflow", value: "9" },
      { label: "System", value: "5" },
    ],
    columns: [
      { key: "notification", label: "Notification" },
      { key: "source", label: "Source" },
      { key: "target", label: "Target" },
      { key: "time", label: "Time" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { notification: "QA Employee onboarding ready for HR review", source: "HRM", target: "HR Admin", time: "10:42", status: "UNREAD" },
      { notification: "QA Purchase Order approved", source: "Procurement", target: "Requester", time: "09:20", status: "READ" },
      { notification: "QA Installation job scheduled", source: "Installation", target: "Technician", time: "Yesterday", status: "READ" },
    ],
    notes: ["QA notifications never send email, push or external messages."],
  },
  {
    key: "hrm",
    titleKey: "modules.hrm.title",
    canonicalName: "HRM",
    entityType: "TOOL",
    status: "FOUNDATION",
    realHref: "/hrm",
    icon: "briefcase",
    previewKind: "dashboard",
    summary: "HR operational workspace preview across onboarding, attendance, leave and performance.",
    metrics: [
      { label: "Headcount", value: "48" },
      { label: "Onboarding", value: "5" },
      { label: "Leave Today", value: "3" },
      { label: "Reviews Due", value: "7" },
    ],
    columns: [
      { key: "workItem", label: "HR Work Item" },
      { key: "employee", label: "Employee" },
      { key: "owner", label: "Owner" },
      { key: "updated", label: "Updated" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { workItem: "Onboarding Review", employee: "QA Tawan K.", owner: "QA HR Manager", updated: "Today 10:30", status: "PENDING REVIEW" },
      { workItem: "Annual Leave", employee: "QA Noy A.", owner: "QA Sales Manager", updated: "Today 09:45", status: "AWAITING APPROVAL" },
      { workItem: "Probation Review", employee: "QA Ploy M.", owner: "QA Product Manager", updated: "Yesterday", status: "DUE" },
      { workItem: "Asset Return", employee: "QA Beam K.", owner: "QA IT Admin", updated: "Yesterday", status: "OPEN" },
    ],
    notes: ["QA HR records never change Employee Master or real workflow state."],
  },
  {
    key: "inventory",
    titleKey: "modules.inventory.title",
    canonicalName: "Inventory",
    entityType: "TOOL",
    status: "PLANNED",
    realHref: "/module/inventory",
    icon: "box",
    previewKind: "dashboard",
    summary: "Inventory operations preview for stock, serial items and warehouse movements.",
    metrics: [
      { label: "SKUs", value: "126" },
      { label: "In Stock", value: "2,841" },
      { label: "Low Stock", value: "9" },
      { label: "Out of Stock", value: "3" },
    ],
    columns: [
      { key: "item", label: "Item" },
      { key: "warehouse", label: "Warehouse" },
      { key: "onHand", label: "On Hand" },
      { key: "reserved", label: "Reserved" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { item: "QA Handheld P2", warehouse: "Central Warehouse", onHand: 34, reserved: 8, status: "IN STOCK" },
      { item: "QA POS Dual Screen", warehouse: "Central Warehouse", onHand: 5, reserved: 4, status: "LOW STOCK" },
      { item: "QA Receipt Printer", warehouse: "Central Warehouse", onHand: 0, reserved: 0, status: "OUT OF STOCK" },
      { item: "QA Cash Drawer", warehouse: "Demo Stock", onHand: 12, reserved: 2, status: "IN STOCK" },
    ],
    notes: ["QA stock movement is isolated and never changes real inventory balances."],
  },
  {
    key: "installation",
    titleKey: "modules.installation.title",
    canonicalName: "Installation",
    entityType: "TOOL",
    status: "PLANNED",
    realHref: "/module/installation",
    icon: "wrench",
    previewKind: "kanban",
    summary: "Installation job lifecycle preview from planning through customer acceptance.",
    metrics: [
      { label: "Open Jobs", value: "23" },
      { label: "Scheduled", value: "8" },
      { label: "On Site", value: "5" },
      { label: "Awaiting Acceptance", value: "4" },
    ],
    columns: [
      { key: "job", label: "Installation Job" },
      { key: "customer", label: "Customer / Site" },
      { key: "assignee", label: "Assignee" },
      { key: "schedule", label: "Schedule" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { job: "QA-INST-0108", customer: "QA Mekong Coffee · Branch 01", assignee: "QA Technician A.", schedule: "8 Sep · 14:00", status: "ON SITE" },
      { job: "QA-INST-0109", customer: "QA Riverside Hotel", assignee: "QA Technician B.", schedule: "9 Sep · 09:00", status: "SCHEDULED" },
      { job: "QA-INST-0110", customer: "QA Vientiane Retail", assignee: "QA Team 2", schedule: "10 Sep · 10:00", status: "PLANNED" },
      { job: "QA-INST-0105", customer: "QA Bakery Chain", assignee: "QA Technician A.", schedule: "Completed", status: "AWAITING ACCEPTANCE" },
    ],
    notes: ["Future production flow should reference Customer, Location, Product and Asset shared masters."],
  },
  {
    key: "financial",
    titleKey: "modules.financial.title",
    canonicalName: "Financial",
    entityType: "TOOL",
    status: "PLANNED",
    realHref: "/module/financial",
    icon: "wallet",
    previewKind: "dashboard",
    summary: "Finance workspace preview for invoices, AR, payments, revenue and cost control.",
    metrics: [
      { label: "Revenue MTD", value: "1.28B LAK" },
      { label: "Open AR", value: "382M LAK" },
      { label: "Overdue", value: "74M LAK" },
      { label: "Payments Today", value: "6" },
    ],
    columns: [
      { key: "document", label: "Document" },
      { key: "customer", label: "Customer" },
      { key: "amount", label: "Amount" },
      { key: "due", label: "Due Date" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { document: "QA-INV-2026-0188", customer: "QA Mekong Coffee Group", amount: "48,000,000 LAK", due: "15 Sep", status: "OPEN" },
      { document: "QA-INV-2026-0184", customer: "QA Riverside Hotel", amount: "22,900,000 LAK", due: "7 Sep", status: "OVERDUE" },
      { document: "QA-PAY-2026-0091", customer: "QA Vientiane Retail", amount: "35,000,000 LAK", due: "Paid 8 Sep", status: "PAID" },
    ],
    notes: ["All amounts are fictional QA data.", "No accounting entry or payment is posted."],
  },
  {
    key: "procurement",
    titleKey: "modules.procurement.title",
    canonicalName: "Procurement",
    entityType: "TOOL",
    status: "PLANNED",
    realHref: "/module/procurement",
    icon: "cart",
    previewKind: "kanban",
    summary: "Procurement workflow preview from Purchase Request to PO and receiving.",
    metrics: [
      { label: "Open PR", value: "12" },
      { label: "Awaiting Approval", value: "5" },
      { label: "Open PO", value: "9" },
      { label: "Receiving", value: "3" },
    ],
    columns: [
      { key: "request", label: "PR / PO" },
      { key: "supplier", label: "Supplier" },
      { key: "requester", label: "Requester" },
      { key: "amount", label: "Amount" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { request: "QA-PR-0068", supplier: "QA Hardware Partner", requester: "QPOS", amount: "96,000,000 LAK", status: "AWAITING APPROVAL" },
      { request: "QA-PO-0041", supplier: "QA Office Supply", requester: "IQURI", amount: "18,500,000 LAK", status: "ORDERED" },
      { request: "QA-PO-0038", supplier: "QA Cloud Services", requester: "IQURI_X", amount: "12,000,000 LAK", status: "RECEIVING" },
    ],
    notes: ["QA Purchase Requests and POs do not create commitments or finance liabilities."],
  },
  {
    key: "management-dashboard",
    titleKey: "modules.managementDashboard.title",
    canonicalName: "Management Dashboard",
    entityType: "TOOL",
    status: "PLANNED",
    realHref: "/module/management-dashboard",
    icon: "chart",
    previewKind: "dashboard",
    summary: "Cross-business management preview combining Sales, Operations, People and Finance.",
    metrics: [
      { label: "Revenue MTD", value: "1.28B LAK" },
      { label: "Active Customers", value: "104" },
      { label: "Open Installations", value: "23" },
      { label: "Headcount", value: "48" },
    ],
    columns: [
      { key: "businessUnit", label: "Business Unit" },
      { key: "revenue", label: "Revenue MTD" },
      { key: "pipeline", label: "Pipeline" },
      { key: "operations", label: "Open Operations" },
      { key: "health", label: "Health" },
    ],
    rows: [
      { businessUnit: "QPOS", revenue: "740M LAK", pipeline: "1.42B LAK", operations: "18 jobs", health: "ON TRACK" },
      { businessUnit: "IQURI", revenue: "360M LAK", pipeline: "640M LAK", operations: "9 tasks", health: "ON TRACK" },
      { businessUnit: "IQURI_X", revenue: "180M LAK", pipeline: "420M LAK", operations: "6 projects", health: "WATCH" },
      { businessUnit: "LBB", revenue: "—", pipeline: "—", operations: "4 items", health: "ON TRACK" },
    ],
    notes: ["QA dashboard values are illustrative only and never feed management reporting."],
  },
  {
    key: "crm",
    titleKey: "modules.crm.title",
    canonicalName: "CRM",
    entityType: "TOOL",
    status: "HOLD",
    realHref: "/module/crm",
    icon: "grid",
    previewKind: "kanban",
    summary: "Reserved CRM preview showing the future shared-data sales execution model.",
    metrics: [
      { label: "Leads", value: "86" },
      { label: "Opportunities", value: "31" },
      { label: "Pipeline", value: "2.48B LAK" },
      { label: "Won MTD", value: "420M LAK" },
    ],
    columns: [
      { key: "opportunity", label: "Opportunity" },
      { key: "customer", label: "Customer" },
      { key: "owner", label: "Owner" },
      { key: "value", label: "Value" },
      { key: "status", label: "Stage" },
    ],
    rows: [
      { opportunity: "QA QPOS Rollout", customer: "QA Mekong Coffee Group", owner: "QA Sales A.", value: "180M LAK", status: "PROPOSAL" },
      { opportunity: "QA New Branches", customer: "QA Riverside Hotel", owner: "QA Sales B.", value: "96M LAK", status: "QUALIFIED" },
      { opportunity: "QA Hardware Upgrade", customer: "QA Vientiane Retail", owner: "QA Sales A.", value: "72M LAK", status: "NEGOTIATION" },
    ],
    notes: ["CRM remains HOLD.", "This QA preview does not start CRM migration or create CRM data."],
  },
  {
    key: "it-admin",
    titleKey: "modules.itAdmin.title",
    canonicalName: "IT Admin",
    entityType: "TOOL",
    status: "FOUNDATION",
    realHref: "/it-admin",
    icon: "network",
    previewKind: "table",
    summary: "IT operations preview for account setup, identity, devices and access tasks.",
    metrics: [
      { label: "Account Requests", value: "5" },
      { label: "Ready", value: "2" },
      { label: "Device Tasks", value: "7" },
      { label: "Access Tasks", value: "4" },
    ],
    columns: [
      { key: "request", label: "IT Request" },
      { key: "employee", label: "Employee" },
      { key: "owner", label: "Owner" },
      { key: "updated", label: "Updated" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { request: "Company Email Setup", employee: "QA Tawan K.", owner: "QA IT Admin", updated: "Today 10:15", status: "IN PROGRESS" },
      { request: "Laptop Assignment", employee: "QA Fon S.", owner: "QA IT Admin", updated: "Today 09:30", status: "READY" },
      { request: "Access Provisioning", employee: "QA Project Officer", owner: "QA IT Admin", updated: "Yesterday", status: "PENDING" },
    ],
    notes: ["QA mode never provisions Gmail, identity or device access."],
  },
  {
    key: "super-admin",
    titleKey: "modules.superAdmin.title",
    canonicalName: "Super Admin",
    entityType: "TOOL",
    status: "READY",
    realHref: "/super-admin",
    icon: "shield",
    previewKind: "dashboard",
    summary: "Platform administration QA preview for roles, permissions, registry and audit.",
    metrics: [
      { label: "Users", value: "52" },
      { label: "Roles", value: "11" },
      { label: "Permissions", value: "47" },
      { label: "Audit Today", value: "86" },
    ],
    columns: [
      { key: "area", label: "Administration Area" },
      { key: "item", label: "Latest Item" },
      { key: "actor", label: "Actor" },
      { key: "time", label: "Time" },
      { key: "status", label: "Status" },
    ],
    rows: [
      { area: "User & Identity", item: "QA User access reviewed", actor: "QA Super Admin", time: "10:40", status: "OK" },
      { area: "Roles & Permissions", item: "QA Finance Admin role", actor: "QA Super Admin", time: "09:55", status: "UPDATED" },
      { area: "Module Management", item: "CRM status remains HOLD", actor: "System", time: "09:00", status: "HOLD" },
      { area: "Audit Log", item: "QA preview event", actor: "Development Preview", time: "08:45", status: "READ ONLY" },
    ],
    notes: ["QA mode is view-only and cannot mutate real Access Control or configuration."],
  },
];

export const QA_MODULES = configs;

export function getQaModule(key: string | null | undefined) {
  if (!key) return null;
  return QA_MODULES.find((item) => item.key === key) || null;
}

export function resolveQaModuleByPath(pathname: string | null | undefined) {
  const path = pathname || "/";

  if (path.startsWith("/qa-data/")) {
    return getQaModule(path.split("/")[2] || "");
  }

  if (path.startsWith("/module/")) {
    return getQaModule(path.split("/")[2] || "");
  }

  const routeOrder = [
    ["super-admin", "/super-admin"],
    ["it-admin", "/it-admin"],
    ["organization", "/organization"],
    ["employee", "/employee"],
    ["hrm", "/hrm"],
  ] as const;

  for (const [key, prefix] of routeOrder) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return getQaModule(key);
    }
  }

  return null;
}
