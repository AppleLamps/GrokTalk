import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromAuthHeader } from '../../src/lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authUser = await getUserFromAuthHeader(req.headers.authorization as string | undefined);
  if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    const projectId = (req.query.projectId as string) || undefined;
    const query = supabase.from('chat_history')
      .select('id, title, messages, updatedAt:updated_at, projectId:project_id')
      .eq('user_id', authUser.id)
      .order('updated_at', { ascending: false });
    const { data, error } = projectId ? await query.eq('project_id', projectId) : await query;
    if (error) return res.status(500).json({ error: 'Failed to fetch chat history' });
    const rows = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      messages: typeof row.messages === 'string' ? row.messages : JSON.stringify(row.messages || []),
      updatedAt: row.updatedAt,
      projectId: row.projectId || null,
    }));
    return res.json(rows);
  }

  if (req.method === 'POST') {
    try {
      const { title, messages, projectId } = req.body || {};
      if (!title || !messages) return res.status(400).json({ error: 'Title and messages are required' });
      const payload = {
        title,
        messages,
        project_id: projectId || null,
        user_id: authUser.id,
      };
      const { data, error } = await supabase
        .from('chat_history')
        .insert(payload)
        .select('id, title, messages, updatedAt:updated_at, projectId:project_id')
        .single();
      if (error) return res.status(500).json({ error: 'Failed to create chat' });
      const row = {
        id: data!.id,
        title: data!.title,
        messages: typeof data!.messages === 'string' ? data!.messages : JSON.stringify(data!.messages || []),
        updatedAt: data!.updatedAt,
        projectId: data!.projectId || null,
      };
      return res.status(201).json(row);
    } catch {
      return res.status(500).json({ error: 'Failed to create chat' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


