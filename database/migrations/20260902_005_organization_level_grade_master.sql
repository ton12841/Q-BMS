BEGIN;

-- Q BMS canonical Organization Level / Grade Master.
-- Department remains intentionally on HOLD and is not touched by this migration.
-- Experience / education are guidance only; only Grade 5 has a confirmed criterion
-- from the agreed source. Other grades intentionally remain NULL rather than guessed.

DO $$
DECLARE
  v_level_0 BIGINT;
  v_level_i BIGINT;
  v_level_ii BIGINT;
  v_level_iii BIGINT;
  v_level_iv BIGINT;
  v_level_v BIGINT;
BEGIN
  -- Level 0 — Top Management
  UPDATE job_levels
  SET name = 'Top Management',
      description = 'Level 0',
      status = 'ACTIVE',
      sort_order = 0,
      updated_at = NOW()
  WHERE code = 'LEVEL_0'
  RETURNING id INTO v_level_0;

  IF v_level_0 IS NULL THEN
    INSERT INTO job_levels (code, name, description, status, sort_order)
    VALUES ('LEVEL_0', 'Top Management', 'Level 0', 'ACTIVE', 0)
    RETURNING id INTO v_level_0;
  END IF;

  -- Level I — Executive Management (C-Level)
  UPDATE job_levels
  SET name = 'Executive Management (C-Level)',
      description = 'Level I',
      status = 'ACTIVE',
      sort_order = 1,
      updated_at = NOW()
  WHERE code = 'LEVEL_I'
  RETURNING id INTO v_level_i;

  IF v_level_i IS NULL THEN
    INSERT INTO job_levels (code, name, description, status, sort_order)
    VALUES ('LEVEL_I', 'Executive Management (C-Level)', 'Level I', 'ACTIVE', 1)
    RETURNING id INTO v_level_i;
  END IF;

  -- Level II — Senior Management
  UPDATE job_levels
  SET name = 'Senior Management',
      description = 'Level II',
      status = 'ACTIVE',
      sort_order = 2,
      updated_at = NOW()
  WHERE code = 'LEVEL_II'
  RETURNING id INTO v_level_ii;

  IF v_level_ii IS NULL THEN
    INSERT INTO job_levels (code, name, description, status, sort_order)
    VALUES ('LEVEL_II', 'Senior Management', 'Level II', 'ACTIVE', 2)
    RETURNING id INTO v_level_ii;
  END IF;

  -- Level III — Junior Management
  UPDATE job_levels
  SET name = 'Junior Management',
      description = 'Level III',
      status = 'ACTIVE',
      sort_order = 3,
      updated_at = NOW()
  WHERE code = 'LEVEL_III'
  RETURNING id INTO v_level_iii;

  IF v_level_iii IS NULL THEN
    INSERT INTO job_levels (code, name, description, status, sort_order)
    VALUES ('LEVEL_III', 'Junior Management', 'Level III', 'ACTIVE', 3)
    RETURNING id INTO v_level_iii;
  END IF;

  -- Level IV — Senior Contributor
  UPDATE job_levels
  SET name = 'Senior Contributor',
      description = 'Level IV',
      status = 'ACTIVE',
      sort_order = 4,
      updated_at = NOW()
  WHERE code = 'LEVEL_IV'
  RETURNING id INTO v_level_iv;

  IF v_level_iv IS NULL THEN
    INSERT INTO job_levels (code, name, description, status, sort_order)
    VALUES ('LEVEL_IV', 'Senior Contributor', 'Level IV', 'ACTIVE', 4)
    RETURNING id INTO v_level_iv;
  END IF;

  -- Level V — Entry Level
  UPDATE job_levels
  SET name = 'Entry Level',
      description = 'Level V',
      status = 'ACTIVE',
      sort_order = 5,
      updated_at = NOW()
  WHERE code = 'LEVEL_V'
  RETURNING id INTO v_level_v;

  IF v_level_v IS NULL THEN
    INSERT INTO job_levels (code, name, description, status, sort_order)
    VALUES ('LEVEL_V', 'Entry Level', 'Level V', 'ACTIVE', 5)
    RETURNING id INTO v_level_v;
  END IF;

  -- Canonical Grade 1–14 mapping.
  UPDATE job_grades SET job_level_id = v_level_0, name = 'President', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 1, updated_at = NOW() WHERE grade_number = 1;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_0, 1, 'President', NULL, NULL, NULL, 'ACTIVE', 1); END IF;

  UPDATE job_grades SET job_level_id = v_level_0, name = 'Vice President', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 2, updated_at = NOW() WHERE grade_number = 2;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_0, 2, 'Vice President', NULL, NULL, NULL, 'ACTIVE', 2); END IF;

  UPDATE job_grades SET job_level_id = v_level_i, name = 'CEO', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 3, updated_at = NOW() WHERE grade_number = 3;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_i, 3, 'CEO', NULL, NULL, NULL, 'ACTIVE', 3); END IF;

  UPDATE job_grades SET job_level_id = v_level_i, name = 'C-Level', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 4, updated_at = NOW() WHERE grade_number = 4;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_i, 4, 'C-Level', NULL, NULL, NULL, 'ACTIVE', 4); END IF;

  UPDATE job_grades SET job_level_id = v_level_i, name = 'Head of Department / Head of BU', experience_requirement = '12+ years total experience; 5+ years management experience', education_requirement = 'Bachelor Degree', description = 'Experience and education are guidance for HR consideration, not a hard validation rule.', status = 'ACTIVE', sort_order = 5, updated_at = NOW() WHERE grade_number = 5;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_i, 5, 'Head of Department / Head of BU', '12+ years total experience; 5+ years management experience', 'Bachelor Degree', 'Experience and education are guidance for HR consideration, not a hard validation rule.', 'ACTIVE', 5); END IF;

  UPDATE job_grades SET job_level_id = v_level_ii, name = 'Senior Manager', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 6, updated_at = NOW() WHERE grade_number = 6;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_ii, 6, 'Senior Manager', NULL, NULL, NULL, 'ACTIVE', 6); END IF;

  UPDATE job_grades SET job_level_id = v_level_ii, name = 'Mid Level Manager', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 7, updated_at = NOW() WHERE grade_number = 7;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_ii, 7, 'Mid Level Manager', NULL, NULL, NULL, 'ACTIVE', 7); END IF;

  UPDATE job_grades SET job_level_id = v_level_iii, name = 'Junior Manager', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 8, updated_at = NOW() WHERE grade_number = 8;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_iii, 8, 'Junior Manager', NULL, NULL, NULL, 'ACTIVE', 8); END IF;

  UPDATE job_grades SET job_level_id = v_level_iii, name = 'Team Leader / Supervisor / Assistant Secretary', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 9, updated_at = NOW() WHERE grade_number = 9;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_iii, 9, 'Team Leader / Supervisor / Assistant Secretary', NULL, NULL, NULL, 'ACTIVE', 9); END IF;

  UPDATE job_grades SET job_level_id = v_level_iv, name = 'Specialist / Expert', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 10, updated_at = NOW() WHERE grade_number = 10;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_iv, 10, 'Specialist / Expert', NULL, NULL, NULL, 'ACTIVE', 10); END IF;

  UPDATE job_grades SET job_level_id = v_level_iv, name = 'Senior Officer', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 11, updated_at = NOW() WHERE grade_number = 11;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_iv, 11, 'Senior Officer', NULL, NULL, NULL, 'ACTIVE', 11); END IF;

  UPDATE job_grades SET job_level_id = v_level_v, name = 'Mid Level Officer', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 12, updated_at = NOW() WHERE grade_number = 12;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_v, 12, 'Mid Level Officer', NULL, NULL, NULL, 'ACTIVE', 12); END IF;

  UPDATE job_grades SET job_level_id = v_level_v, name = 'Junior Officer / Housekeeper', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 13, updated_at = NOW() WHERE grade_number = 13;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_v, 13, 'Junior Officer / Housekeeper', NULL, NULL, NULL, 'ACTIVE', 13); END IF;

  UPDATE job_grades SET job_level_id = v_level_v, name = 'Intern', experience_requirement = NULL, education_requirement = NULL, description = NULL, status = 'ACTIVE', sort_order = 14, updated_at = NOW() WHERE grade_number = 14;
  IF NOT FOUND THEN INSERT INTO job_grades (job_level_id, grade_number, name, experience_requirement, education_requirement, description, status, sort_order) VALUES (v_level_v, 14, 'Intern', NULL, NULL, NULL, 'ACTIVE', 14); END IF;
END $$;

-- Verify the canonical set was created/updated successfully.
DO $$
DECLARE
  v_level_count INTEGER;
  v_grade_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_level_count
  FROM job_levels
  WHERE code IN ('LEVEL_0', 'LEVEL_I', 'LEVEL_II', 'LEVEL_III', 'LEVEL_IV', 'LEVEL_V');

  SELECT COUNT(DISTINCT grade_number) INTO v_grade_count
  FROM job_grades
  WHERE grade_number BETWEEN 1 AND 14;

  IF v_level_count <> 6 THEN
    RAISE EXCEPTION 'Expected 6 canonical job levels, found %', v_level_count;
  END IF;

  IF v_grade_count <> 14 THEN
    RAISE EXCEPTION 'Expected Grade 1-14, found % distinct canonical grades', v_grade_count;
  END IF;
END $$;

COMMIT;
