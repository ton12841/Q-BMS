
import type { Locale } from "@/i18n/config";

export type BusinessUnit = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type JobGrade = {
  id: string;
  job_level_id: string;
  job_level_code: string;
  job_level_name: string;
  job_level_description: string | null;
  job_level_sort_order: number;
  grade_number: number;
  name: string;
  experience_requirement: string | null;
  education_requirement: string | null;
  description: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type JobLevel = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  grades: JobGrade[];
};

export type JobFamilyTranslation = {
  name: string;
  description: string | null;
  translation_status?: string;
};

export type JobFamily = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  sort_order: number;
  position_count: number;
  created_at: string;
  updated_at: string;
};

export type JobFamilyDetail = JobFamily & {
  translations: Partial<
    Record<Locale, JobFamilyTranslation>
  >;
};

export type JobFamilyWritePayload = {
  code: string;
  status: "ACTIVE" | "INACTIVE";
  sort_order: number;
  translations: Record<
    Locale,
    {
      name: string;
      description: string;
    }
  >;
};

export type PositionAllowedGrade = {
  id: string;
  grade_number: number;
  name: string;
  job_level_id: string;
  job_level_code: string;
  job_level_name: string;
  is_primary: boolean;
};

export type PositionTranslation = {
  name: string;
  description: string | null;
  translation_status?: string;
};

export type Position = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;

  job_family_id: string | null;
  job_family_code: string | null;
  job_family_name: string | null;
  job_family_description: string | null;

  allowed_grades: PositionAllowedGrade[];
  grade_count: number;
};

export type PositionDetail = Position & {
  translations: Partial<
    Record<Locale, PositionTranslation>
  >;
};

export type PositionWritePayload = {
  code: string;
  job_family_id: string;
  job_grade_ids: string[];
  status: "ACTIVE" | "INACTIVE";
  sort_order: number;
  translations: Record<
    Locale,
    {
      name: string;
      description: string;
    }
  >;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

async function requestJson<T>(
  path: string,
  label: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${label} API returned ${response.status}.`);
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new Error(payload.message || `Invalid ${label} API response.`);
  }

  return payload.data;
}

export async function fetchBusinessUnits(
  locale: Locale,
  signal?: AbortSignal
): Promise<BusinessUnit[]> {
  const data = await requestJson<BusinessUnit[]>(
    `/api/organization/business-units?lang=${locale}`,
    "Business Unit",
    { signal }
  );

  if (!Array.isArray(data)) {
    throw new Error("Invalid Business Unit API response.");
  }

  return data;
}

export async function fetchLevelGradeStructure(
  locale: Locale,
  signal?: AbortSignal
): Promise<JobLevel[]> {
  const data = await requestJson<JobLevel[]>(
    `/api/organization/level-grades?lang=${locale}`,
    "Level / Grade",
    { signal }
  );

  if (!Array.isArray(data)) {
    throw new Error("Invalid Level / Grade API response.");
  }

  return data;
}

export async function fetchJobFamilies(
  locale: Locale,
  signal?: AbortSignal
): Promise<JobFamily[]> {
  const data = await requestJson<JobFamily[]>(
    `/api/organization/job-families?lang=${locale}`,
    "Job Family",
    { signal }
  );

  if (!Array.isArray(data)) {
    throw new Error("Invalid Job Family API response.");
  }

  return data;
}

export async function fetchPositions(
  locale: Locale,
  signal?: AbortSignal
): Promise<Position[]> {
  const data = await requestJson<Position[]>(
    `/api/organization/positions?lang=${locale}`,
    "Position",
    { signal }
  );

  if (!Array.isArray(data)) {
    throw new Error("Invalid Position API response.");
  }

  return data.map((position) => ({
    ...position,
    allowed_grades: Array.isArray(position.allowed_grades)
      ? position.allowed_grades
      : [],
    grade_count: Number(position.grade_count || 0),
  }));
}


export async function fetchJobFamilyDetail(
  id: string,
  locale: Locale
): Promise<JobFamilyDetail> {
  return requestJson<JobFamilyDetail>(
    `/api/organization/job-families/${id}?lang=${locale}`,
    "Job Family"
  );
}

export async function createJobFamily(
  payload: JobFamilyWritePayload
): Promise<JobFamily> {
  return requestJson<JobFamily>(
    "/api/organization/job-families",
    "Job Family",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateJobFamily(
  id: string,
  payload: JobFamilyWritePayload
): Promise<JobFamily> {
  return requestJson<JobFamily>(
    `/api/organization/job-families/${id}`,
    "Job Family",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}


export async function fetchPositionDetail(
  id: string,
  locale: Locale
): Promise<PositionDetail> {
  const data = await requestJson<PositionDetail>(
    `/api/organization/positions/${id}?lang=${locale}`,
    "Position"
  );

  return {
    ...data,
    allowed_grades: Array.isArray(
      data.allowed_grades
    )
      ? data.allowed_grades
      : [],
    grade_count: Number(
      data.grade_count || 0
    ),
  };
}

export async function createPosition(
  payload: PositionWritePayload
): Promise<Position> {
  return requestJson<Position>(
    "/api/organization/positions",
    "Position",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updatePosition(
  id: string,
  payload: PositionWritePayload
): Promise<Position> {
  return requestJson<Position>(
    `/api/organization/positions/${id}`,
    "Position",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}
