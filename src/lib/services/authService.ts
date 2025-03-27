import { supabase } from '../supabase/supabaseClient';

// Helper function to ensure user exists in the 'users' table
async function ensureUserInTable(userId: string, email: string) {
  // Check if user already exists in the custom users table
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();
  
  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error checking user:', checkError);
    throw checkError;
  }
  
  // If user does not exist, create it
  if (!existingUser) {
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        { 
          id: userId,
          email: email,
          created_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString()
        }
      ]);
    
    if (insertError) {
      console.error('Error creating user record:', insertError);
      throw insertError;
    }
  }
}

export const authService = {
  // Sign up with email and password
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    // If sign up was successful and we have a user
    if (data.user) {
      try {
        await ensureUserInTable(data.user.id, email);
      } catch (err) {
        console.error('Error creating user record:', err);
        // We don't want to fail the sign-up if this fails
      }
    }
    
    return data;
  },
  
  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // If sign in was successful and we have a user
    if (data.user) {
      try {
        await ensureUserInTable(data.user.id, email);
      } catch (err) {
        console.error('Error ensuring user record:', err);
        // We don't want to fail the sign-in if this fails
      }
    }
    
    return data;
  },
  
  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },
  
  // Get the current session
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data;
  },
  
  // Get the current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }
};