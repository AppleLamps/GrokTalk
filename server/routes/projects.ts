import express from 'express';
import { getUserFromToken } from '../../src/lib/auth';
import { getSupabaseAdmin } from '../../src/lib/supabaseServer';

const router = express.Router();

// Middleware to authenticate user
const authenticateUser = (req: any, res: any, next: any) => {
  const userInfo = getUserFromToken(req.headers.authorization);
  if (!userInfo) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.userId = userInfo.userId;
  next();
};

// Get all projects for the authenticated user
router.get('/', authenticateUser, async (req: any, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, instructions, conversation_starters, created_at, updated_at')
      .eq('user_id', req.userId)
      .order('updated_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Failed to fetch projects' });
    res.json({ projects: data });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get a specific project by ID
router.get('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;

    const supabase = getSupabaseAdmin();
    const { data: project, error } = await supabase
      .from('projects')
      .select('id, name, description, instructions, conversation_starters, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create a new project
router.post('/', authenticateUser, async (req: any, res) => {
  try {
    const { name, description, instructions, conversationStarters } = req.body;

    if (!name || !description || !instructions) {
      return res.status(400).json({ 
        error: 'Name, description, and instructions are required' 
      });
    }

    const supabase = getSupabaseAdmin();
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        instructions,
        conversation_starters: conversationStarters || [],
        user_id: req.userId,
      })
      .select('id, name, description, instructions, conversation_starters, created_at, updated_at')
      .single();
    if (error) return res.status(500).json({ error: 'Failed to create project' });

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project
router.put('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, description, instructions, conversationStarters } = req.body;

    // Check if project exists and belongs to user
    const supabase = getSupabaseAdmin();
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (conversationStarters !== undefined) updateData.conversation_starters = conversationStarters;

    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select('id, name, description, instructions, conversation_starters, created_at, updated_at')
      .single();
    if (error) return res.status(500).json({ error: 'Failed to update project' });

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
router.delete('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if project exists and belongs to user
    const supabase = getSupabaseAdmin();
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;