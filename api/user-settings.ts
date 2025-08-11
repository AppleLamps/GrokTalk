import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromAuthHeader } from '../src/lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authUser = await getUserFromAuthHeader(req.headers.authorization as string | undefined);
  if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseAdmin();

  try {
    // First, get the user's integer ID from the users table using their email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', authUser.email)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    const userId = userData.id;

    if (req.method === 'GET') {
      // Get user settings from database or return defaults
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to fetch user settings' });
      }

      // Return settings or defaults based on actual table structure
      const settings = data || {
        model_temperature: 0.7,
        max_tokens: 8192,
        current_model: 'x-ai/grok-4',
        theme: 'system',
        draft_project: null,
        active_project_id: null
      };

      return res.json(settings);
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const settings = req.body;
      
      // Filter settings to only include valid columns
      const validSettings: any = {};
      const allowedFields = ['model_temperature', 'max_tokens', 'current_model', 'theme', 'draft_project', 'active_project_id'];
      
      for (const field of allowedFields) {
        if (settings[field] !== undefined) {
          validSettings[field] = settings[field];
        }
      }

      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...validSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Failed to save user settings' });
      }

      return res.json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('User settings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}