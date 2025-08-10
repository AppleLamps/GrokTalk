import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../src/lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.substring(7);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Unauthorized' });
  const u = data.user;
  return res.json({ id: u.id, email: u.email, name: (u.user_metadata as any)?.name || null, createdAt: u.created_at });
}


