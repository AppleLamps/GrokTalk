import express from 'express';
import { prisma } from '../../src/lib/db';
import { getUserFromToken } from '../../src/lib/auth';

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
    
    const whereClause: any = { userId: req.userId };
    if (projectId) {
      whereClause.projectId = projectId;
    }

    const chatHistory = await prisma.chatHistory.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ chatHistory });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get a specific chat by ID
router.get('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;

    const chat = await prisma.chatHistory.findFirst({
      where: {
        id,
        userId: req.userId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

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
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: req.userId
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    const chat = await prisma.chatHistory.create({
      data: {
        title,
        messages,
        projectId: projectId || null,
        userId: req.userId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Chat created successfully',
      chat
    });
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
    const existingChat = await prisma.chatHistory.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existingChat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Validate that project belongs to user if projectId is provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: req.userId
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (messages !== undefined) updateData.messages = messages;
    if (projectId !== undefined) updateData.projectId = projectId;

    const updatedChat = await prisma.chatHistory.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

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
    const existingChat = await prisma.chatHistory.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existingChat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await prisma.chatHistory.delete({
      where: { id }
    });

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export default router;