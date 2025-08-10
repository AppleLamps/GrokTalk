import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ntrkvocfspplizhaxoie.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50cmt2b2Nmc3BwbGl6aGF4b2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4NTY1ODksImV4cCI6MjA3MDQzMjU4OX0.c8m_hlO9GE2luuSXeyX1M3nc6oLwGrUPFjppD_Ree8E';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for Supabase operations
export const supabaseHelpers = {
  // Example: Get data from a table
  async getTableData(tableName: string) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
    
    return data;
  },

  // Example: Real-time subscription
  subscribeToTable(tableName: string, callback: (payload: any) => void) {
    return supabase
      .channel(`public:${tableName}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        callback
      )
      .subscribe();
  },

  // Example: Upload file to storage
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    
    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
    
    return data;
  },

  // Example: Get public URL for file
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
};

// Export the client as default for convenience
export default supabase;