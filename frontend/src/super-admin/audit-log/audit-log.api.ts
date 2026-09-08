import { AUTH_API_URL } from "@/modules/auth/api/auth.api";

export type AuditLogEntry = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string | null;
  actor: {
    userId: string | null;
    employeeCode: string | null;
    email: string | null;
    displayName: string;
    accountStatus: string | null;
  };
  metadata: unknown;
};

export type AuditLogOverview = {
  counts: {
    total: number;
    today: number;
    last24Hours: number;
    uniqueActors: number;
  };
  filters: {
    actions: Array<{ value: string; count: number }>;
    entityTypes: Array<{ value: string; count: number }>;
    actors: Array<{
      userId: string;
      email: string | null;
      employeeCode: string | null;
      displayName: string;
      auditCount: number;
    }>;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  logs: AuditLogEntry[];
  mode: string;
  security: {
    metadataSanitized: boolean;
    sensitiveFieldsRedacted: boolean;
  };
};

export type AuditLogQuery = {
  q?: string;
  action?: string;
  entityType?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

export async function fetchAuditLogOverview(
  query: AuditLogQuery,
  signal?: AbortSignal
) {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.action) params.set("action", query.action);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.actorUserId) params.set("actorUserId", query.actorUserId);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  params.set("page", String(query.page || 1));
  params.set("pageSize", String(query.pageSize || 50));

  const response = await fetch(
    `${AUTH_API_URL}/api/super-admin/audit-log/overview?${params.toString()}`,
    {
      credentials: "include",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
      },
    }
  );

  const payload = (await response
    .json()
    .catch(() => null)) as ApiResponse<AuditLogOverview> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message || `Audit Log API returned ${response.status}.`
    );
  }

  return payload.data;
}
