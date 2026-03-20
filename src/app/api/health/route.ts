import { NextResponse } from 'next/server';
import { ingester } from '@/lib/ingester';

const startTime = Date.now();

export async function GET() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  return NextResponse.json({
    status: 'healthy',
    pending_count: ingester.pendingCount,
    uptime_seconds: uptime,
  });
}
