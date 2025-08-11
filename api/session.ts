import { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserFromAuthHeader } from '../src/lib/supabaseServer';

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

    // Return session information
    return res.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email
      },
      authenticated: true
    });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}