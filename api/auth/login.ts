import { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../src/lib/supabaseServer';
import applyCors from '../../src/lib/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
<<<<<<< HEAD
=======
  try {
    await applyCors(req, res);
  } catch (error) {
    console.error('CORS error:', error);
    return res.status(500).json({ error: 'Failed to apply CORS' });
  }

  // If `applyCors` handled the preflight OPTIONS request, we can exit early.
>>>>>>> 9facf0c76bdd5df12913356dcd563cf2426c4451
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Sign in via Supabase Auth with password
    const supabase = getSupabaseAdmin();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData?.session || !signInData.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      token: signInData.session.access_token,
      user: {
        id: signInData.user.id,
        email: signInData.user.email,
        name: (signInData.user.user_metadata as any)?.name || null,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}