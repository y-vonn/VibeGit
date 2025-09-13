import React, { useEffect, useState } from 'react';
import type { HealthResponse } from '@vibe/shared';

export default function App() {
  const [data, setData] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        status: 'ok',
        time: new Date().toISOString(),
        build: { version: '0.1.0-mock', time: new Date().toISOString() }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>VibeGit 前端 (Mock)</h1>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>加载中...</p>}
    </div>
  );
}
