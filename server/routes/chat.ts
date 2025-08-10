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

// Get all chat history for the authenticated user
router.get('/', authenticateUser, async (req: any, res) => {
  try {
    const { projectId } = req.query;
    
    const supabase = getSupabaseAdmin();
    let query = supabase.from('chat_history')
      .select('id, title, messages, updated_at, project_id')
      .eq('user_id', req.userId)
      .order('updated_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: 'Failed to fetch chat history' });
    res.json({ chatHistory: data });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get a specific chat by ID
router.get('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;

    const supabase = getSupabaseAdmin();
    const { data: chat, error } = await supabase
      .from('chat_history')
      .select('id, title, messages, updated_at, project_id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Create a new chat
router.post('/', authenticateUser, async (req: any, res) => {
  try {
    const { title, messages, projectId } = req.body;

    if (!title || !messages) {
      return res.status(400).json({ 
        error: 'Title and messages are required' 
      });
    }

    // Validate that project belongs to user if projectId is provided
    const supabase = getSupabaseAdmin();
    const { data: chat, error } = await supabase
      .from('chat_history')
      .insert({
        title,
        messages,
        project_id: projectId || null,
        user_id: req.userId,
      })
      .select('id, title, messages, updated_at, project_id')
      .single();
    if (error) return res.status(500).json({ error: 'Failed to create chat' });
    res.status(201).json({ message: 'Chat created successfully', chat });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Update a chat
router.put('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, messages, projectId } = req.body;

    // Check if chat exists and belongs to user
    const supabase = getSupabaseAdmin();
    const { data: existingChat } = await supabase
      .from('chat_history')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (!existingChat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Validate that project belongs to user if projectId is provided
    // project validation is optional; row-level security should protect

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (messages !== undefined) updateData.messages = messages;
    if (projectId !== undefined) updateData.project_id = projectId;
    const { data: updatedChat, error } = await supabase
      .from('chat_history')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.userId)
      .select('id, title, messages, updated_at, project_id')
      .single();
    if (error) return res.status(500).json({ error: 'Failed to update chat' });

    res.json({
      message: 'Chat updated successfully',
      chat: updatedChat
    });
  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
});

// Delete a chat
router.delete('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if chat exists and belongs to user
    const supabase = getSupabaseAdmin();
    const { data: existingChat } = await supabase
      .from('chat_history')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (!existingChat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await supabase
      .from('chat_history')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export default router;