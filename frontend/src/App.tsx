import React, { useEffect, useState, useMemo, useRef, useLayoutEffect } from 'react';
import './timeline.css';

const roundModules = import.meta.glob('../vibe/round-*.json', { eager: true });

interface RawEvent { seq: number; ts: string; type: string; content?: string; path?: string; name?: string; args_summary?: string; meta?: Record<string, unknown>; }
interface RoundFile { schema_version: string; round_id: string; session_id: string; started_at: string; ended_at: string; status: string; events: RawEvent[]; stats?: Record<string, number>; }
interface RoundSummary { roundId: string; started: string; ended: string; durationMs: number; counts: Record<string, number>; events: RawEvent[]; firstUser?: string; assistantReplyCount: number; dateStr: string; summaryLine: string; }

const pastelPalette = [
  '#ffd6e8', '#e0f7fa', '#ffe9b3', '#e8e7ff', '#d3f8d3', '#ffe2d1', '#e5f1ff', '#f8d9ff'
];

// Simple heuristic summarizer: only first user message snippet, no counts
const buildSummary = (firstUser: string | undefined): string => {
  if (firstUser) {
    const cleaned = firstUser.replace(/\s+/g,' ').trim();
    return cleaned.length > 120 ? cleaned.slice(0,120) + '…' : cleaned;
  }
  return '（无首条用户消息）';
};

const summarizeRound = (r: RoundFile): RoundSummary => {
  const counts: Record<string, number> = {};
  let firstUser: string | undefined;
  let assistantReplyCount = 0;
  r.events.forEach(ev => {
    counts[ev.type] = (counts[ev.type] || 0) + 1;
    if (ev.type === 'user_message' && !firstUser) firstUser = ev.content?.slice(0, 200);
    if (ev.type === 'assistant_message') assistantReplyCount++;
  });
  const durationMs = new Date(r.ended_at).getTime() - new Date(r.started_at).getTime();
  const d = new Date(r.started_at);
  const dateStr = d.toISOString().slice(0,10).replace(/-/g,''); // YYYYMMDD
  const summaryLine = buildSummary(firstUser);
  return { roundId: r.round_id, started: r.started_at, ended: r.ended_at, durationMs, counts, events: r.events, firstUser, assistantReplyCount, dateStr, summaryLine };
};

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const msHuman = (ms: number) => ms < 1000 ? ms + 'ms' : (ms/1000).toFixed(2) + 's';

const App: React.FC = () => {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loaded: RoundSummary[] = [];
    Object.entries(roundModules).forEach(([path, mod]) => {
      const raw: any = mod;
      const data = (raw && typeof raw === 'object' && 'default' in raw ? raw.default : raw) as RoundFile;
      if (!data || !data.round_id || !Array.isArray(data.events)) return;
      loaded.push(summarizeRound(data));
    });
    loaded.sort((a,b)=> new Date(a.started).getTime() - new Date(b.started).getTime());
    setRounds(loaded);
  }, []);

  // Recalculate axis line span after layout or expand/collapse
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const list = el.querySelector('.round-timeline.dynamic-axis');
    if (!list) return;

    const compute = () => {
      const nodes = Array.from(list.querySelectorAll('.round-node')) as HTMLElement[];
      if (!nodes.length) return;
      const firstDot = nodes[0].querySelector('.dot') as HTMLElement | null;
      const lastDot = nodes[nodes.length - 1].querySelector('.dot') as HTMLElement | null;
      if (!firstDot || !lastDot) return;
      const firstOffset = firstDot.offsetTop + firstDot.offsetHeight / 2 - (list as HTMLElement).offsetTop;
      const lastOffset = lastDot.offsetTop + lastDot.offsetHeight / 2 - (list as HTMLElement).offsetTop;
      const height = lastOffset - firstOffset;
      (list as HTMLElement).style.setProperty('--axis-start', firstOffset + 'px');
      (list as HTMLElement).style.setProperty('--axis-height', height + 'px');
    };

    compute();
    const obs = new ResizeObserver(() => compute());
    obs.observe(list as Element);
    window.addEventListener('resize', compute);
    return () => { obs.disconnect(); window.removeEventListener('resize', compute); };
  }, [rounds, open]);

  const toggle = (id: string) => setOpen(o => ({ ...o, [id]: !o[id] }));
  const total = useMemo(() => rounds.length, [rounds]);

  return (
    <div className="timeline-page pastel" ref={containerRef}>
      <header className="page-header">
        <h1>VibeGit 回合时间轴</h1>
        <p className="subtitle">每个圆点是一整个 Round · 点击展开查看事件细节 · {total || '0'} rounds</p>
      </header>
      <main>
        <ol className="round-timeline dynamic-axis">
          {rounds.map((r, idx) => {
            const color = pastelPalette[idx % pastelPalette.length];
            const isOpen = !!open[r.roundId];
            return (
              <li key={r.roundId} className={"round-node" + (isOpen ? ' open' : '')}>
                <button className="dot" style={{ background: color, boxShadow: `0 0 0 4px rgba(0,0,0,0.05)` }} onClick={() => toggle(r.roundId)} aria-expanded={isOpen}>
                  <span className="dot-label">{idx + 1}</span>
                </button>
                <div className="round-card" style={{ borderColor: color }}>
                  <div className="round-header">
                    <div className="round-meta">
                      <h2 className="round-id">{r.dateStr}：{r.summaryLine}</h2>
                      <div className="time-range">{formatTime(r.started)} → {formatTime(r.ended)} <span className="dur">({msHuman(r.durationMs)})</span></div>
                    </div>
                    <div className="actions"><button onClick={() => toggle(r.roundId)} className="toggle-btn">{isOpen ? '收起' : '展开'}</button></div>
                  </div>
                  {isOpen && (
                    <div className="events-list">
                      {r.events.map(ev => (
                        <div key={ev.seq} className={"event-row type-" + ev.type}>
                          <div className="ev-time">#{ev.seq} {formatTime(ev.ts)}</div>
                          <div className="ev-body">
                            <div className="ev-type">{ev.type}</div>
                            {ev.content && <div className="ev-text">{ev.content}</div>}
                            {ev.path && <div className="ev-path" title={ev.path}>{ev.path}</div>}
                            {ev.name && <div className="ev-tool">工具: {ev.name} {ev.args_summary && <span className="tool-args">({ev.args_summary})</span>}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {rounds.length === 0 && <p>暂无数据</p>}
      </main>
      <footer className="page-footer">© {new Date().getFullYear()} VibeGit · Hackathon Prototype</footer>
    </div>
  );
};

export default App;
