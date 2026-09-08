import { db } from '../../config/database/postgres.js';

export async function listUserIdentityAccounts() {
  const result = await db.query(`
    SELECT
      u.id,
      u.employee_id,
      u.email,
      u.auth_provider,
      u.google_subject,
      u.account_status,
      u.activated_at,
      u.first_login_at,
      u.last_login_at,
      u.created_at,
      u.updated_at,

      e.employee_code,
      e.first_name,
      e.last_name,
      e.nickname,
      e.employee_status,
      e.profile_status,
      e.company_email,

      assignment.business_unit_code,
      assignment.business_unit_name,
      assignment.position_code,
      assignment.position_name,
      assignment.job_level_code,
      assignment.job_level_name,
      assignment.grade_number,
      assignment.job_grade_name,

      invitation.invitation_status,
      invitation.sent_at AS invitation_sent_at,
      invitation.accepted_at AS invitation_accepted_at,
      invitation.expires_at AS invitation_expires_at,

      COALESCE(
        role_data.role_codes,
        ARRAY[]::varchar[]
      ) AS role_codes,

      COALESCE(session_data.active_session_count, 0)::int AS active_session_count,
      session_data.last_session_seen_at

    FROM users u
    LEFT JOIN employees e ON e.id = u.employee_id

    LEFT JOIN LATERAL (
      SELECT
        bu.code AS business_unit_code,
        bu.name AS business_unit_name,
        p.code AS position_code,
        p.name AS position_name,
        jl.code AS job_level_code,
        jl.name AS job_level_name,
        g.grade_number,
        g.name AS job_grade_name
      FROM employee_assignments ea
      JOIN business_units bu ON bu.id = ea.business_unit_id
      JOIN positions p ON p.id = ea.position_id
      JOIN job_grades g ON g.id = ea.job_grade_id
      JOIN job_levels jl ON jl.id = g.job_level_id
      WHERE ea.employee_id = e.id
        AND ea.is_primary = TRUE
        AND ea.assignment_status = 'ACTIVE'
        AND ea.effective_from <= CURRENT_DATE
        AND (ea.effective_to IS NULL OR ea.effective_to >= CURRENT_DATE)
      ORDER BY ea.effective_from DESC, ea.id DESC
      LIMIT 1
    ) assignment ON TRUE

    LEFT JOIN LATERAL (
      SELECT
        i.invitation_status,
        i.sent_at,
        i.accepted_at,
        i.expires_at
      FROM employee_invitations i
      WHERE i.employee_id = e.id
      ORDER BY
        COALESCE(i.accepted_at, i.sent_at, i.queued_at, i.updated_at, i.created_at) DESC,
        i.id DESC
      LIMIT 1
    ) invitation ON TRUE

    LEFT JOIN LATERAL (
      SELECT
        array_agg(DISTINCT r.code ORDER BY r.code) AS role_codes
      FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = u.id
        AND r.status = 'ACTIVE'
    ) role_data ON TRUE

    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (
          WHERE s.status = 'ACTIVE'
            AND s.expires_at > NOW()
        ) AS active_session_count,
        MAX(s.last_seen_at) FILTER (
          WHERE s.status = 'ACTIVE'
            AND s.expires_at > NOW()
        ) AS last_session_seen_at
      FROM auth_sessions s
      WHERE s.user_id = u.id
    ) session_data ON TRUE

    ORDER BY
      COALESCE(e.first_name, ''),
      COALESCE(e.last_name, ''),
      u.email,
      u.id
  `);

  return result.rows;
}

export async function getUserIdentityCounts() {
  const result = await db.query(`
    SELECT
      COUNT(*)::int AS total_users,
      COUNT(*) FILTER (
        WHERE google_subject IS NOT NULL
      )::int AS google_linked,
      COUNT(*) FILTER (
        WHERE google_subject IS NULL
      )::int AS google_unlinked,
      COUNT(*) FILTER (
        WHERE account_status = 'ACTIVE'
      )::int AS active_accounts,
      COUNT(*) FILTER (
        WHERE account_status = 'ONBOARDING'
      )::int AS onboarding_accounts,
      COUNT(*) FILTER (
        WHERE employee_id IS NULL
      )::int AS unlinked_employee_accounts
    FROM users
  `);

  return result.rows[0];
}
