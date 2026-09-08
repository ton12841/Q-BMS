import { db } from '../../config/database/postgres.js';

export async function insertSession({
  tokenHash,
  userId,
  sessionKind,
  expiresAt,
  ipAddress,
  userAgent,
  metadata = {},
}) {
  const result = await db.query(
    `
      INSERT INTO auth_sessions (
        token_hash,
        user_id,
        session_kind,
        expires_at,
        ip_address,
        user_agent,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING *
    `,
    [
      tokenHash,
      userId || null,
      sessionKind,
      expiresAt,
      ipAddress || null,
      userAgent || null,
      JSON.stringify(metadata || {}),
    ]
  );

  return result.rows[0];
}

export async function insertOauthState({
  stateHash,
  codeVerifier,
  invitationPublicId,
  returnPath,
  expiresAt,
  ipAddress,
  userAgent,
}) {
  const result = await db.query(
    `
      INSERT INTO auth_oauth_states (
        state_hash,
        code_verifier,
        invitation_public_id,
        return_path,
        expires_at,
        ip_address,
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      stateHash,
      codeVerifier,
      invitationPublicId || null,
      returnPath || '/',
      expiresAt,
      ipAddress || null,
      userAgent || null,
    ]
  );

  return result.rows[0];
}

export async function consumeOauthState(stateHash) {
  const result = await db.query(
    `
      UPDATE auth_oauth_states
      SET consumed_at = NOW()
      WHERE state_hash = $1
        AND consumed_at IS NULL
        AND expires_at > NOW()
      RETURNING *
    `,
    [stateHash]
  );

  return result.rows[0] || null;
}

export async function findActiveSession(tokenHash) {
  const result = await db.query(
    `
      SELECT
        s.id,
        s.user_id,
        s.session_kind,
        s.status,
        s.expires_at,
        s.last_seen_at,
        s.metadata,
        s.created_at,

        u.email,
        u.account_status,
        u.google_subject,
        u.employee_id,
        u.first_login_at,
        u.last_login_at,

        e.employee_code,
        e.first_name,
        e.last_name,
        e.nickname,
        e.employee_status,
        e.profile_status,

        assignment.business_unit_id,
        assignment.business_unit_code,
        assignment.business_unit_name,
        assignment.position_id,
        assignment.position_code,
        assignment.position_name,
        assignment.job_grade_id,
        assignment.grade_number,
        assignment.job_grade_name,
        assignment.job_level_id,
        assignment.job_level_code,
        assignment.job_level_name
      FROM auth_sessions s
      LEFT JOIN users u ON u.id = s.user_id
      LEFT JOIN employees e ON e.id = u.employee_id
      LEFT JOIN LATERAL (
        SELECT
          ea.business_unit_id,
          bu.code AS business_unit_code,
          bu.name AS business_unit_name,
          ea.position_id,
          p.code AS position_code,
          p.name AS position_name,
          ea.job_grade_id,
          g.grade_number,
          g.name AS job_grade_name,
          g.job_level_id,
          jl.code AS job_level_code,
          jl.name AS job_level_name
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
      WHERE s.token_hash = $1
        AND s.status = 'ACTIVE'
        AND s.expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] || null;
}

export async function findRolesAndPermissions({
  userId,
  jobLevelId = null,
  jobGradeId = null,
}) {
  if (!userId) {
    return {
      roles: [],
      permissions: [],
      rolePermissions: [],
      levelPermissions: [],
      gradeGrantedPermissions: [],
      gradeRevokedPermissions: [],
    };
  }

  const [
    roleResult,
    rolePermissionResult,
    levelPermissionResult,
    gradeOverrideResult,
  ] = await Promise.all([
    db.query(
      `
        SELECT r.code, r.name, r.is_system_role
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = $1
          AND r.status = 'ACTIVE'
        ORDER BY r.is_system_role DESC, r.code ASC
      `,
      [userId]
    ),
    db.query(
      `
        SELECT DISTINCT p.code
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        JOIN role_permissions rp ON rp.role_id = r.id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE ur.user_id = $1
          AND r.status = 'ACTIVE'
        ORDER BY p.code ASC
      `,
      [userId]
    ),
    jobLevelId
      ? db.query(
          `
            SELECT DISTINCT p.code
            FROM job_level_permission_grants jlp
            JOIN permissions p ON p.id = jlp.permission_id
            WHERE jlp.job_level_id = $1
              AND p.level_grade_policy_eligible = TRUE
            ORDER BY p.code ASC
          `,
          [jobLevelId]
        )
      : Promise.resolve({ rows: [] }),
    jobGradeId
      ? db.query(
          `
            SELECT p.code, jgo.override_effect
            FROM job_grade_permission_overrides jgo
            JOIN permissions p ON p.id = jgo.permission_id
            WHERE jgo.job_grade_id = $1
              AND p.level_grade_policy_eligible = TRUE
            ORDER BY p.code ASC
          `,
          [jobGradeId]
        )
      : Promise.resolve({ rows: [] }),
  ]);

  const rolePermissions = rolePermissionResult.rows.map((row) => row.code);
  const levelPermissions = levelPermissionResult.rows.map((row) => row.code);
  const gradeGrantedPermissions = gradeOverrideResult.rows
    .filter((row) => row.override_effect === 'GRANT')
    .map((row) => row.code);
  const gradeRevokedPermissions = gradeOverrideResult.rows
    .filter((row) => row.override_effect === 'REVOKE')
    .map((row) => row.code);

  // Grade overrides Level only inside the organization policy layer.
  // Role permissions remain additive and cannot be revoked by Level / Grade policy.
  const organizationPolicyPermissions = new Set(
    levelPermissions.filter((code) => !gradeRevokedPermissions.includes(code))
  );

  for (const code of gradeGrantedPermissions) {
    organizationPolicyPermissions.add(code);
  }

  const effectivePermissions = Array.from(
    new Set([...rolePermissions, ...organizationPolicyPermissions])
  ).sort();

  return {
    roles: roleResult.rows,
    permissions: effectivePermissions,
    rolePermissions,
    levelPermissions,
    gradeGrantedPermissions,
    gradeRevokedPermissions,
  };
}

export async function findInvitationPreview(publicId) {
  const result = await db.query(
    `
      SELECT
        i.id,
        i.public_id,
        i.employee_id,
        i.invited_email,
        i.invitation_status,
        i.queued_at,
        i.sent_at,
        i.expires_at,
        i.accepted_at,
        i.revoked_at,
        e.employee_code,
        e.first_name,
        e.last_name,
        e.nickname,
        e.employee_status,
        e.profile_status
      FROM employee_invitations i
      JOIN employees e ON e.id = i.employee_id
      WHERE i.public_id = $1
      LIMIT 1
    `,
    [publicId]
  );

  return result.rows[0] || null;
}

export async function authenticateGoogleIdentity({ identity, invitationPublicId }) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    let invitation = null;
    if (invitationPublicId) {
      const invitationResult = await client.query(
        `
          SELECT i.*, e.company_email, e.employee_status, e.profile_status
          FROM employee_invitations i
          JOIN employees e ON e.id = i.employee_id
          WHERE i.public_id = $1
          FOR UPDATE OF i, e
        `,
        [invitationPublicId]
      );
      invitation = invitationResult.rows[0] || null;

      if (!invitation) {
        const error = new Error('This Q BMS invitation was not found.');
        error.statusCode = 404;
        error.code = 'INVITATION_NOT_FOUND';
        throw error;
      }

      if (!['QUEUED', 'SENT'].includes(invitation.invitation_status)) {
        const error = new Error('This Q BMS invitation is no longer active.');
        error.statusCode = 409;
        error.code = 'INVITATION_NOT_ACTIVE';
        throw error;
      }

      if (!invitation.expires_at || new Date(invitation.expires_at) <= new Date()) {
        await client.query(
          `UPDATE employee_invitations
           SET invitation_status = 'EXPIRED', updated_at = NOW()
           WHERE id = $1`,
          [invitation.id]
        );
        const error = new Error('This Q BMS invitation has expired. Please ask HR to send a new invitation.');
        error.statusCode = 410;
        error.code = 'INVITATION_EXPIRED';
        throw error;
      }

      if (String(invitation.invited_email || '').toLowerCase() !== identity.email) {
        const error = new Error('The Google account does not match the company email on this invitation.');
        error.statusCode = 403;
        error.code = 'INVITATION_EMAIL_MISMATCH';
        throw error;
      }
    }

    const bySubject = await client.query(
      `SELECT * FROM users WHERE google_subject = $1 LIMIT 1 FOR UPDATE`,
      [identity.subject]
    );
    let user = bySubject.rows[0] || null;

    if (user && invitation && Number(user.employee_id) !== Number(invitation.employee_id)) {
      const error = new Error('This Google account is already linked to another Q BMS employee.');
      error.statusCode = 409;
      error.code = 'GOOGLE_IDENTITY_ALREADY_LINKED';
      throw error;
    }

    if (invitation) {
      const byEmployee = await client.query(
        `SELECT * FROM users WHERE employee_id = $1 LIMIT 1 FOR UPDATE`,
        [invitation.employee_id]
      );
      const employeeUser = byEmployee.rows[0] || null;

      if (employeeUser && user && Number(employeeUser.id) !== Number(user.id)) {
        const error = new Error('The employee already has a different Q BMS user account.');
        error.statusCode = 409;
        error.code = 'EMPLOYEE_USER_CONFLICT';
        throw error;
      }

      user = user || employeeUser;

      if (user?.google_subject && user.google_subject !== identity.subject) {
        const error = new Error('The employee is already linked to a different Google account.');
        error.statusCode = 409;
        error.code = 'EMPLOYEE_GOOGLE_CONFLICT';
        throw error;
      }

      if (user) {
        const updatedUser = await client.query(
          `
            UPDATE users
            SET email = $2,
                auth_provider = 'GOOGLE',
                google_subject = $3,
                account_status = CASE
                  WHEN account_status = 'ACTIVE' THEN 'ACTIVE'
                  ELSE 'ONBOARDING'
                END,
                activated_at = COALESCE(activated_at, NOW()),
                first_login_at = COALESCE(first_login_at, NOW()),
                last_login_at = NOW(),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [user.id, identity.email, identity.subject]
        );
        user = updatedUser.rows[0];
      } else {
        const insertedUser = await client.query(
          `
            INSERT INTO users (
              employee_id,
              email,
              auth_provider,
              google_subject,
              account_status,
              activated_at,
              first_login_at,
              last_login_at
            )
            VALUES ($1, $2, 'GOOGLE', $3, 'ONBOARDING', NOW(), NOW(), NOW())
            RETURNING *
          `,
          [invitation.employee_id, identity.email, identity.subject]
        );
        user = insertedUser.rows[0];
      }

      await client.query(
        `
          UPDATE employee_invitations
          SET invitation_status = 'ACCEPTED',
              accepted_at = COALESCE(accepted_at, NOW()),
              updated_at = NOW()
          WHERE id = $1
        `,
        [invitation.id]
      );

      await client.query(
        `
          UPDATE employees
          SET employee_status = CASE
                WHEN employee_status = 'PRE_ONBOARDING' THEN 'ONBOARDING'
                ELSE employee_status
              END,
              updated_at = NOW()
          WHERE id = $1
        `,
        [invitation.employee_id]
      );
    } else {
      if (!user) {
        const error = new Error('Your Google account has not been activated for Q BMS yet. Please use your HR invitation first.');
        error.statusCode = 403;
        error.code = 'INVITATION_REQUIRED';
        throw error;
      }

      if (['SUSPENDED', 'INACTIVE'].includes(String(user.account_status || '').toUpperCase())) {
        const error = new Error('Your Q BMS account is not active. Please contact HR or IT Admin.');
        error.statusCode = 403;
        error.code = 'ACCOUNT_NOT_ACTIVE';
        throw error;
      }

      if (String(user.email || '').toLowerCase() !== identity.email) {
        const error = new Error('The Google account email does not match the Q BMS user account.');
        error.statusCode = 403;
        error.code = 'USER_EMAIL_MISMATCH';
        throw error;
      }

      const updatedUser = await client.query(
        `
          UPDATE users
          SET first_login_at = COALESCE(first_login_at, NOW()),
              last_login_at = NOW(),
              updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `,
        [user.id]
      );
      user = updatedUser.rows[0];
    }

    await client.query('COMMIT');
    return user;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve original error.
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function touchSession(sessionId) {
  await db.query(
    `
      UPDATE auth_sessions
      SET last_seen_at = NOW(), updated_at = NOW()
      WHERE id = $1
        AND status = 'ACTIVE'
    `,
    [sessionId]
  );
}

export async function revokeSession(tokenHash) {
  await db.query(
    `
      UPDATE auth_sessions
      SET
        status = 'REVOKED',
        revoked_at = NOW(),
        updated_at = NOW()
      WHERE token_hash = $1
        AND status = 'ACTIVE'
    `,
    [tokenHash]
  );
}
