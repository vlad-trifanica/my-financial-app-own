export interface NetWorthRecord {
  id: string;
  user_id: string; // Changed back to snake_case to match DB schema
  date: string;
  total_assets: number;
  total_debts: number;
  net_worth: number;
  base_currency: string;
}

export interface ChartDataPoint {
  month: string;
  netWorth: number;
  baseCurrency: string;
}

export interface FinancialEntry {
  id: string;
  name: string;
  category: string;
  value: number;
  last_updated: string;
  comments?: string;
  currency: string;
  user_id?: string; // Changed back to snake_case to match DB schema
}
  
export interface DashboardSummary {
  total_assets: number;
  total_debts: number;
  net_worth: number;
  asset_allocation: { [category: string]: number };
  debt_allocation: { [category: string]: number };
}

export const ASSET_CATEGORIES = [
  'cash',
  'bank_deposit',
  'savings_account',
  'investment',
  'real_estate',
  'vehicle',
  'other'
] as const;
  
export type AssetCategory = typeof ASSET_CATEGORIES[number];

export const DEBT_CATEGORIES = [
  'credit_card',
  'student_loan',
  'mortgage',
  'auto_loan',
  'personal_loan',
  'medical_debt',
  'tax_debt',
  'other'
] as const;
  
export type DebtCategory = typeof DEBT_CATEGORIES[number];

// For backward compatibility and transition
export type Asset = FinancialEntry;
export type Debt = FinancialEntry;