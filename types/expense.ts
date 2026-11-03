export type ExpenseCategory = 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Other';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  spent_on: string; // YYYY-MM-DD
  note?: string;
  created_at: string;
}

