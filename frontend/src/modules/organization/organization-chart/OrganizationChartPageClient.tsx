"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QBMSAppShell, { QBMSIcon } from "@/components/layout/QBMSAppShell";
import { useI18n } from "@/i18n/useQBMSI18n";
import {
  fetchOrganizationChart,
  type OrganizationChartData,
  type OrganizationChartEdge,
  type OrganizationChartNode,
} from "./organizationChart.api";
import styles from "./OrganizationChartPage.module.css";

const NODE_W = 198;
const NODE_H = 96;
const GAP_X = 34;
const GAP_Y = 86;

const copy = {
  en: {
    pageTitle: "Organization Chart",
    pageDescription: "Read-only company hierarchy generated automatically from Employee Organization data.",
    eyebrow: "ORGANIZATION / COMPANY VIEW",
    title: "Organization Chart",
    intro: "This chart is generated automatically from current Employee Assignments and Reporting Lines. It is not edited manually.",
    readOnly: "READ ONLY",
    auto: "AUTO GENERATED",
    search: "Search employee, position or Business Unit...",
    allBu: "All Business Units",
    employees: "Employees",
    primary: "Primary Lines",
    dotted: "Dotted Lines",
    roots: "Top-level",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    reset: "Reset view",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    loading: "Loading Organization Chart...",
    empty: "No active Employee Organization data yet.",
    emptyHelp: "HR must create the real Employee Organization Assignment and Reporting Lines first.",
    noResults: "No employee matches this search/filter.",
    manager: "Primary Manager",
    dottedManagers: "Dotted Manager",
    directReports: "Direct Reports",
    businessUnit: "Business Unit",
    position: "Position",
    grade: "Job Grade",
    level: "Job Level",
    workLocation: "Work Location",
    employeeCode: "Employee ID",
    effective: "Effective From",
    close: "Close",
    noManager: "Top-level / No Primary Manager",
    department: "Department",
    departmentHold: "HOLD",
    solidHelp: "Solid line = Primary reporting",
    dottedHelp: "Dashed line = Dotted reporting",
    source: "HR updates Employee Organization data; the chart changes automatically.",
    loadError: "Unable to load Organization Chart.",
  },
  th: {
    pageTitle: "Organization Chart",
    pageDescription: "ผังองค์กรแบบดูอย่างเดียว สร้างอัตโนมัติจากข้อมูล Organization ของพนักงาน",
    eyebrow: "ORGANIZATION / COMPANY VIEW",
    title: "Organization Chart",
    intro: "ผังนี้สร้างอัตโนมัติจาก Employee Assignment และ Reporting Lines ปัจจุบัน ไม่มีการวาดหรือแก้ Chart แยกเอง",
    readOnly: "ดูอย่างเดียว",
    auto: "สร้างอัตโนมัติ",
    search: "ค้นหาพนักงาน ตำแหน่ง หรือ Business Unit...",
    allBu: "ทุก Business Unit",
    employees: "พนักงาน",
    primary: "Primary Lines",
    dotted: "Dotted Lines",
    roots: "ระดับบนสุด",
    zoomIn: "ขยาย",
    zoomOut: "ย่อ",
    reset: "รีเซ็ตมุมมอง",
    expandAll: "ขยายทั้งหมด",
    collapseAll: "ย่อทั้งหมด",
    loading: "กำลังโหลด Organization Chart...",
    empty: "ยังไม่มีข้อมูล Organization ของ Active Employee",
    emptyHelp: "HR ต้องใส่ Employee Organization Assignment และ Reporting Lines จริงก่อน",
    noResults: "ไม่พบพนักงานตามคำค้น/ตัวกรอง",
    manager: "Primary Manager",
    dottedManagers: "Dotted Manager",
    directReports: "Direct Reports",
    businessUnit: "Business Unit",
    position: "Position",
    grade: "Job Grade",
    level: "Job Level",
    workLocation: "Work Location",
    employeeCode: "Employee ID",
    effective: "มีผลตั้งแต่",
    close: "ปิด",
    noManager: "ระดับบนสุด / ไม่มี Primary Manager",
    department: "Department",
    departmentHold: "HOLD",
    solidHelp: "เส้นทึบ = Primary reporting",
    dottedHelp: "เส้นประ = Dotted reporting",
    source: "HR แก้ข้อมูล Organization ของพนักงาน แล้ว Chart เปลี่ยนอัตโนมัติ",
    loadError: "ไม่สามารถโหลด Organization Chart ได้",
  },
  lo: {
    pageTitle: "Organization Chart",
    pageDescription: "ແຜນຜັງອົງກອນແບບ Read-only ທີ່ສ້າງອັດຕະໂນມັດຈາກ Employee Organization data",
    eyebrow: "ORGANIZATION / COMPANY VIEW",
    title: "Organization Chart",
    intro: "Chart ນີ້ສ້າງອັດຕະໂນມັດຈາກ Employee Assignment ແລະ Reporting Lines ປັດຈຸບັນ. ບໍ່ໄດ້ແຕ້ມ Chart ແຍກ.",
    readOnly: "READ ONLY",
    auto: "AUTO GENERATED",
    search: "ຄົ້ນຫາພະນັກງານ, Position ຫຼື Business Unit...",
    allBu: "ທຸກ Business Unit",
    employees: "Employees",
    primary: "Primary Lines",
    dotted: "Dotted Lines",
    roots: "Top-level",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    reset: "Reset view",
    expandAll: "Expand all",
    collapseAll: "Collapse all",
    loading: "ກຳລັງໂຫຼດ Organization Chart...",
    empty: "ຍັງບໍ່ມີ Active Employee Organization data",
    emptyHelp: "HR ຕ້ອງໃສ່ Employee Organization Assignment ແລະ Reporting Lines ຈິງກ່ອນ",
    noResults: "ບໍ່ພົບພະນັກງານຕາມການຄົ້ນຫາ/ຕົວກອງ",
    manager: "Primary Manager",
    dottedManagers: "Dotted Manager",
    directReports: "Direct Reports",
    businessUnit: "Business Unit",
    position: "Position",
    grade: "Job Grade",
    level: "Job Level",
    workLocation: "Work Location",
    employeeCode: "Employee ID",
    effective: "Effective From",
    close: "Close",
    noManager: "Top-level / No Primary Manager",
    department: "Department",
    departmentHold: "HOLD",
    solidHelp: "ເສັ້ນທຶບ = Primary reporting",
    dottedHelp: "ເສັ້ນປະ = Dotted reporting",
    source: "HR ແກ້ Employee Organization data ແລ້ວ Chart ປ່ຽນອັດຕະໂນມັດ",
    loadError: "ບໍ່ສາມາດໂຫຼດ Organization Chart ໄດ້",
  },
} as const;

type LayoutNode = OrganizationChartNode & {
  x: number;
  y: number;
  depth: number;
};

function buildLayout(
  nodes: OrganizationChartNode[],
  edges: OrganizationChartEdge[],
  collapsed: Set<string>
) {
  const byId = new Map(nodes.map((node) => [node.assignmentId, node]));
  const children = new Map<string, string[]>();
  const parent = new Map<string, string>();

  for (const edge of edges) {
    if (edge.relationshipType !== "PRIMARY") continue;
    if (!byId.has(edge.employeeAssignmentId) || !byId.has(edge.reportsToAssignmentId)) continue;
    parent.set(edge.employeeAssignmentId, edge.reportsToAssignmentId);
    const list = children.get(edge.reportsToAssignmentId) || [];
    list.push(edge.employeeAssignmentId);
    children.set(edge.reportsToAssignmentId, list);
  }

  const roots = nodes
    .map((node) => node.assignmentId)
    .filter((id) => !parent.has(id));

  const widths = new Map<string, number>();

  function subtreeWidth(id: string): number {
    const visibleChildren = collapsed.has(id) ? [] : (children.get(id) || []);
    if (!visibleChildren.length) {
      widths.set(id, NODE_W);
      return NODE_W;
    }
    const total =
      visibleChildren.reduce((sum, child) => sum + subtreeWidth(child), 0) +
      GAP_X * Math.max(0, visibleChildren.length - 1);
    const width = Math.max(NODE_W, total);
    widths.set(id, width);
    return width;
  }

  roots.forEach(subtreeWidth);

  const layout = new Map<string, LayoutNode>();
  let maxDepth = 0;

  function place(id: string, startX: number, depth: number) {
    const width = widths.get(id) || NODE_W;
    const visibleChildren = collapsed.has(id) ? [] : (children.get(id) || []);
    layout.set(id, {
      ...byId.get(id)!,
      x: startX + width / 2 - NODE_W / 2,
      y: depth * (NODE_H + GAP_Y),
      depth,
    });
    maxDepth = Math.max(maxDepth, depth);

    if (!visibleChildren.length) return;

    const childrenWidth =
      visibleChildren.reduce((sum, child) => sum + (widths.get(child) || NODE_W), 0) +
      GAP_X * Math.max(0, visibleChildren.length - 1);

    let cursor = startX + (width - childrenWidth) / 2;
    for (const child of visibleChildren) {
      place(child, cursor, depth + 1);
      cursor += (widths.get(child) || NODE_W) + GAP_X;
    }
  }

  let cursor = 24;
  for (const root of roots) {
    place(root, cursor, 0);
    cursor += (widths.get(root) || NODE_W) + GAP_X * 2;
  }

  return {
    layout,
    children,
    parent,
    width: Math.max(760, cursor + 24),
    height: Math.max(340, (maxDepth + 1) * (NODE_H + GAP_Y) + 44),
  };
}

function ancestorsAndDescendants(
  matchIds: Set<string>,
  nodes: OrganizationChartNode[],
  edges: OrganizationChartEdge[]
) {
  if (!matchIds.size) return new Set<string>();

  const primary = edges.filter((edge) => edge.relationshipType === "PRIMARY");
  const parent = new Map(primary.map((edge) => [edge.employeeAssignmentId, edge.reportsToAssignmentId]));
  const children = new Map<string, string[]>();
  primary.forEach((edge) => {
    const list = children.get(edge.reportsToAssignmentId) || [];
    list.push(edge.employeeAssignmentId);
    children.set(edge.reportsToAssignmentId, list);
  });

  const keep = new Set(matchIds);
  for (const id of matchIds) {
    let current = id;
    const seen = new Set<string>();
    while (parent.has(current) && !seen.has(current)) {
      seen.add(current);
      current = parent.get(current)!;
      keep.add(current);
    }

    const stack = [...(children.get(id) || [])];
    while (stack.length) {
      const child = stack.pop()!;
      if (keep.has(child)) continue;
      keep.add(child);
      stack.push(...(children.get(child) || []));
    }
  }
  return keep;
}

export default function OrganizationChartPageClient() {
  const { locale } = useI18n();
  const c = copy[locale];
  const [data, setData] = useState<OrganizationChartData | null>(null);
  const [query, setQuery] = useState("");
  const [businessUnitId, setBusinessUnitId] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchOrganizationChart(locale, controller.signal)
      .then((next) => setData(next))
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e instanceof Error ? e.message : c.loadError);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [locale]);

  const filtered = useMemo(() => {
    if (!data) return { nodes: [], edges: [] as OrganizationChartEdge[], matches: new Set<string>() };

    const buNodes = businessUnitId
      ? data.nodes.filter((node) => node.businessUnit.id === businessUnitId)
      : data.nodes;

    const buIds = new Set(buNodes.map((node) => node.assignmentId));
    const buEdges = data.edges.filter(
      (edge) =>
        buIds.has(edge.employeeAssignmentId) &&
        buIds.has(edge.reportsToAssignmentId)
    );

    const q = query.trim().toLowerCase();
    if (!q) return { nodes: buNodes, edges: buEdges, matches: new Set<string>() };

    const matches = new Set(
      buNodes
        .filter((node) =>
          [
            node.displayName,
            node.employeeCode,
            node.position.name,
            node.position.code,
            node.businessUnit.name,
            node.businessUnit.code,
            node.jobLevel.name,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
        .map((node) => node.assignmentId)
    );

    const keep = ancestorsAndDescendants(matches, buNodes, buEdges);
    const nodes = buNodes.filter((node) => keep.has(node.assignmentId));
    const ids = new Set(nodes.map((node) => node.assignmentId));
    return {
      nodes,
      edges: buEdges.filter(
        (edge) => ids.has(edge.employeeAssignmentId) && ids.has(edge.reportsToAssignmentId)
      ),
      matches,
    };
  }, [data, businessUnitId, query]);

  const chart = useMemo(
    () => buildLayout(filtered.nodes, filtered.edges, collapsed),
    [filtered.nodes, filtered.edges, collapsed]
  );

  const nodeById = useMemo(
    () => new Map(filtered.nodes.map((node) => [node.assignmentId, node])),
    [filtered.nodes]
  );

  const selected = selectedId ? nodeById.get(selectedId) || data?.nodes.find((node) => node.assignmentId === selectedId) : null;

  const primaryManager = selected
    ? data?.edges.find(
        (edge) =>
          edge.relationshipType === "PRIMARY" &&
          edge.employeeAssignmentId === selected.assignmentId
      )
    : null;

  const dottedManagers = selected
    ? (data?.edges || [])
        .filter(
          (edge) =>
            edge.relationshipType === "DOTTED" &&
            edge.employeeAssignmentId === selected.assignmentId
        )
        .map((edge) => data?.nodes.find((node) => node.assignmentId === edge.reportsToAssignmentId))
        .filter(Boolean) as OrganizationChartNode[]
    : [];

  const directReports = selected
    ? (data?.edges || []).filter(
        (edge) =>
          edge.relationshipType === "PRIMARY" &&
          edge.reportsToAssignmentId === selected.assignmentId
      ).length
    : 0;

  function toggleCollapse(id: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visiblePrimaryEdges = filtered.edges.filter(
    (edge) =>
      edge.relationshipType === "PRIMARY" &&
      chart.layout.has(edge.employeeAssignmentId) &&
      chart.layout.has(edge.reportsToAssignmentId)
  );
  const visibleDottedEdges = filtered.edges.filter(
    (edge) =>
      edge.relationshipType === "DOTTED" &&
      chart.layout.has(edge.employeeAssignmentId) &&
      chart.layout.has(edge.reportsToAssignmentId)
  );

  return (
    <QBMSAppShell
      pageTitle={c.pageTitle}
      pageDescription={c.pageDescription}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder={c.search}
    >
      <div className={styles.page}>
        <div className="qbms-breadcrumb">
          <Link href="/">{c.title}</Link><span>›</span><strong>{c.pageTitle}</strong>
        </div>

        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>{c.eyebrow}</span>
            <h2>{c.title}</h2>
            <p>{c.intro}</p>
            <div className={styles.legend}>
              <span><i className={styles.solidSample} />{c.solidHelp}</span>
              <span><i className={styles.dottedSample} />{c.dottedHelp}</span>
            </div>
          </div>
          <div className={styles.heroBadges}>
            <span className={styles.readOnly}><QBMSIcon name="lock" size={14}/>{c.readOnly}</span>
            <span className={styles.auto}><QBMSIcon name="refresh" size={14}/>{c.auto}</span>
          </div>
        </section>

        {error ? <div className={styles.error}>{error}</div> : null}

        <section className={styles.toolbar}>
          <select
            value={businessUnitId}
            onChange={(event) => {
              setBusinessUnitId(event.target.value);
              setCollapsed(new Set());
              setSelectedId(null);
            }}
          >
            <option value="">{c.allBu}</option>
            {(data?.businessUnits || []).map((bu) => (
              <option key={bu.id} value={bu.id}>{bu.code} — {bu.name}</option>
            ))}
          </select>

          <div className={styles.toolbarButtons}>
            <button type="button" onClick={() => setCollapsed(new Set())}>{c.expandAll}</button>
            <button
              type="button"
              onClick={() => setCollapsed(new Set(filtered.nodes.map((node) => node.assignmentId)))}
            >
              {c.collapseAll}
            </button>
            <button type="button" aria-label={c.zoomOut} onClick={() => setZoom((z) => Math.max(.6, +(z - .1).toFixed(1)))}>−</button>
            <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
            <button type="button" aria-label={c.zoomIn} onClick={() => setZoom((z) => Math.min(1.5, +(z + .1).toFixed(1)))}>+</button>
            <button type="button" onClick={() => { setZoom(1); setCollapsed(new Set()); }}>{c.reset}</button>
          </div>
        </section>

        <section className={styles.metrics}>
          <Metric icon="users" label={c.employees} value={data?.counts.employees || 0}/>
          <Metric icon="network" label={c.primary} value={data?.counts.primaryLines || 0}/>
          <Metric icon="layers" label={c.dotted} value={data?.counts.dottedLines || 0}/>
          <Metric icon="badge" label={c.roots} value={data?.counts.roots || 0}/>
        </section>

        <section className={styles.chartShell}>
          {loading ? (
            <div className={styles.emptyState}><span className="qbms-loading-spinner"/><strong>{c.loading}</strong></div>
          ) : !data?.nodes.length ? (
            <div className={styles.emptyState}><QBMSIcon name="network" size={32}/><strong>{c.empty}</strong><span>{c.emptyHelp}</span></div>
          ) : !filtered.nodes.length ? (
            <div className={styles.emptyState}><QBMSIcon name="search" size={30}/><strong>{c.noResults}</strong></div>
          ) : (
            <div className={styles.viewport}>
              <div
                className={styles.sizer}
                style={{ width: chart.width * zoom, height: chart.height * zoom }}
              >
                <div
                  className={styles.canvas}
                  style={{
                    width: chart.width,
                    height: chart.height,
                    transform: `scale(${zoom})`,
                  }}
                >
                  <svg
                    className={styles.edges}
                    width={chart.width}
                    height={chart.height}
                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                    aria-hidden="true"
                  >
                    {visiblePrimaryEdges.map((edge) => {
                      const child = chart.layout.get(edge.employeeAssignmentId)!;
                      const manager = chart.layout.get(edge.reportsToAssignmentId)!;
                      const x1 = manager.x + NODE_W / 2;
                      const y1 = manager.y + NODE_H;
                      const x2 = child.x + NODE_W / 2;
                      const y2 = child.y;
                      const mid = (y1 + y2) / 2;
                      return <path key={edge.id} className={styles.primaryEdge} d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`}/>;
                    })}
                    {visibleDottedEdges.map((edge) => {
                      const child = chart.layout.get(edge.employeeAssignmentId)!;
                      const manager = chart.layout.get(edge.reportsToAssignmentId)!;
                      const x1 = manager.x + NODE_W / 2;
                      const y1 = manager.y + NODE_H / 2;
                      const x2 = child.x + NODE_W / 2;
                      const y2 = child.y + NODE_H / 2;
                      return <path key={edge.id} className={styles.dottedEdge} d={`M ${x1} ${y1} Q ${(x1+x2)/2} ${Math.min(y1,y2)-50}, ${x2} ${y2}`}/>;
                    })}
                  </svg>

                  {[...chart.layout.values()].map((node) => {
                    const childCount = (chart.children.get(node.assignmentId) || []).length;
                    const isMatch = filtered.matches.has(node.assignmentId);
                    return (
                      <div
                        key={node.assignmentId}
                        className={`${styles.nodeCard} ${isMatch ? styles.nodeMatch : ""}`}
                        style={{ left: node.x, top: node.y }}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(node.assignmentId)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedId(node.assignmentId);
                          }
                        }}
                      >
                        <span className={styles.avatar}>{node.initials}</span>
                        <span className={styles.nodeCopy}>
                          <strong>{node.displayName}</strong>
                          <small>{node.position.name}</small>
                          <em>{node.businessUnit.code} · G{node.jobGrade.gradeNumber}</em>
                        </span>
                        {childCount ? (
                          <button
                            type="button"
                            className={styles.collapseButton}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleCollapse(node.assignmentId);
                            }}
                          >
                            {collapsed.has(node.assignmentId) ? "+" : "−"} {childCount}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        <div className={styles.sourceNote}><QBMSIcon name="info" size={15}/><span>{c.source}</span></div>

        {selected ? (
          <aside className={styles.detailPanel}>
            <div className={styles.detailHead}>
              <div className={styles.detailIdentity}>
                <span className={styles.detailAvatar}>{selected.initials}</span>
                <div><strong>{selected.displayName}</strong><small>{selected.position.name}</small></div>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} aria-label={c.close}>×</button>
            </div>
            <div className={styles.detailGrid}>
              <Fact label={c.employeeCode} value={selected.employeeCode}/>
              <Fact label={c.businessUnit} value={`${selected.businessUnit.code} — ${selected.businessUnit.name}`}/>
              <Fact label={c.position} value={selected.position.name}/>
              <Fact label={c.grade} value={`Grade ${selected.jobGrade.gradeNumber} — ${selected.jobGrade.name}`}/>
              <Fact label={c.level} value={`${selected.jobLevel.code} — ${selected.jobLevel.name}`}/>
              <Fact label={c.workLocation} value={selected.workLocation}/>
              <Fact label={c.effective} value={selected.effectiveFrom}/>
              <Fact label={c.directReports} value={String(directReports)}/>
              <Fact
                label={c.manager}
                value={
                  primaryManager
                    ? data?.nodes.find((node) => node.assignmentId === primaryManager.reportsToAssignmentId)?.displayName || c.noManager
                    : c.noManager
                }
              />
              <Fact
                label={c.dottedManagers}
                value={dottedManagers.length ? dottedManagers.map((node) => node.displayName).join(", ") : "—"}
              />
              <Fact label={c.department} value={c.departmentHold}/>
            </div>
          </aside>
        ) : null}
      </div>
    </QBMSAppShell>
  );
}

function Metric({ icon, label, value }: { icon: "users" | "network" | "layers" | "badge"; label: string; value: number }) {
  return <article className={styles.metric}><span><QBMSIcon name={icon} size={17}/></span><div><strong>{value}</strong><small>{label}</small></div></article>;
}

function Fact({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className={styles.fact}><span>{label}</span><strong>{value || "—"}</strong></div>;
}
