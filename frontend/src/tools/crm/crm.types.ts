export type CRMTab = "my-day" | "my-leads" | "activities" | "pipeline";

export type BusinessUnitCode = string;
export type BusinessUnitFilter = string;

export type CRMBusinessUnit = {
  id: string;
  code: string;
  name: string;
  status: string;
};

export type LeadSource =
  | "EVENT"
  | "FACEBOOK"
  | "WEBSITE"
  | "REFERRAL"
  | "PARTNER"
  | "WALK_IN"
  | "OUTBOUND"
  | "IMPORT"
  | "OTHER"
  | "OWN_LEAD";

export type LeadStatus =
  | "UNASSIGNED"
  | "NEW"
  | "ASSIGNED"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "CONVERTED"
  | "LOST";

export type ActivityType =
  | "CALL"
  | "VISIT"
  | "MEETING"
  | "DEMO"
  | "FOLLOW_UP"
  | "QUOTATION"
  | "CONTRACT"
  | "PAYMENT";

export type ActivityStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "OVERDUE"
  | "RESCHEDULED"
  | "CANCELLED";

export type DealStage =
  | "NEW_DEAL"
  | "DEMO"
  | "QUOTATION"
  | "NEGOTIATION"
  | "CONTRACT"
  | "PAYMENT"
  | "CLOSED_WON"
  | "CLOSED_LOST";

export type MyDayBucket = "TODAY" | "OVERDUE" | "NO_NEXT" | "NEW_LEAD";

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
  relatedName: string;
  relatedType: "LEAD" | "DEAL";
  businessUnit: BusinessUnitCode;
  owner: string;
  scheduledAt: string;
  status: ActivityStatus;
  bucket?: MyDayBucket;
  outcome?: string;
  note?: string;
  quotationNumber?: string;
};

export type CRMDeal = {
  id: string;
  storeName: string;
  businessUnit: BusinessUnitCode;
  owner: string;
  stage: DealStage;
  value: number;
  currency: "LAK" | "USD" | "THB";
  expectedCloseDate?: string;
  nextActivity?: ActivityType;
  nextActivityAt?: string;
  quotationNumber?: string;
  quotationConfirmed?: boolean;
  paymentSlipUploaded?: boolean;
  financePaymentConfirmed?: boolean;
  invoiceNumber?: string;
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
};
