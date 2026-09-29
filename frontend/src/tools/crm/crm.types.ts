export type CRMTab = "my-day" | "my-leads" | "pipeline" | "performance" | "commission";

export type BusinessUnitCode = string;

export type CRMDataMode = "REAL" | "QA_DEMO";

export type CRMDealProductLineInput = {
  productCode: string;
  quantity: number;
  unitPrice: number;
};

export type CRMDealProductLine = CRMDealProductLineInput & {
  id: string;
  productName: string;
  pointType: "SOFTWARE" | "HARDWARE";
  category?: string;
  unitLabel?: string;
  inventoryManaged: boolean;
  lineValue: number;
};

export type CRMPointRecognition = {
  recognizedAt: string;
  period: string;
  swPoints: number;
  hwPoints: number;
  amountLAK: number;
  commissionPlanName?: string;
  lineSnapshots: Array<{
    productCode: string;
    productName: string;
    pointType: "SOFTWARE" | "HARDWARE";
    quantity: number;
    pointsPerUnit: number;
    totalPoints: number;
  }>;
};

export type BusinessUnitFilter = string;

export type CRMBusinessUnit = {
  id: string;
  code: string;
  name: string;
  status: string;
};

export type LeadSource =
  | "EVENT" | "FACEBOOK" | "WEBSITE" | "REFERRAL" | "PARTNER"
  | "WALK_IN" | "OUTBOUND" | "IMPORT" | "OTHER" | "OWN_LEAD";

export type LeadStatus =
  | "UNASSIGNED" | "NEW" | "ASSIGNED" | "CONTACTED"
  | "FOLLOW_UP" | "CONVERTED" | "LOST";

export type ActivityType =
  | "CALL" | "VISIT" | "MEETING" | "DEMO" | "FOLLOW_UP"
  | "QUOTATION" | "CONTRACT" | "PAYMENT";

export type ActivityStatus =
  | "SCHEDULED" | "COMPLETED" | "OVERDUE" | "RESCHEDULED" | "CANCELLED";

export type DealStage =
  | "NEW_DEAL" | "DEMO" | "QUOTATION" | "NEGOTIATION"
  | "CONTRACT" | "AWAITING_PAYMENT" | "CLOSED_WON" | "CLOSED_LOST";

export type MyDayBucket = "TODAY" | "OVERDUE" | "NO_NEXT" | "NEW_LEAD";
export type DealCurrency = "LAK" | "USD" | "THB";

export type CRMLead = {
  id: string;
  storeName: string;
  legalCompanyName?: string;
  individualName?: string;
  primaryContact: string;
  phone: string;
  email?: string;
  whatsapp?: string;
  province: string;
  source: LeadSource;
  sourceDetail?: string;
  businessUnit: BusinessUnitCode;
  businessUnitName?: string;
  project?: string;
  campaign?: string;
  owner: string;
  ownerUserId?: string;
  status: LeadStatus;
  nextActivity?: ActivityType;
  nextActivityAt?: string;
  note?: string;
  lostReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CRMActivity = {
  id: string;
  type: ActivityType;
  subject: string;
  purposeCode?: string;
  purposeDetail?: string;
  relatedName: string;
  relatedType: "LEAD" | "DEAL";
  leadCode?: string;
  dealCode?: string;
  primaryContact?: string;
  businessUnit: BusinessUnitCode;
  businessUnitName?: string;
  owner: string;
  ownerUserId?: string;
  scheduledAt: string;
  status: ActivityStatus;
  storedStatus?: Exclude<ActivityStatus, "OVERDUE">;
  bucket?: MyDayBucket;
  outcome?: string;
  note?: string;
  resultNote?: string;
  rescheduleReason?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  quotationNumber?: string;
};

export type CRMDeal = {
  id: string;
  sourceLeadCode?: string;
  storeName: string;
  primaryContact?: string;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  customerLinkedAt?: string;
  businessUnit: BusinessUnitCode;
  businessUnitName?: string;
  owner: string;
  ownerUserId?: string;
  stage: DealStage;
  value: number;
  currency: DealCurrency;
  expectedCloseDate?: string;
  packageCode?: string;
  licenseQuantity: number;
  softwareValue: number;
  hardwareValue: number;
  productNote?: string;
  nextActivity?: ActivityType;
  nextActivityAt?: string;
  quotationNumber?: string;
  quotationConfirmed?: boolean;
  paymentSlipUploaded?: boolean;
  financePaymentConfirmed?: boolean;
  invoiceNumber?: string;
  productLines?: CRMDealProductLine[];
  pointRecognition?: CRMPointRecognition;
  lostReason?: string;
  closedWonAt?: string;
  closedLostAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CRMLeadCreatePayload = {
  businessUnitCode: string;
  storeName: string;
  primaryContact: string;
  phone: string;
  province: string;
  source: LeadSource;
  sourceDetail?: string;
  email?: string;
  whatsapp?: string;
  allowDuplicate?: boolean;
  assignmentMode?: "SELF" | "UNASSIGNED";
};

export type CRMLeadAssignmentPayload = {
  ownerUserId: string | null;
};

export type CRMDealConvertPayload = {
  currency?: DealCurrency;
  description?: string;
  expectedCloseDate?: string;
  productNote?: string;
  productLines: CRMDealProductLineInput[];
  // Legacy commercial fields remain optional for backward compatibility only.
  value?: number;
  packageCode?: string;
  licenseQuantity?: number;
  softwareValue?: number;
  hardwareValue?: number;
};

export type CRMDealUpdatePayload = {
  currency?: DealCurrency;
  expectedCloseDate?: string;
  productNote?: string;
};

export type CRMDealStagePayload = {
  stage: DealStage;
  lostReason?: string;
  reason?: string;
};

export type CRMActivityCreatePayload = {
  type: ActivityType;
  purposeCode: string;
  purposeDetail?: string;
  scheduledAt: string;
  note?: string;
};

export type CRMActivityCompletePayload = {
  outcome: string;
  resultNote: string;
  nextActivity?: CRMActivityCreatePayload;
  dealStage?: DealStage;
  stageReason?: string;
  lostReason?: string;
};

export type CRMActivityReschedulePayload = {
  scheduledAt: string;
  reason: string;
};

export type CRMPerformance = {
  period: string;
  pointTarget: {
    swPoints: number;
    revenue: number;
    currency: DealCurrency;
    source: "USER" | "TEAM" | "BU" | "BU_DEFAULT" | "NOT_APPLICABLE";
  };
  pointAchievement: {
    swPoints: number | null;
    hwPoints: number | null;
    rate: number | null;
    remaining: number | null;
    status: "PENDING_PRODUCT_LINES" | "READY";
  };
  operational: {
    wonLicenses: number;
    wonDeals: number;
    wonValue: Record<DealCurrency, number>;
  };
  funnel: {
    newLeads: number;
    convertedLeads: number;
    dealsCreated: number;
    wonDeals: number;
    leadToDealRate: number;
    dealToWonRate: number;
  };
  activity: {
    completed: number;
    overdue: number;
  };
};

export type CRMCommissionStatus = "PROJECTED" | "PENDING" | "CONFIRMED" | "PAID" | "VOID";

export type CRMCommissionItem = {
  dealCode: string;
  storeName: string;
  packageCode?: string;
  licenseQuantity: number;
  softwareValue: number;
  hardwareValue: number;
  softwareRate: number;
  hardwareRate: number;
  amount: number;
  currency: DealCurrency;
  dealStage: DealStage;
  status: CRMCommissionStatus;
  financeReference?: string;
  payrollReference?: string;
  confirmedAt?: string;
  paidAt?: string;
};

export type CRMCommissionSummary = {
  period: string;
  recognitionStatus: "PENDING_PRODUCT_LINES" | "READY";
  recognized: {
    swPoints: number | null;
    hwPoints: number | null;
    amountLAK: number | null;
  };
  wonDeals: number;
  effectivePlan: CRMCommissionPlanSetting | null;
  message: string;
};

export type CRMRoleDefinition = {
  code: string;
  name: string;
  description?: string;
  accessLevel: number;
  dataScope: "SELF" | "TEAM" | "BU" | "MULTI_BU" | "ALL";
  capabilities: string[];
  isSystem: boolean;
};

export type CRMAccessMembership = {
  membershipId: string;
  businessUnitId: string;
  businessUnit: string;
  businessUnitName: string;
  status: "ACTIVE" | "INACTIVE";
  effectiveFrom: string;
  effectiveTo?: string;
  roles: Array<Pick<CRMRoleDefinition, "code" | "name" | "accessLevel" | "dataScope" | "capabilities">>;
};

export type CRMAccessProfile = {
  userId?: string;
  isSuperAdmin: boolean;
  memberships: CRMAccessMembership[];
  canViewSettings: boolean;
};

export type CRMSettingsUser = {
  id: string;
  email: string;
  employeeCode?: string;
  name: string;
};

export type CRMBUMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  employeeCode?: string;
  status: "ACTIVE" | "INACTIVE";
  effectiveFrom: string;
  effectiveTo?: string;
  roleCodes: string[];
  teamIds: string[];
};

export type CRMSalesTeam = {
  id: string;
  teamCode: string;
  name: string;
  managerUserId?: string;
  managerName?: string;
  status: "ACTIVE" | "INACTIVE";
  memberCount: number;
};

export type CRMPipelineStageSetting = {
  stageCode: DealStage;
  label: string;
  position: number;
  isEnabled: boolean;
  isSystemControlled: boolean;
};

export type CRMProductOption = {
  id?: string;
  productCode: string;
  productName: string;
  pointType: "SOFTWARE" | "HARDWARE";
  category?: string;
  unitLabel?: string;
  inventoryManaged: boolean;
  defaultUnitPrice?: number;
  currency?: DealCurrency;
  description?: string;
  source: "TEMPORARY_SEED" | "EXISTING_POINT_RULE" | "PRODUCT_MASTER";
  status: "ACTIVE" | "INACTIVE";
};

export type CRMProductMasterPayload = {
  productId?: string;
  productName: string;
  productType: "SOFTWARE" | "HARDWARE";
  category?: string;
  unitLabel?: string;
  inventoryManaged: boolean;
  defaultUnitPrice: number;
  currency: DealCurrency;
  status: "ACTIVE" | "INACTIVE";
  description?: string;
};

export type CRMCustomerMaster = {
  id: string;
  customerCode: string;
  displayName: string;
  legalCompanyName?: string;
  customerType: "BUSINESS" | "INDIVIDUAL";
  primaryContact?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  province?: string;
  status: "ACTIVE" | "INACTIVE";
  note?: string;
  dealCount: number;
  wonDealCount: number;
  wonValueLAK: number;
};

export type CRMCustomerDealCreatePayload = CRMDealConvertPayload;

export type CRMCustomerMasterPayload = {
  customerId?: string;
  displayName: string;
  legalCompanyName?: string;
  customerType: "BUSINESS" | "INDIVIDUAL";
  primaryContact?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  province?: string;
  status: "ACTIVE" | "INACTIVE";
  note?: string;
};

export type CRMPointRule = {
  id: string;
  productCode: string;
  productName: string;
  pointType: "SOFTWARE" | "HARDWARE";
  category?: string;
  unitLabel?: string;
  pointsPerUnit: number;
  locked: boolean;
};

export type CRMSalesPointTarget = {
  id: string;
  teamId?: string;
  teamName?: string;
  ownerUserId?: string;
  ownerName?: string;
  targetSWPoints: number;
  targetRevenue: number;
  currency: DealCurrency;
  locked: boolean;
};

export type CRMCommissionTier = {
  id?: string;
  tierCode: string;
  name: string;
  minSWPoints: number;
  maxSWPoints: number | null;
  lakPerSWPoint: number;
  position: number;
};

export type CRMCommissionPlanSetting = {
  id: string;
  scopeType: "BU" | "TEAM" | "USER";
  teamId?: string;
  teamName?: string;
  ownerUserId?: string;
  ownerName?: string;
  name: string;
  modelType: string;
  hardwareLAKPerPoint: number;
  status: "OPEN" | "LOCKED" | "INACTIVE";
  ruleSource?: string;
  sourcePeriod?: string;
  isTemplate?: boolean;
  locked: boolean;
  tiers: CRMCommissionTier[];
};

export type CRMBUSettingsSnapshot = {
  businessUnit: CRMBusinessUnit;
  period: string;
  periodLocked: boolean;
  general: {
    status: "ACTIVE" | "INACTIVE";
    currency: DealCurrency;
    timezone: string;
    defaultSWPointTarget: number;
  };
  users: CRMSettingsUser[];
  roles: CRMRoleDefinition[];
  members: CRMBUMember[];
  teams: CRMSalesTeam[];
  pipelineStages: CRMPipelineStageSetting[];
  productOptions: CRMProductOption[];
  customerMaster: CRMCustomerMaster[];
  pointRules: CRMPointRule[];
  targets: CRMSalesPointTarget[];
  commissionPlans: CRMCommissionPlanSetting[];
};
