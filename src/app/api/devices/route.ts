import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllDevices } from '@/lib/queries';
import { headers } from 'next/headers';

export async function GET() {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user || user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const allDevices = await getAllDevices();

  return NextResponse.json(allDevices);
}
