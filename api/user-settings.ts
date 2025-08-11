import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromAuthHeader } from '../src/lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authUser = await getUserFromAuthHeader(req.headers.authorization as string | undefined);
  if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    try {
      // Get user settings from database or return defaults
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to fetch user settings' });
      }

      // Return settings or defaults
      const settings = data || {
        theme: 'dark',
        language: 'en',
        notifications: true
      };

      return res.json(settings);
    } catch (error) {
      console.error('User settings error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const settings = req.body;
      
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: authUser.id,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to save user settings' });
      }

      return res.json(data);
    } catch (error) {
      console.error('User settings error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}