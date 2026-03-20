import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { findDeviceByImei, getLocationLogsByImei } from '@/lib/queries';
import { headers } from 'next/headers';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ imei: string }> }
) {
  const { imei } = await params;
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const device = await findDeviceByImei(imei);

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  // RBAC: Admin sees all, Customer sees only their own
  if (user.role === 'Customer' && device.customerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const history = await getLocationLogsByImei(imei, 100);

  return NextResponse.json(history);
}
