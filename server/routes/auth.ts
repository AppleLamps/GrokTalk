import express from 'express';
import { getSupabaseAdmin } from '../../src/lib/supabaseServer';
import { hashPassword, verifyPassword, generateToken } from '../../src/lib/auth';
import { getSupabaseAdmin } from '../../src/lib/supabaseServer';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || null }
    });
    if (error || !data?.user) {
      return res.status(400).json({ error: error?.message || 'Failed to create user' });
    }
    const token = generateToken(data.user.id);

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
          id: data.user.id,
          email: data.user.email,
          name: (data.user.user_metadata as any)?.name || null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken(data.user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
          id: data.user.id,
          email: data.user.email,
          name: (data.user.user_metadata as any)?.name || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const authHeader = req.headers.authorization as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.substring(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Unauthorized' });
    const u = data.user;
    res.json({ user: { id: u.id, email: u.email, name: (u.user_metadata as any)?.name || null, createdAt: u.created_at } });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const authHeader = req.headers.authorization as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.substring(7);
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return res.status(401).json({ error: 'Unauthorized' });
    const { name, email } = req.body;

    // Update metadata and optionally email
    const updates: any = { data: { name } };
    if (email) updates.email = email;
    const { data, error } = await supabase.auth.admin.updateUserById(userData.user.id, updates);
    if (error || !data?.user) return res.status(500).json({ error: 'Failed to update profile' });
    const u = data.user;
    res.json({ message: 'Profile updated successfully', user: { id: u.id, email: u.email, name: (u.user_metadata as any)?.name || null, updatedAt: u.updated_at } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;