import { supabase } from '../supabase/supabaseClient';
import type { FinancialEntry } from '../../types/financial';

export const debtService = {
  // Get all debts for the logged-in user
  async getDebts() {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },
  
  // Add a new debt
  async addDebt(debt: Omit<FinancialEntry, 'id'>) {
    const { data, error } = await supabase
      .from('debts')
      .insert([debt])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },
  
  // Update a debt
  async updateDebt(id: string, updates: Partial<FinancialEntry>) {
    const { data, error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },
  
  // Delete a debt
  async deleteDebt(id: string) {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};