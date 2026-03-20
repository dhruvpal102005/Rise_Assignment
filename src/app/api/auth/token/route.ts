import { NextResponse } from 'next/server';
import { generateToken } from '@/lib/auth';
import { findUserByEmail } from '@/lib/queries';

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found. Please run: npm run db:seed' }, { status: 404 });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role as 'Admin' | 'Customer',
    });

    return NextResponse.json({ token });
  } catch (err: any) {
    console.error('Auth token error:', err);
    return NextResponse.json({ 
      error: 'Database connection failed. Please check DATABASE_URL in .env',
      details: err.message 
    }, { status: 500 });
  }
}
