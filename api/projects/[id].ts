import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromAuthHeader } from '../../src/lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = (req.query as any).id as string;
  if (!id) return res.status(400).json({ error: 'Project id required' });

  // CORS
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authUser = await getUserFromAuthHeader(req.headers.authorization as string | undefined);
  if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, instructions, conversation_starters, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', authUser.id)
      .single();
    if (error || !data) return res.status(404).json({ error: 'Project not found' });
    const project = {
      id: data.id,
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      conversationStarters: data.conversation_starters || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    return res.json(project);
  }

  if (req.method === 'PUT') {
    const { name, description, instructions, conversationStarters } = req.body || {};
    const update: any = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (instructions !== undefined) update.instructions = instructions;
    if (conversationStarters !== undefined) update.conversation_starters = conversationStarters;
    const { data, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', id)
      .eq('user_id', authUser.id)
      .select('id, name, description, instructions, conversation_starters, created_at, updated_at')
      .single();
    if (error || !data) return res.status(404).json({ error: 'Project not found' });
    const project = {
      id: data.id,
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      conversationStarters: data.conversation_starters || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    return res.json(project);
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', authUser.id);
    if (error) return res.status(500).json({ error: 'Failed to delete project' });
    return res.json({ message: 'Project deleted successfully' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


