import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin, getUserFromAuthHeader } from '../../src/lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authUser = await getUserFromAuthHeader(req.headers.authorization as string | undefined);
  if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, instructions, conversation_starters, created_at, updated_at')
      .eq('user_id', authUser.id)
      .order('updated_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch projects' });
    const projects = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      instructions: p.instructions,
      conversationStarters: p.conversation_starters || [],
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
    return res.json(projects);
  }

  if (req.method === 'POST') {
    const { name, description, instructions, conversationStarters } = req.body || {};
    if (!name || !description || !instructions) {
      return res.status(400).json({ error: 'Name, description, and instructions are required' });
    }
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        instructions,
        conversation_starters: conversationStarters || [],
        user_id: authUser.id,
      })
      .select('id, name, description, instructions, conversation_starters, created_at, updated_at')
      .single();
    if (error) return res.status(500).json({ error: 'Failed to create project' });
    const project = {
      id: data!.id,
      name: data!.name,
      description: data!.description,
      instructions: data!.instructions,
      conversationStarters: data!.conversation_starters || [],
      createdAt: data!.created_at,
      updatedAt: data!.updated_at,
    };
    return res.status(201).json(project);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}


