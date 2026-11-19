import React from 'react';
import { Checkbox } from '../components/Checkbox';
import { Button } from '../components/Button';
import './flows.css';

// The demo's run sheet: tick each flow off as it's shown. Ticks are kept in this browser (localStorage), so coming
// back to the tab after a flow finds them as they were. A flow with steps can only be ticked once all its steps are.

const FLOWS = [
  { id: 'merge', title: 'Bulk actions → Merge' },
  {
    id: 'post', title: 'Post-merge',
    steps: [
      { id: 'tabs', title: 'Overview vs conversation tabs, unread dot, FRT ⚡ per conversation, More' },
      { id: 'sla', title: 'SLA: FRT • 2 and RT on the list card; RT on the ticket, FRT per conversation in the right panel' },
      { id: 'notes', title: 'Notes: on the ticket (shows everywhere) vs on a conversation (stays there)' },
      { id: 'activity', title: 'Right-panel changes show as activity in every tab' },
      { id: 'slack', title: 'Slack pills per conversation' },
    ],
  },
  { id: 'bulk-add', title: 'Bulk actions → Add to ticket' },
  { id: 'convo-add', title: 'Conversation → Add to existing ticket' },
  { id: 'ticket-add', title: 'Ticket → Add conversation' },
];

const KEY = 'tam-demo-flows';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; } };
const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* no storage: ticks last for this visit */ } };

export default function Flows() {
  const [done, setDone] = React.useState(load);
  const set = (next) => { setDone(next); save(next); };
  const toggle = (id, on) => set({ ...done, [id]: on });
  const stepsDone = (f) => f.steps.every((s) => done[`${f.id}.${s.id}`]);
  // Ticking the last step ticks its flow; unticking any step unticks it
  const toggleStep = (f, s, on) => {
    const next = { ...done, [`${f.id}.${s.id}`]: on };
    next[f.id] = f.steps.every((x) => next[`${f.id}.${x.id}`]);
    set(next);
  };

  const total = FLOWS.length;
  const finished = FLOWS.filter((f) => done[f.id]).length;

  return (
    <main className="flows">
      <header className="flows__head">
        <p className="flows__count">{finished} of {total} done</p>
        <Button variant="secondary" size="sm" onClick={() => set({})} disabled={!Object.values(done).some(Boolean)}>Reset</Button>
      </header>
      <ol className="flows__list">
        {FLOWS.map((f) => {
          const locked = f.steps && !stepsDone(f);
          return (
            <li key={f.id} className={`flows__item${done[f.id] ? ' is-done' : ''}`}>
              <div className="flows__row">
                <Checkbox
                  checked={!!done[f.id]}
                  disabled={locked}
                  onChange={(e) => toggle(f.id, e.target.checked)}
                  label={<span className="flows__label">{f.title}</span>}
                />
              </div>
              {f.steps && (
                <ul className="flows__steps">
                  {f.steps.map((s) => (
                    <li key={s.id} className={`flows__step${done[`${f.id}.${s.id}`] ? ' is-done' : ''}`}>
                      <Checkbox
                        checked={!!done[`${f.id}.${s.id}`]}
                        onChange={(e) => toggleStep(f, s, e.target.checked)}
                        label={<span className="flows__label">{s.title}</span>}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
