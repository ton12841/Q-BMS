-- Q BMS v2.0.6.0
-- EN is source/approved. TH/LO are controlled DRAFT translations pending company review.

INSERT INTO business_unit_translations (
  business_unit_id, locale, name, description, translation_status
)
SELECT b.id, v.locale, v.name, v.description, v.status
FROM (
  VALUES
    ('IQURI','en','iQuri','iQuri business unit','APPROVED'),
    ('IQURI','th','iQuri','หน่วยธุรกิจ iQuri','DRAFT'),
    ('IQURI','lo','iQuri','ໜ່ວຍທຸລະກິດ iQuri','DRAFT'),
    ('QPOS','en','QPOS','QPOS business unit','APPROVED'),
    ('QPOS','th','QPOS','หน่วยธุรกิจ QPOS','DRAFT'),
    ('QPOS','lo','QPOS','ໜ່ວຍທຸລະກິດ QPOS','DRAFT'),
    ('IQURI_X','en','iQuri X','iQuri X business unit','APPROVED'),
    ('IQURI_X','th','iQuri X','หน่วยธุรกิจ iQuri X','DRAFT'),
    ('IQURI_X','lo','iQuri X','ໜ່ວຍທຸລະກິດ iQuri X','DRAFT'),
    ('LBB','en','LBB','LBB business unit','APPROVED'),
    ('LBB','th','LBB','หน่วยธุรกิจ LBB','DRAFT'),
    ('LBB','lo','LBB','ໜ່ວຍທຸລະກິດ LBB','DRAFT')
) AS v(code, locale, name, description, status)
JOIN business_units b ON b.code = v.code
ON CONFLICT (business_unit_id, locale)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  translation_status = EXCLUDED.translation_status,
  updated_at = NOW();

INSERT INTO job_level_translations (
  job_level_id, locale, name, description, translation_status
)
SELECT l.id, v.locale, v.name, v.description, v.status
FROM (
  VALUES
    ('LEVEL_0','en','Top Management','Level 0','APPROVED'),
    ('LEVEL_0','th','ผู้บริหารสูงสุด','ระดับ 0','DRAFT'),
    ('LEVEL_0','lo','ຜູ້ບໍລິຫານສູງສຸດ','ລະດັບ 0','DRAFT'),
    ('LEVEL_I','en','Executive Management (C-Level)','Level I','APPROVED'),
    ('LEVEL_I','th','ผู้บริหารระดับสูง (C-Level)','ระดับ I','DRAFT'),
    ('LEVEL_I','lo','ຜູ້ບໍລິຫານລະດັບສູງ (C-Level)','ລະດັບ I','DRAFT'),
    ('LEVEL_II','en','Senior Management','Level II','APPROVED'),
    ('LEVEL_II','th','ผู้บริหารอาวุโส','ระดับ II','DRAFT'),
    ('LEVEL_II','lo','ຜູ້ບໍລິຫານອາວຸໂສ','ລະດັບ II','DRAFT'),
    ('LEVEL_III','en','Junior Management','Level III','APPROVED'),
    ('LEVEL_III','th','ผู้บริหารระดับต้น','ระดับ III','DRAFT'),
    ('LEVEL_III','lo','ຜູ້ບໍລິຫານລະດັບຕົ້ນ','ລະດັບ III','DRAFT'),
    ('LEVEL_IV','en','Senior Contributor','Level IV','APPROVED'),
    ('LEVEL_IV','th','ผู้ปฏิบัติงานอาวุโส','ระดับ IV','DRAFT'),
    ('LEVEL_IV','lo','ພະນັກງານອາວຸໂສ','ລະດັບ IV','DRAFT'),
    ('LEVEL_V','en','Entry Level','Level V','APPROVED'),
    ('LEVEL_V','th','ระดับเริ่มต้น','ระดับ V','DRAFT'),
    ('LEVEL_V','lo','ລະດັບເລີ່ມຕົ້ນ','ລະດັບ V','DRAFT')
) AS v(code, locale, name, description, status)
JOIN job_levels l ON l.code = v.code
ON CONFLICT (job_level_id, locale)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  translation_status = EXCLUDED.translation_status,
  updated_at = NOW();

INSERT INTO job_grade_translations (
  job_grade_id,
  locale,
  name,
  experience_requirement,
  education_requirement,
  translation_status
)
SELECT
  g.id,
  v.locale,
  v.name,
  v.experience_requirement,
  v.education_requirement,
  v.status
FROM (
  VALUES
    (1,'en','President','N/A','N/A','APPROVED'),
    (1,'th','ประธานบริษัท','ไม่ระบุ','ไม่ระบุ','DRAFT'),
    (1,'lo','ປະທານບໍລິສັດ','ບໍ່ລະບຸ','ບໍ່ລະບຸ','DRAFT'),

    (2,'en','Vice President','N/A','N/A','APPROVED'),
    (2,'th','รองประธานบริษัท','ไม่ระบุ','ไม่ระบุ','DRAFT'),
    (2,'lo','ຮອງປະທານບໍລິສັດ','ບໍ່ລະບຸ','ບໍ່ລະບຸ','DRAFT'),

    (3,'en','CEO','N/A','N/A','APPROVED'),
    (3,'th','ประธานเจ้าหน้าที่บริหาร','ไม่ระบุ','ไม่ระบุ','DRAFT'),
    (3,'lo','ປະທານບໍລິຫານ','ບໍ່ລະບຸ','ບໍ່ລະບຸ','DRAFT'),

    (4,'en','C-Level','N/A','N/A','APPROVED'),
    (4,'th','ผู้บริหารระดับ C-Level','ไม่ระบุ','ไม่ระบุ','DRAFT'),
    (4,'lo','ຜູ້ບໍລິຫານລະດັບ C-Level','ບໍ່ລະບຸ','ບໍ່ລະບຸ','DRAFT'),

    (5,'en','Head of Department / Head of BU','12+ years (5+ management)','Bachelor Degree','APPROVED'),
    (5,'th','หัวหน้าฝ่าย / หัวหน้าหน่วยธุรกิจ','ประสบการณ์ 12+ ปี (ด้านบริหาร 5+ ปี)','ปริญญาตรี','DRAFT'),
    (5,'lo','ຫົວໜ້າພະແນກ / ຫົວໜ້າໜ່ວຍທຸລະກິດ','ປະສົບການ 12+ ປີ (ດ້ານບໍລິຫານ 5+ ປີ)','ປະລິນຍາຕີ','DRAFT'),

    (6,'en','Senior Manager','10+ years (4+ management)','Bachelor Degree','APPROVED'),
    (6,'th','ผู้จัดการอาวุโส','ประสบการณ์ 10+ ปี (ด้านบริหาร 4+ ปี)','ปริญญาตรี','DRAFT'),
    (6,'lo','ຜູ້ຈັດການອາວຸໂສ','ປະສົບການ 10+ ປີ (ດ້ານບໍລິຫານ 4+ ປີ)','ປະລິນຍາຕີ','DRAFT'),

    (7,'en','Mid Level Manager','8+ years (3+ management)','Bachelor Degree','APPROVED'),
    (7,'th','ผู้จัดการระดับกลาง','ประสบการณ์ 8+ ปี (ด้านบริหาร 3+ ปี)','ปริญญาตรี','DRAFT'),
    (7,'lo','ຜູ້ຈັດການລະດັບກາງ','ປະສົບການ 8+ ປີ (ດ້ານບໍລິຫານ 3+ ປີ)','ປະລິນຍາຕີ','DRAFT'),

    (8,'en','Junior Manager','6+ years (2+ management)','Bachelor Degree','APPROVED'),
    (8,'th','ผู้จัดการระดับต้น','ประสบการณ์ 6+ ปี (ด้านบริหาร 2+ ปี)','ปริญญาตรี','DRAFT'),
    (8,'lo','ຜູ້ຈັດການລະດັບຕົ້ນ','ປະສົບການ 6+ ປີ (ດ້ານບໍລິຫານ 2+ ປີ)','ປະລິນຍາຕີ','DRAFT'),

    (9,'en','Team Leader / Supervisor / Assistant Secretary','5+ years','Associate Degree','APPROVED'),
    (9,'th','หัวหน้าทีม / หัวหน้างาน / ผู้ช่วยเลขานุการ','ประสบการณ์ 5+ ปี','อนุปริญญา','DRAFT'),
    (9,'lo','ຫົວໜ້າທີມ / ຫົວໜ້າງານ / ຜູ້ຊ່ວຍເລຂານຸການ','ປະສົບການ 5+ ປີ','ອະນຸປະລິນຍາ','DRAFT'),

    (10,'en','Specialist / Expert','4+ years','Associate Degree','APPROVED'),
    (10,'th','ผู้เชี่ยวชาญ / ผู้ชำนาญการ','ประสบการณ์ 4+ ปี','อนุปริญญา','DRAFT'),
    (10,'lo','ຜູ້ຊ່ຽວຊານ / ຜູ້ຊຳນານການ','ປະສົບການ 4+ ປີ','ອະນຸປະລິນຍາ','DRAFT'),

    (11,'en','Senior Officer','3+ years','Associate Degree','APPROVED'),
    (11,'th','เจ้าหน้าที่อาวุโส','ประสบการณ์ 3+ ปี','อนุปริญญา','DRAFT'),
    (11,'lo','ເຈົ້າໜ້າທີ່ອາວຸໂສ','ປະສົບການ 3+ ປີ','ອະນຸປະລິນຍາ','DRAFT'),

    (12,'en','Mid Level Officer','2+ years','Associate Degree','APPROVED'),
    (12,'th','เจ้าหน้าที่ระดับกลาง','ประสบการณ์ 2+ ปี','อนุปริญญา','DRAFT'),
    (12,'lo','ເຈົ້າໜ້າທີ່ລະດັບກາງ','ປະສົບການ 2+ ປີ','ອະນຸປະລິນຍາ','DRAFT'),

    (13,'en','Junior Officer / Housekeeper','0-1 year','Associate Degree','APPROVED'),
    (13,'th','เจ้าหน้าที่ระดับต้น / แม่บ้าน','ประสบการณ์ 0-1 ปี','อนุปริญญา','DRAFT'),
    (13,'lo','ເຈົ້າໜ້າທີ່ລະດັບຕົ້ນ / ແມ່ບ້ານ','ປະສົບການ 0-1 ປີ','ອະນຸປະລິນຍາ','DRAFT'),

    (14,'en','Intern','Fresh learner','Associate Degree','APPROVED'),
    (14,'th','ผู้ฝึกงาน','ผู้เริ่มต้น','อนุปริญญา','DRAFT'),
    (14,'lo','ນັກຝຶກງານ','ຜູ້ເລີ່ມຕົ້ນ','ອະນຸປະລິນຍາ','DRAFT')
) AS v(
  grade_number,
  locale,
  name,
  experience_requirement,
  education_requirement,
  status
)
JOIN job_grades g ON g.grade_number = v.grade_number
ON CONFLICT (job_grade_id, locale)
DO UPDATE SET
  name = EXCLUDED.name,
  experience_requirement = EXCLUDED.experience_requirement,
  education_requirement = EXCLUDED.education_requirement,
  translation_status = EXCLUDED.translation_status,
  updated_at = NOW();
