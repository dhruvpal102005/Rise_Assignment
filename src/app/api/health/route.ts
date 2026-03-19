import { NextResponse } from 'next/server';

const startTime = Date.now();

export async function GET() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  // In a real environment, pending_count might come from a queue or cache
  // For this assignment, we'll return a placeholder or real count if possible.
  return NextResponse.json({
    status: 'healthy',
    pending_count: 0, 
    uptime_seconds: uptime,
  });
}
