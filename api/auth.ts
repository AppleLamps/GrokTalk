import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromAuthHeader } from '../src/lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authUser = await getUserFromAuthHeader(req.headers.authorization as string | undefined);
    
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getSupabaseAdmin();
    
    // Get user data from your custom users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, email, created_at')
      .eq('email', authUser.email)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    return res.json({
      authenticated: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.username,
        created_at: userData.created_at
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}