import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '../../src/lib/supabaseServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const supabase = getSupabaseAdmin();

    // Create user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (signUpError || !signUpData?.user) {
      return res.status(400).json({ error: signUpError?.message || 'Failed to create user' });
    }

    // Immediately sign in to get an access token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData?.session || !signInData.user) {
      return res.status(201).json({
        message: 'User created successfully',
        user: { id: signUpData.user.id, email: signUpData.user.email, name },
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      token: signInData.session.access_token,
      user: {
        id: signInData.user.id,
        email: signInData.user.email,
        name: (signInData.user.user_metadata as any)?.name || name || null,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}