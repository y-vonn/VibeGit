import React, { useEffect, useState, useMemo } from 'react';
import './timeline.css';

// Dynamically import all round JSON files under frontend/vibe
const roundModules = import.meta.glob('../vibe/round-*.json', { eager: true });

interface RawEvent {
  seq: number;
  ts: string; // ISO timestamp
  type: string;
  content?: string;
  path?: string;
  name?: string; // tool name
  args_summary?: string;
  meta?: Record<string, unknown>;
}

interface RoundFile {
  schema_version: string;
  round_id: string;
  session_id: string;
  started_at: string;
  ended_at: string;
  status: string;
  events: RawEvent[];
  stats?: Record<string, number>;
}

interface TimelineItem {
  id: string;
  ts: string;
  roundId: string;
  type: string;
  role: 'User' | 'Assistant' | 'System' | 'File' | 'Tool';
  title: string;
  details?: string;
  seq: number;
}

const classify = (e: RawEvent): { role: TimelineItem['role']; title: string; details?: string } => {
  switch (e.type) {
    case 'user_message':
      return { role: 'User', title: '用户', details: e.content };
    case 'assistant_message':
      return { role: 'Assistant', title: '助手', details: e.content };
    case 'file_view':
      return { role: 'File', title: '查看文件', details: e.path };    
    case 'file_write':
      return { role: 'File', title: '写入文件', details: e.path };    
    case 'tool_call':
      return { role: 'Tool', title: `工具调用: ${e.name}`, details: e.args_summary };
    default:
      return { role: 'System', title: e.type, details: e.content };
  }
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const groupByRound = (items: TimelineItem[]) => {
  const map = new Map<string, TimelineItem[]>();
  items.forEach(i => {
    if (!map.has(i.roundId)) map.set(i.roundId, []);
    map.get(i.roundId)!.push(i);
  });
  return Array.from(map.entries()).map(([roundId, evts]) => ({ roundId, events: evts.sort((a,b)=>a.seq-b.seq) }));
};

const App: React.FC = () => {
  const [items, setItems] = useState<TimelineItem[]>([]);

  useEffect(() => {
    const loaded: TimelineItem[] = [];
    Object.entries(roundModules).forEach(([path, mod]) => {
      const data = mod as unknown as RoundFile;
      data.events.forEach(ev => {
        const cls = classify(ev);
        loaded.push({
          id: `${data.round_id}-${ev.seq}`,
            ts: ev.ts,
            roundId: data.round_id,
            type: ev.type,
            role: cls.role,
            title: cls.title,
            details: cls.details,
            seq: ev.seq
        });
      });
    });
    loaded.sort((a,b)=> new Date(a.ts).getTime() - new Date(b.ts).getTime());
    setItems(loaded);
  }, []);

  const rounds = useMemo(() => groupByRound(items), [items]);

  return (
    <div className="timeline-page">
      <header className="page-header">
        <h1>VibeGit 交互时间轴</h1>
        <p className="subtitle">开发者 与 AI Agent 的精简追踪视图 · 单页静态展示</p>
      </header>
      <main>
        {rounds.map(r => (
          <section key={r.roundId} className="round-section">
            <h2 className="round-title">回合 {r.roundId}</h2>
            <ol className="timeline">
              {r.events.map(evt => (
                <li key={evt.id} className={`timeline-item role-${evt.role.toLowerCase()}`}>
                  <div className="time-col">
                    <time>{formatTime(evt.ts)}</time>
                    <span className="seq">#{evt.seq}</span>
                  </div>
                  <div className="marker" aria-hidden="true" />
                  <div className="card">
                    <div className="meta">
                      <span className="badge role">{evt.role}</span>
                      <span className="title">{evt.title}</span>
                    </div>
                    {evt.details && (
                      <div className="details">{evt.details.split('\n').map((l,i)=>(<p key={i}>{l}</p>))}</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
        {rounds.length === 0 && <p>暂无数据</p>}
      </main>
      <footer className="page-footer">© {new Date().getFullYear()} VibeGit · Hackathon Prototype</footer>
    </div>
  );
};

export default App;
