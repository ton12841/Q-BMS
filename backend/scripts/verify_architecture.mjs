import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');

async function read(relative) {
  return fs.readFile(path.join(root, relative), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const rootPackage = JSON.parse(await read('package.json'));
const backendPackage = JSON.parse(await read('backend/package.json'));
const frontendPackage = JSON.parse(await read('frontend/package.json'));
const expectedVersion = '2.3.5.2';

assert(rootPackage.version === expectedVersion, 'Root package version is not synchronized.');
assert(backendPackage.version === expectedVersion, 'Backend package version is not synchronized.');
assert(frontendPackage.version === expectedVersion, 'Frontend package version is not synchronized.');

for (const [label, group] of [
  ['backend dependencies', backendPackage.dependencies || {}],
  ['frontend dependencies', frontendPackage.dependencies || {}],
  ['frontend devDependencies', frontendPackage.devDependencies || {}],
]) {
  for (const [name, version] of Object.entries(group)) {
    assert(version !== 'latest', `${label}: ${name} still uses latest.`);
  }
}

const organizationRoutes = await read('backend/src/modules/organization/organization.routes.js');
assert(!organizationRoutes.includes("'/departments'"), 'Department API is exposed while Department is HOLD.');
assert(organizationRoutes.includes("requirePermission('organization.master.view')"), 'Organization view permission guard is missing.');
assert(organizationRoutes.includes("requirePermission('organization.master.manage')"), 'Organization manage permission guard is missing.');

const organizationService = await read('backend/src/modules/organization/organization.service.js');
assert(!organizationService.includes('listDepartments'), 'Department data is still exposed through Organization service while HOLD.');
const organizationRepository = await read('backend/src/modules/organization/organization.repository.js');
assert(!organizationRepository.includes('listDepartments'), 'Department repository behavior remains active while Department is HOLD.');

const reviewService = await read('backend/src/tools/hrm/onboarding-review/onboarding-review.service.js');
assert(!reviewService.includes('employee-onboarding.repository'), 'HRM Onboarding Review imports Employee repository directly.');
assert(reviewService.includes('employee-onboarding.service'), 'HRM Onboarding Review must depend on Employee service.');

const workspaceRepo = await read('backend/src/workspace/employee/employee-workspace.repository.js');
assert(workspaceRepo.includes('employee_reporting_lines'), 'Employee Workspace does not resolve Manager from Reporting Lines.');
assert(workspaceRepo.includes('LEGACY_MANAGER_FALLBACK'), 'Temporary legacy Manager fallback marker is missing.');

const appShell = await read('frontend/src/components/layout/QBMSAppShell.tsx');
assert(appShell.includes('v2.3.5.2'), 'Frontend App Shell version is not v2.3.5.2.');
assert(appShell.includes('handleModulesToolsClickCapture'), 'Super Admin entry regression detected.');
assert(appShell.includes('!pathname?.startsWith("/super-admin")'), 'Super Admin active-state regression detected.');

const gitignore = await read('.gitignore');
for (const required of ['node_modules/', '.next/', '.env', '.qbms_patch_backup/', '.DS_Store']) {
  assert(gitignore.includes(required), `.gitignore missing ${required}`);
}

const obsoleteRootFiles = [
  'PATCH_INSTALL.sh',
  'PATCH_ROLLBACK.sh',
  'PATCH_LOGIN_FLASH.py',
  'PATCH_INSTRUCTIONS.md',
  'PATCH_INSTRUCTIONS.txt',
  '.qbms_last_patch_backup',
];
for (const relative of obsoleteRootFiles) {
  try {
    await fs.access(path.join(root, relative));
    throw new Error(`Obsolete root artifact still exists: ${relative}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

const reportingRoutes = await read('backend/src/modules/organization/reporting-lines/reporting-lines.routes.js');
assert(reportingRoutes.includes("organization.reporting_lines.view"), 'Reporting Lines view permission guard is missing.');
assert(reportingRoutes.includes("organization.reporting_lines.manage"), 'Reporting Lines manage permission guard is missing.');

const reportingService = await read('backend/src/modules/organization/reporting-lines/reporting-lines.service.js');
assert(reportingService.includes('wouldCreateReportingCycle'), 'Reporting Lines cycle detection is not active.');
assert(reportingService.includes('syncLegacyPrimaryManager'), 'Reporting Lines legacy compatibility synchronization is missing.');

const reportingRepository = await read('backend/src/modules/organization/reporting-lines/reporting-lines.repository.js');
assert(reportingRepository.includes("'REPORTING_LINE'"), 'Reporting Lines audit logging is missing.');
assert(reportingRepository.includes('employee_reporting_lines'), 'Reporting Lines repository is not using canonical table.');

const organizationPage = await read('frontend/src/modules/organization/components/OrganizationPageClient.tsx');
assert(organizationPage.includes('href: "/organization/reporting-lines"'), 'Organization Reporting Lines route card is missing.');
assert(organizationPage.includes('status: "ready"'), 'Organization Reporting Lines card is not READY.');


const employeeRoutes = await read('backend/src/modules/employee/employee.routes.js');
assert(employeeRoutes.includes("requirePermission('employee.master.view')"), 'Employee Master view permission guard is missing.');
assert(employeeRoutes.includes("requirePermission('employee.master.manage')"), 'Employee Master manage permission guard is missing.');
assert(employeeRoutes.includes('organization-assignments'), 'Employee Organization Assignment router is missing.');

const appJs = await read('backend/src/app.js');
assert(
  appJs.includes("app.use('/api/employees', employeeRouter);"),
  'Employee API is still globally coupled to onboarding permission.'
);

const employeeService = await read('backend/src/modules/employee/employee.service.js');
assert(
  employeeService.includes('EMPLOYEE_ASSIGNMENT_HISTORY_REQUIRED'),
  'Active Employee assignment history protection is missing.'
);
assert(
  employeeService.includes("existing.employee_status !== 'ACTIVE'"),
  'Employee Master still mutates ACTIVE organization assignments.'
);

const assignmentService = await read(
  'backend/src/modules/employee/organization-assignment/employee-assignment.service.js'
);
assert(
  assignmentService.includes('wouldCreateReportingCycle'),
  'Employee Assignment transition does not protect Reporting Line cycles.'
);
assert(
  assignmentService.includes('listActiveIncomingLines'),
  'Employee Assignment transition does not preserve subordinate reporting continuity.'
);
assert(
  assignmentService.includes('EMPLOYEE_ASSIGNMENT.TRANSITIONED'),
  'Employee Assignment audit event is missing.'
);

const assignmentRoutes = await read(
  'backend/src/modules/employee/organization-assignment/employee-assignment.routes.js'
);
assert(
  assignmentRoutes.includes('employee.organization_assignment.view'),
  'Employee Assignment view permission is missing.'
);
assert(
  assignmentRoutes.includes('employee.organization_assignment.manage'),
  'Employee Assignment manage permission is missing.'
);

const employeePage = await read(
  'frontend/src/modules/employee/components/EmployeePageClient.tsx'
);
assert(
  employeePage.includes('/organization-assignment'),
  'Employee Master Organization Assignment link is missing.'
);
assert(
  employeePage.includes('organizationAssignmentLocked'),
  'Employee Master active assignment UI lock is missing.'
);

const assignmentPage = await read(
  'frontend/src/modules/employee/organization-assignment/EmployeeOrganizationAssignmentPageClient.tsx'
);
assert(
  assignmentPage.includes('transitionEmployeeAssignment'),
  'Employee Organization Assignment transition UI is missing.'
);

const chartRoutes = await read(
  'backend/src/modules/organization/organization-chart/organization-chart.routes.js'
);
assert(
  chartRoutes.includes("organization.chart.view"),
  'Organization Chart view permission is missing.'
);

const chartRepository = await read(
  'backend/src/modules/organization/organization-chart/organization-chart.repository.js'
);
assert(
  chartRepository.includes("e.employee_status = 'ACTIVE'"),
  'Organization Chart is not limited to ACTIVE Employees.'
);
assert(
  chartRepository.includes('employee_reporting_lines'),
  'Organization Chart is not sourced from Reporting Lines.'
);

const chartService = await read(
  'backend/src/modules/organization/organization-chart/organization-chart.service.js'
);
assert(
  chartService.includes("generatedFrom: 'EMPLOYEE_ASSIGNMENT_AND_REPORTING_LINES'"),
  'Organization Chart source-of-truth contract is missing.'
);
assert(
  chartService.includes('readOnly: true'),
  'Organization Chart read-only contract is missing.'
);

const chartPage = await read(
  'frontend/src/modules/organization/organization-chart/OrganizationChartPageClient.tsx'
);
assert(chartPage.includes('READ ONLY'), 'Organization Chart read-only UI marker is missing.');
assert(chartPage.includes('visibleDottedEdges'), 'Organization Chart dotted reporting visualization is missing.');
assert(chartPage.includes('toggleCollapse'), 'Organization Chart expand/collapse behavior is missing.');

const workspacePage = await read(
  'frontend/src/workspace/employee/EmployeeWorkspacePageClient.tsx'
);
assert(
  workspacePage.includes('target="/organization/chart"'),
  'Employee Workspace Organization Chart entry is missing.'
);

const organizationHome = await read(
  'frontend/src/modules/organization/components/OrganizationPageClient.tsx'
);
assert(
  organizationHome.includes('href: "/organization/chart"'),
  'Organization Module Organization Chart card is missing.'
);




const qaRegistry = await read(
  'frontend/src/qa/module-data/qaModuleRegistry.ts'
);
for (const moduleKey of [
  'employee',
  'organization',
  'customer',
  'product',
  'supplier-vendor',
  'location-site',
  'asset',
  'document',
  'task-approval',
  'notification',
  'hrm',
  'inventory',
  'installation',
  'financial',
  'procurement',
  'management-dashboard',
  'crm',
  'it-admin',
  'super-admin',
]) {
  assert(
    qaRegistry.includes(`key: "${moduleKey}"`),
    `Platform QA registry is missing ${moduleKey}.`
  );
}

assert(
  appShell.includes('resolveQaModuleByPath'),
  'In-module QA Data Mode switch is missing from App Shell.'
);
assert(
  appShell.includes('QA Data Mode'),
  'App Shell QA Data Mode label is missing.'
);

const qaPage = await read(
  'frontend/src/qa/module-data/QaDataModePageClient.tsx'
);
assert(
  qaPage.includes('session?.sessionKind !== "DEVELOPMENT_PREVIEW"'),
  'QA Data Mode is not guarded by Development Preview.'
);
assert(
  qaPage.includes('Everything on this page is fictional QA sample data'),
  'QA sample-data disclosure is missing.'
);
assert(
  qaPage.includes('ORGANIZATION_QA_NODES'),
  'Organization QA populated hierarchy is missing.'
);

const modulesPage = await read(
  'frontend/src/components/pages/ModulesPageClient.tsx'
);
for (const canonicalHref of [
  '/module/customer',
  '/module/product',
  '/module/supplier-vendor',
  '/module/location-site',
  '/module/asset',
  '/module/document',
  '/module/task-approval',
  '/module/notification',
  '/module/inventory',
  '/module/installation',
  '/module/financial',
  '/module/procurement',
  '/module/management-dashboard',
  '/module/crm',
]) {
  assert(
    modulesPage.includes(canonicalHref),
    `Modules & Tools entry is missing ${canonicalHref}.`
  );
}

const qaRoute = await read(
  'frontend/src/app/qa-data/[moduleKey]/page.tsx'
);
assert(
  qaRoute.includes('QaDataModePageClient'),
  'QA Data Mode dynamic route is missing.'
);

const moduleLandingRoute = await read(
  'frontend/src/app/module/[moduleKey]/page.tsx'
);
assert(
  moduleLandingRoute.includes('ModuleLandingPageClient'),
  'Generic module real-data landing route is missing.'
);


const qaRuntimePage = await read(
  'frontend/src/qa/module-data/QaDataModePageClient.tsx'
);
assert(
  qaRuntimePage.includes('error instanceof DOMException && error.name === "AbortError"'),
  'QA Data Mode does not safely handle expected AbortError cleanup.'
);
assert(
  qaRuntimePage.includes('let active = true'),
  'QA Data Mode unmount guard is missing.'
);

const globalCss = await read('frontend/src/app/globals.css');
for (const typographyTokenName of [
  '--qbms-font-caption:',
  '--qbms-font-meta:',
  '--qbms-font-small:',
  '--qbms-font-body:',
  '--qbms-font-card-title:',
  '--qbms-font-section-title:',
  '--qbms-font-page-title:',
  '--qbms-font-display:',
]) {
  assert(
    globalCss.includes(typographyTokenName),
    `Platform typography token missing ${typographyTokenName}.`
  );
}

const backendLock = JSON.parse(await read('backend/package-lock.json'));
const frontendLock = JSON.parse(await read('frontend/package-lock.json'));
assert(backendLock.version === expectedVersion, 'Backend lockfile version is not synchronized.');
assert(backendLock.packages?.['']?.version === expectedVersion, 'Backend lock root package version is not synchronized.');
assert(frontendLock.version === expectedVersion, 'Frontend lockfile version is not synchronized.');
assert(frontendLock.packages?.['']?.version === expectedVersion, 'Frontend lock root package version is not synchronized.');


console.log('Q BMS architecture verification passed.');
