import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromAuthHeader } from '../../src/lib/supabaseServer';
import { encryptApiKey } from '../../src/lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authUser = await getUserFromAuthHeader(req.headers.authorization as string | undefined);
  if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('id, name, provider, created_at, updated_at')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch API keys' });
    return res.json({ apiKeys: data });
  }

  if (req.method === 'POST') {
    const { name, apiKey, keyValue, provider } = req.body || {};
    const rawKey = apiKey || keyValue;
    if (!name || !rawKey || !provider) {
      return res.status(400).json({ error: 'Name, API key, and provider are required' });
    }
    const encryptedKey = encryptApiKey(rawKey);
    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({ name, provider, encrypted_key: encryptedKey, user_id: authUser.id })
      .select('id, name, provider, created_at, updated_at')
      .single();
    if (error) return res.status(500).json({ error: 'Failed to create API key' });
    return res.status(201).json({ apiKey: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


