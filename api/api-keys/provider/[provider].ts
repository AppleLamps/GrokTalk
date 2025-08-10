import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromAuthHeader } from '../../../src/lib/supabaseServer';
import { decryptApiKey } from '../../../src/lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const provider = (req.query as any).provider as string;
  const authUser = await getUserFromAuthHeader(req.headers.authorization as string | undefined);
  if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('id, name, provider, encrypted_key')
    .eq('user_id', authUser.id)
    .eq('provider', provider)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return res.status(404).json({ error: 'API key not found for this provider' });
  const keyValue = decryptApiKey((data as any).encrypted_key);
  return res.json({
    id: data.id,
    name: data.name,
    provider: data.provider,
    keyValue,
  });
}


