import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../src/lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  const defaultFrontendUrl = 'https://grok-talk.vercel.app';
  const allowedOrigins = [process.env.FRONTEND_URL || defaultFrontendUrl, defaultFrontendUrl];
  const requestOrigin = (req.headers.origin as string) || '';
  const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = authHeader.substring(7);

  const supabase = getSupabaseAdmin();
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return res.status(401).json({ error: 'Unauthorized' });

  const { name, email } = req.body as { name?: string; email?: string };
  const updates: any = { data: { name } };
  if (email) updates.email = email;
  const { data, error } = await supabase.auth.admin.updateUserById(userData.user.id, updates);
  if (error || !data?.user) return res.status(500).json({ error: 'Failed to update profile' });
  const u = data.user;
  return res.json({ id: u.id, email: u.email, name: (u.user_metadata as any)?.name || null, updatedAt: u.updated_at });
}


