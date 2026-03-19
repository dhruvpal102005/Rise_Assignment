'use client';

import { useEffect, useState, useRef } from 'react';
import { UserPayload } from '@/lib/auth';

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserPayload | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Setup sample token for demo if none exists
  useEffect(() => {
    const fetchToken = async () => {
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@example.com', role: 'Admin' }),
      });
      const data = await res.json();
      setToken(data.token);
      // Simple decode (don't use in prod without library)
      const payload = JSON.parse(atob(data.token.split('.')[1]));
      setUser(payload);
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (!token) return;

    const ws = new WebSocket(`ws://localhost:8080?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => [data, ...prev].slice(0, 100));
    };

    ws.onerror = (error) => console.error('WS Error:', error);

    return () => {
      ws.close();
    };
  }, [token]);

  return (
    <div className="dashboard-container">
      <header className="header">
        <div>
          <h1 style={{ margin: 0, background: 'linear-gradient(45deg, #fff, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Fleet Pulse Live
          </h1>
          <p style={{ color: '#888', margin: '4px 0' }}>Real-time GPS Tracking System</p>
        </div>
        <div className="glass-card" style={{ padding: '4px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="ping-anim"></div>
          <span className="status-badge">System Live</span>
        </div>
      </header>

      <div className="grid">
        <section className="glass-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
            Live Tracking Stream
          </h2>
          <div className="log-stream">
            {logs.length === 0 ? (
              <div style={{ color: '#555', textAlign: 'center', marginTop: '4rem' }}>Awaiting device pings...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="log-entry">
                  <span className="timestamp">[{new Date(log.data.timestamp || Date.now()).toLocaleTimeString()}]</span>
                  {log.event === 'tracker:live' ? (
                    <>
                      <span className="imei">{log.data.imei}</span>
                      <span className="coords">{log.data.lat.toFixed(4)}, {log.data.lng.toFixed(4)}</span>
                      <span style={{ color: '#10b981' }}>{log.data.speed} km/h</span>
                    </>
                  ) : (
                    <span style={{ color: '#ef4444' }}>Unknown Device: {log.data.imei}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="glass-card" style={{ height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Active User</h2>
          {user ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
              <div style={{ fontWeight: 'bold' }}>{user.email}</div>
              <div style={{ color: '#888', fontSize: '0.9rem' }}>Role: {user.role}</div>
            </div>
          ) : (
            <p>Loading user profile...</p>
          )}

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1rem', color: '#888' }}>Quick Links</h3>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.9rem' }}>
              <li style={{ margin: '8px 0' }}><a href="/api/health" style={{ color: 'var(--primary)', textDecoration: 'none' }}>→ Health Status</a></li>
              <li style={{ margin: '8px 0' }}><a href="/api/devices" style={{ color: 'var(--primary)', textDecoration: 'none' }}>→ Registered Devices</a></li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
