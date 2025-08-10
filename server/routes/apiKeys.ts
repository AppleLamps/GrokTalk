import express from 'express';
import { prisma } from '../../src/lib/db';
import { getUserFromToken, encryptApiKey, decryptApiKey } from '../../src/lib/auth';

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

// Get all API keys for the authenticated user
router.get('/', authenticateUser, async (req: any, res) => {
  try {
    const apiKeys = await prisma.userApiKey.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true
        // Note: We don't return the encrypted key for security
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ apiKeys });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Get a specific API key by ID (decrypted)
router.get('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;

    const apiKey = await prisma.userApiKey.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Decrypt the API key
    const decryptedKey = decryptApiKey(apiKey.encryptedKey);

    res.json({
      id: apiKey.id,
      name: apiKey.name,
      provider: apiKey.provider,
      apiKey: decryptedKey,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt
    });
  } catch (error) {
    console.error('Get API key error:', error);
    res.status(500).json({ error: 'Failed to fetch API key' });
  }
});

// Get API key by provider (for use in the app)
router.get('/provider/:provider', authenticateUser, async (req: any, res) => {
  try {
    const { provider } = req.params;

    const apiKey = await prisma.userApiKey.findFirst({
      where: {
        provider,
        userId: req.userId
      },
      orderBy: { updatedAt: 'desc' } // Get the most recently updated one
    });

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found for this provider' });
    }

    // Decrypt the API key
    const decryptedKey = decryptApiKey(apiKey.encryptedKey);

    res.json({
      id: apiKey.id,
      name: apiKey.name,
      provider: apiKey.provider,
      apiKey: decryptedKey
    });
  } catch (error) {
    console.error('Get API key by provider error:', error);
    res.status(500).json({ error: 'Failed to fetch API key' });
  }
});

// Create a new API key
router.post('/', authenticateUser, async (req: any, res) => {
  try {
    const { name, apiKey, provider } = req.body;

    if (!name || !apiKey || !provider) {
      return res.status(400).json({ 
        error: 'Name, API key, and provider are required' 
      });
    }

    // Encrypt the API key
    const encryptedKey = encryptApiKey(apiKey);

    const newApiKey = await prisma.userApiKey.create({
      data: {
        name,
        encryptedKey,
        provider,
        userId: req.userId
      },
      select: {
        id: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      message: 'API key created successfully',
      apiKey: newApiKey
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Update an API key
router.put('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { name, apiKey, provider } = req.body;

    // Check if API key exists and belongs to user
    const existingApiKey = await prisma.userApiKey.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existingApiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (provider !== undefined) updateData.provider = provider;
    if (apiKey !== undefined) {
      updateData.encryptedKey = encryptApiKey(apiKey);
    }

    const updatedApiKey = await prisma.userApiKey.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        provider: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'API key updated successfully',
      apiKey: updatedApiKey
    });
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Delete an API key
router.delete('/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if API key exists and belongs to user
    const existingApiKey = await prisma.userApiKey.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!existingApiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await prisma.userApiKey.delete({
      where: { id }
    });

    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;