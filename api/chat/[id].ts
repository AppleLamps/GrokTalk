import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromAuthHeader } from '../../src/lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = (req.query as any).id as string;
  if (!id) return res.status(400).json({ error: 'Chat id required' });

  // CORS
  const defaultFrontendUrl = 'https://grok-talk.vercel.app';
  const allowedOrigins = [process.env.FRONTEND_URL || defaultFrontendUrl, defaultFrontendUrl];
  const requestOrigin = (req.headers.origin as string) || '';
  const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authUser = await getUserFromAuthHeader(req.headers.authorization as string | undefined);
  if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('chat_history')
      .select('id, title, messages, updatedAt:updated_at, projectId:project_id')
      .eq('id', id)
      .eq('user_id', authUser.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Chat not found' });
    const row = {
      id: data.id,
      title: data.title,
      messages: typeof data.messages === 'string' ? data.messages : JSON.stringify(data.messages || []),
      updatedAt: data.updatedAt,
      projectId: data.projectId || null,
    };
    return res.json(row);
  }

  if (req.method === 'PUT') {
    const { title, messages, projectId } = req.body || {};
    const update: any = {};
    if (title !== undefined) update.title = title;
    if (messages !== undefined) update.messages = messages;
    if (projectId !== undefined) update.project_id = projectId;
    const { data, error } = await supabase
      .from('chat_history')
      .update(update)
      .eq('id', id)
      .eq('user_id', authUser.id)
      .select('id, title, messages, updatedAt:updated_at, projectId:project_id')
      .single();
    if (error || !data) return res.status(404).json({ error: 'Chat not found' });
    const row = {
      id: data.id,
      title: data.title,
      messages: typeof data.messages === 'string' ? data.messages : JSON.stringify(data.messages || []),
      updatedAt: data.updatedAt,
      projectId: data.projectId || null,
    };
    return res.json(row);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('id', id)
      .eq('user_id', authUser.id);
    if (error) return res.status(500).json({ error: 'Failed to delete chat' });
    return res.json({ message: 'Chat deleted successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


