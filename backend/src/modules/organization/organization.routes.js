import { Router } from 'express';
import { requirePermission } from '../../middleware/auth.middleware.js';
import { reportingLinesRouter } from './reporting-lines/reporting-lines.routes.js';
import { organizationChartRouter } from './organization-chart/organization-chart.routes.js';
import {
  organizationMasterController,
  businessUnitsController,
  createBusinessUnitController,
  updateBusinessUnitController,
  deleteBusinessUnitController,
  jobLevelsController,
  jobGradesController,
  levelGradeStructureController,
  jobFamiliesController,
  positionsController,
  jobFamilyDetailController,
  createJobFamilyController,
  updateJobFamilyController,
  positionDetailController,
  createPositionController,
  updatePositionController,
} from './organization.controller.js';

export const organizationRouter = Router();

const requireOrganizationView = requirePermission('organization.master.view');
const requireOrganizationManage = requirePermission('organization.master.manage');

// Department remains reserved in the database architecture and is intentionally
// not exposed by the Organization API until the Department module is activated.
organizationRouter.get('/master', requireOrganizationView, organizationMasterController);
organizationRouter.get('/business-units', requireOrganizationView, businessUnitsController);
organizationRouter.post('/business-units', requireOrganizationManage, createBusinessUnitController);
organizationRouter.put('/business-units/:id', requireOrganizationManage, updateBusinessUnitController);
organizationRouter.delete('/business-units/:id', requireOrganizationManage, deleteBusinessUnitController);
organizationRouter.get('/job-levels', requireOrganizationView, jobLevelsController);
organizationRouter.get('/job-grades', requireOrganizationView, jobGradesController);
organizationRouter.get('/level-grades', requireOrganizationView, levelGradeStructureController);
organizationRouter.get('/job-families', requireOrganizationView, jobFamiliesController);
organizationRouter.get('/job-families/:id', requireOrganizationView, jobFamilyDetailController);
organizationRouter.post('/job-families', requireOrganizationManage, createJobFamilyController);
organizationRouter.put('/job-families/:id', requireOrganizationManage, updateJobFamilyController);
organizationRouter.get('/positions', requireOrganizationView, positionsController);
organizationRouter.get('/positions/:id', requireOrganizationView, positionDetailController);
organizationRouter.post('/positions', requireOrganizationManage, createPositionController);
organizationRouter.put('/positions/:id', requireOrganizationManage, updatePositionController);

// Reporting Lines use dedicated view/manage permissions because this is employee organization data, not master maintenance.
organizationRouter.use('/reporting-lines', reportingLinesRouter);

// Organization Chart is generated from Employee Assignment + Reporting Lines and is read-only for all Employees.
organizationRouter.use('/chart', organizationChartRouter);
