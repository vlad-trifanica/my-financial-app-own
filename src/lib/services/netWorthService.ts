import { supabase } from '../supabase/supabaseClient';
import type { NetWorthRecord } from '../../types/financial';

export const netWorthService = {
  // Get net worth history for the current user
  async getNetWorthHistory() {
    const { data, error } = await supabase
      .from('net_worth_history')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },
  
  // Add a new net worth record
  async addNetWorthRecord(record: Omit<NetWorthRecord, 'id'>) {
    const { data, error } = await supabase
      .from('net_worth_history')
      .insert([record])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },
  
  // Get the latest net worth record
  async getLatestNetWorthRecord() {
    const { data, error } = await supabase
      .from('net_worth_history')
      .select('*')
      .order('date', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    return data?.[0];
  }
};