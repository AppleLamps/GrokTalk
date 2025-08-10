import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromAuthHeader } from '../../src/lib/supabaseServer';
import { encryptApiKey } from '../../src/lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = (req.query as any).id as string;
  if (!id) return res.status(400).json({ error: 'API key id required' });

  // CORS
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authUser = await getUserFromAuthHeader(req.headers.authorization as string | undefined);
  if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseAdmin();

  if (req.method === 'PUT') {
    const { name, keyValue, provider } = req.body || {};
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (provider !== undefined) update.provider = provider;
    if (keyValue !== undefined) update.encrypted_key = encryptApiKey(keyValue);
    const { data, error } = await supabase
      .from('user_api_keys')
      .update(update)
      .eq('id', id)
      .eq('user_id', authUser.id)
      .select('id, name, provider, created_at, updated_at')
      .single();
    if (error || !data) return res.status(404).json({ error: 'API key not found' });
    return res.json({ apiKey: data });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', authUser.id);
    if (error) return res.status(500).json({ error: 'Failed to delete API key' });
    return res.json({ message: 'API key deleted successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


