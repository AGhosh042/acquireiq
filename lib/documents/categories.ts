import { DocumentCategory } from "@/lib/types";

export type DocumentCategoryConfig = {
  id: DocumentCategory;
  label: string;
  description: string;
  examples: string;
  required: boolean;
};

export const documentCategories: DocumentCategoryConfig[] = [
  {
    id: "cim",
    label: "CIM / Teaser",
    description: "Business overview, broker package, investor deck, or seller memo.",
    examples: "CIM, teaser, pitch deck, broker deck",
    required: true
  },
  {
    id: "financials",
    label: "Financials",
    description: "Core underwriting materials for revenue, margins, EBITDA/SDE, and add-backs.",
    examples: "P&L, balance sheet, cash flow, monthly financials, Excel model",
    required: true
  },
  {
    id: "customers",
    label: "Customers & Revenue",
    description: "Customer concentration, churn, cohorts, contracts, and recurring revenue support.",
    examples: "customer export, revenue by customer, churn report, contract list",
    required: true
  },
  {
    id: "legal",
    label: "Legal / Contracts",
    description: "Agreements that may create assignment, consent, or change-of-control issues.",
    examples: "leases, vendor agreements, customer contracts, licenses",
    required: false
  },
  {
    id: "tax",
    label: "Tax",
    description: "Returns and tax schedules used to verify reported earnings and liabilities.",
    examples: "tax returns, sales tax filings, payroll tax reports",
    required: false
  },
  {
    id: "hr",
    label: "HR / Payroll",
    description: "Employee, compensation, benefits, and retention diligence materials.",
    examples: "payroll register, org chart, employee census, benefits",
    required: false
  },
  {
    id: "operations",
    label: "Operations",
    description: "Materials that explain how the business runs day to day.",
    examples: "SOPs, location data, vendor list, equipment, workflows",
    required: false
  },
  {
    id: "other",
    label: "Other",
    description: "Supporting materials that do not fit the standard diligence sections.",
    examples: "miscellaneous notes, market research, screenshots",
    required: false
  }
];

export function documentCategoryLabel(category?: DocumentCategory) {
  return documentCategories.find((item) => item.id === category)?.label ?? "Other";
}

export function inferDocumentCategory(fileName: string): DocumentCategory {
  const lower = fileName.toLowerCase();
  if (/(cim|teaser|deck|memo|overview|broker|pitch)/.test(lower)) return "cim";
  if (/(financial|p&l|pnl|profit|balance|cash flow|ebitda|sde|model|statement|revenue)/.test(lower)) return "financials";
  if (/(customer|client|churn|cohort|retention|contract list|arr|mrr)/.test(lower)) return "customers";
  if (/(legal|contract|lease|license|consent|nda|loi|agreement)/.test(lower)) return "legal";
  if (/(tax|return|irs|sales tax|payroll tax)/.test(lower)) return "tax";
  if (/(hr|payroll|employee|benefits|compensation|org chart|census)/.test(lower)) return "hr";
  if (/(operation|sop|vendor|equipment|facility|location|workflow|inventory)/.test(lower)) return "operations";
  return "other";
}
