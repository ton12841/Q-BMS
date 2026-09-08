export type AssetGateCase = {
  onboarding_case_id: string; case_status: string; updated_at: string;
  employee_id: string; employee_code: string; first_name: string; last_name: string; nickname: string | null;
  company_email: string | null; employee_status: string; profile_status: string; start_date: string | null;
  business_unit_name: string | null; position_name: string | null; grade_number: number | null; job_level_name: string | null;
  asset_task_status: string | null; assigned_asset_count: number; latest_gate_event: string | null; latest_gate_note: string | null; latest_gate_at: string | null;
};
export type AssetRow = { id: string; asset_code: string; asset_name: string; asset_type: string; serial_number: string | null; status: string; notes: string | null };
export type AssetAssignment = { assignment_id: string; asset_id: string; employee_id: string; assignment_status: string; assigned_at: string; asset_code: string; asset_name: string; asset_type: string; serial_number: string | null; asset_status: string; assignment_notes: string | null };
export type AssetGateHistory = { id: string; event_type: string; asset_id: string | null; asset_assignment_id: string | null; note: string | null; metadata: Record<string, unknown> | null; created_at: string };
export type AssetGateDetail = { gate: AssetGateCase & Record<string, any>; assignments: AssetAssignment[]; available_assets: AssetRow[]; history: AssetGateHistory[]; locale: string };

type ApiResponse<T> = { success: boolean; data: T; message?: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';
async function requestJson<T>(path: string, label: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include', headers: { Accept: 'application/json', ...(init.body ? {'Content-Type':'application/json'} : {}), ...(init.headers || {}) }, cache: 'no-store' });
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || `${label} API returned ${response.status}.`);
  return payload.data;
}
export function fetchAssetGates(locale='en', signal?: AbortSignal) { return requestJson<AssetGateCase[]>(`/api/hrm/asset-gates?lang=${encodeURIComponent(locale)}`, 'Asset Gate', {signal}); }
export function fetchAssetGate(employeeId:string, locale='en', search='', signal?:AbortSignal) { return requestJson<AssetGateDetail>(`/api/hrm/asset-gates/${encodeURIComponent(employeeId)}?lang=${encodeURIComponent(locale)}&search=${encodeURIComponent(search)}`, 'Asset Gate detail', {signal}); }
export function quickRegisterAsset(employeeId:string, payload:Record<string,unknown>, locale='en') { return requestJson<AssetGateDetail>(`/api/hrm/asset-gates/${encodeURIComponent(employeeId)}/assets/register-and-assign?lang=${encodeURIComponent(locale)}`, 'Register asset', {method:'POST', body:JSON.stringify(payload)}); }
export function assignExistingAsset(employeeId:string, assetId:string, note:string, locale='en') { return requestJson<AssetGateDetail>(`/api/hrm/asset-gates/${encodeURIComponent(employeeId)}/assets/${encodeURIComponent(assetId)}/assign?lang=${encodeURIComponent(locale)}`, 'Assign asset', {method:'POST', body:JSON.stringify({note})}); }
export function returnAssetAssignment(employeeId:string, assignmentId:string, note:string, locale='en') { return requestJson<AssetGateDetail>(`/api/hrm/asset-gates/${encodeURIComponent(employeeId)}/assignments/${encodeURIComponent(assignmentId)}/return?lang=${encodeURIComponent(locale)}`, 'Return asset', {method:'POST', body:JSON.stringify({note})}); }
export function completeWithAssets(employeeId:string, note:string, locale='en') { return requestJson<AssetGateDetail>(`/api/hrm/asset-gates/${encodeURIComponent(employeeId)}/complete-with-assets?lang=${encodeURIComponent(locale)}`, 'Complete Asset Gate', {method:'POST', body:JSON.stringify({note})}); }
export function markNoAssetRequired(employeeId:string, note:string, locale='en') { return requestJson<AssetGateDetail>(`/api/hrm/asset-gates/${encodeURIComponent(employeeId)}/no-asset-required?lang=${encodeURIComponent(locale)}`, 'No Asset Required', {method:'POST', body:JSON.stringify({note})}); }
