import { supabase } from '../supabase/supabaseClient';
import type { FinancialEntry } from '../../types/financial';

export const assetService = {
  // Get all assets for the logged-in user
  async getAssets() {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },
  
  // Add a new asset
  async addAsset(asset: Omit<FinancialEntry, 'id'>) {
    const { data, error } = await supabase
      .from('assets')
      .insert([asset])
      .select();
    
    if (error) throw error;
    return data?.[0];
  },
  
  // Update an asset
  async updateAsset(id: string, updates: Partial<FinancialEntry>) {
    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data?.[0];
  },
  
  // Delete an asset
  async deleteAsset(id: string) {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};