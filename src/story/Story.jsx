import React from 'react';
import { flushSync } from 'react-dom';
import '../omni/components/ConversationList.css';
import InboxIcon from '../omni/components/InboxIcon';
import { ArrowMerge } from '../icons/ArrowMerge';
import { Icon } from '../icons/Icon';
import { Avatar } from '../components/Avatar';
import { Tag } from '../components/Tag';
import { TAGS } from '../omni/data/tags';
import '../patterns/RightPanel/RightPanel.css';
import '../omni/components/BulkActionsPanel.css';
import bulkSelectIllustration from '../omni/assets/bulk-select.png';
import './story.css';

// A slideshow for the demo's intro. ← / → (or Space, PageUp / PageDown, a clicker) move between slides;
// F toggles full screen. Slides morph into each other (PowerPoint's Morph) with the View Transitions API:
// every card, ticket and title keeps one `view-transition-name` across slides, so the browser animates
// each one from where it was to where it is now; tickets that appear or leave fade in and out.

// Three emails from people at the same customer, as list cards in the product (sender shown as their email address).
const CONVOS = [
  { id: 1, from: 'adam@airbnb.com', count: 3, time: 'Feb 4, 02:45 PM', subject: 'Blank screen after login', preview: 'I am seeing a blank screen after logging in to the app.' },
  { id: 2, from: 'amy@airbnb.com', count: 2, time: 'Feb 4, 04:10 PM', subject: 'Re: Still stuck on login', preview: 'Tried reinstalling, the screen is still blank on iOS 18.' },
  { id: 3, from: 'john@airbnb.com', time: 'Feb 5, 09:20 AM', subject: 'Urgent: team can’t log in', preview: 'Three more people on my team are seeing the same issue.' },
];
// The same three in more detail (status, assignee, custom fields), plus one from another customer, for the
// slide where they're picked to merge.
// Assignees as the product's people (name, Avatar colour); tags are the product's tag values.
const DETAILED = [
  { ...CONVOS[0], status: 'open', assignee: ['Jim Halpert', 'red'], tags: ['bug', 'urgent'], fields: 'CF1 = 10, CF2 = 20' },
  { ...CONVOS[1], status: 'pending', assignee: ['Ron Swanson', 'violet'], tags: ['bug', 'vip'], fields: 'CF1 = 15, CF2 = 25' },
  { ...CONVOS[2], status: 'open', assignee: ['Andy Dwyer', 'lightBlue'], tags: ['urgent', 'billing'], fields: 'CF1 = 30, CF2 = 40' },
  { id: 4, from: 'ryan@uber.com', count: 2, time: 'Feb 5, 11:05 AM', subject: 'Can’t log in to the driver app', preview: 'Our drivers see a blank screen after signing in.', status: 'open', assignee: ['Sofia Martinez', 'purple'], tags: ['bug'], fields: 'CF1 = 5, CF2 = 8' },
];
// VIP is green in the product, which disappears on the green highlight; on the slides it takes Billing's colour.
const TAG_COLOR = { vip: TAGS.find((t) => t.value === 'billing').color };
const tagOf = (v) => {
  const t = TAGS.find((x) => x.value === v);
  return TAG_COLOR[v] ? { ...t, color: TAG_COLOR[v] } : t;
};
// The three that can merge (same customer), and what the merged ticket ends up with.
const MERGEABLE = DETAILED.slice(0, 3);
const UNKNOWN = { title: '?', status: '?', assignee: '?', tags: '?', fields: '?' };
// What the ticket takes from its base conversation.
const fromBase = (c) => ({ title: c.subject, status: c.status, assignee: c.assignee, fields: c.fields });
// Tags are a union (each once); custom fields, like Title, Status and Assignee, come from the base.
const UNION_TAGS = ['bug', 'urgent', 'vip', 'billing'];
// Adding to an existing ticket: the ticket's own values, and the conversation that joins it.
const EXISTING_ATTRS = { title: 'Login issues on web', status: 'pending', assignee: ['Emma Wilson', 'green'], tags: ['refund'], fields: 'CF1 = 50, CF2 = 60' };
const JOINING = DETAILED[2];
const STATUS_LABEL = { open: 'Open', pending: 'Pending', closed: 'Closed' };
const domainOf = (c) => c.from.split('@')[1];
// Why the picked conversations can't be merged (as the product's bulk actions say it), or null when they can.
const mergeBlocked = (picked) => {
  if (picked.length < 2) return 'Select at least two conversations to merge';
  if (new Set(picked.map(domainOf)).size > 1) return 'Cannot merge conversations from different domains';
  return null;
};

// The conversation already in the existing ticket, on the "adding" slide.
const EXISTING = { id: 5, from: 'mark@airbnb.com', time: 'Feb 3, 10:15 AM', subject: 'Login issues on web', preview: 'Some of us can’t sign in on the web app since this morning.' };
const TICKET_NAME = (n) => `TKT#${600 + n}`;
const MERGED_TICKET = 'NEW TKT#605';
const EXISTING_TICKET = 'EXISTING TKT#598';

const SINGLE = 'Single conversation → Converted to Ticket';
const MULTIPLE = 'Multiple conversations → Merged into Ticket';
const CONVO_ATTRS = 'Conversation level attributes';
const SINGLE_TICKET = 'TKT#610';
const BASE_SETS = 'The BASE conversation sets Title, Status, Assignee and custom fields';
const COMBINE = 'Tags are a union of all conversations';
const ADD_BASE = 'Adding to an EXISTING ticket – the ticket is the BASE';
const SAME_DOMAIN = 'Only conversations from the same domain can be in one ticket';
const TODAY = 'Experience today – each ticket can have only one conversation';
const STORY = 'With this story – a single ticket can have multiple conversations';
const STORY_LEAD = 'With this story – ';
const STORY_POINT = 'a single ticket can have multiple conversations';
const WAYS = ['Adding conversations into an EXISTING ticket', 'Merging multiple conversations into a NEW ticket'];
// A way (or a ticket's name, or a title), with NEW / EXISTING picked out in red and BASE in blue.
const wayText = (w) => w.split(/(NEW|EXISTING|BASE)/).map((part, i) => (i % 2 ? <span key={i} className={`story-key${part === 'BASE' ? ' story-key--base' : ''}`}>{part}</span> : part));

// layout: 'stack' (separate cards, one under another), 'row' (cards spread apart; `tickets` puts a ticket
// around each), 'single' (one ticket holding every card), 'ways' (how conversations get into one ticket),
// 'merge' (the cards; `phase` 'pile' stacks them into one pile in the middle, 'done' brings the new ticket in
// and spreads them out again inside it), 'add' (the cards scattered around an existing ticket;
// `added` moves them into it), 'select' (the conversations in detail, with one from another customer, to pick
// and merge), 'convert' (one conversation → its ticket), 'attrs' (the conversations in detail, in a row).
// `dim` fades all but the attributes.
// A `step` slide moves straight on to the next one once its morph ends (after `hold` ms), and going back skips it.
// `vt` names the slide for the morph's CSS (html[data-to]), so each slide can time its own entrance.
// `titleName` lets a slide's title morph from something else on the previous slide (one of the two ways).
const SLIDES = [
  { title: TODAY, layout: 'stack' },
  { title: TODAY, layout: 'row', step: true }, // a step on the way: the tickets come in as soon as the cards spread
  { title: TODAY, layout: 'row', tickets: true },
  { title: STORY, layout: 'stack' }, // the story's line comes in as the cards come back together
  { title: STORY, layout: 'single' },
  { title: STORY_POINT, layout: 'ways' }, // the point turns blue, the ticket leaves, and the two ways in come up
  { title: WAYS[0], titleName: 'way-1', layout: 'add', step: true, hold: 200 },
  { title: WAYS[0], titleName: 'way-1', layout: 'add', added: true, vt: 'added' },
  { title: WAYS[1], titleName: 'way-2', layout: 'merge', phase: 'cards', step: true, hold: 400 }, // 0.4s after the cards are in, they stack on their own
  { title: WAYS[1], titleName: 'way-2', layout: 'merge', phase: 'pile', step: true, hold: 260, vt: 'merge-pile' },
  { title: WAYS[1], titleName: 'way-2', layout: 'merge', phase: 'done', vt: 'merge-done' },
  // One conversation becomes a ticket: first the card alone, its attributes lit 0.5s later (one stop). Then → slides it
  // left (its highlight and caption off) as "Converted to Ticket" and an empty ticket come in; a copy of each attribute
  // row flies into the ticket (1s each, 0.5s apart); then both cards light up, then both captions show.
  { title: SINGLE, layout: 'convert', stage: 'card', step: true, hold: 500, vt: 'convert-card' },
  { title: SINGLE, layout: 'convert', stage: 'card-lit', vt: 'convert-card-lit' },
  { title: SINGLE, layout: 'convert', stage: 'card-off', step: true, hold: 100, vt: 'convert-card-off' }, // highlight off first, in place
  { title: SINGLE, layout: 'convert', stage: 'empty', step: true, hold: 300, vt: 'convert-empty' },
  { title: SINGLE, layout: 'convert', stage: 'rows', step: true, hold: 300, vt: 'convert-rows' },
  { title: SINGLE, layout: 'convert', stage: 'lit-bg', step: true, hold: 400, vt: 'convert-lit-bg' },
  { title: SINGLE, layout: 'convert', stage: 'lit', vt: 'convert-lit' },
  { title: MULTIPLE, layout: 'attrs', step: true, hold: 1000 }, // with several conversations, each has its own; 1s later their attributes light up on their own
  { title: CONVO_ATTRS, layout: 'attrs', dim: true },
  // One → plays these two: the cards stack up in the middle (attributes still lit green), then the bracket,
  // arrow and ticket come in, its attributes lit too. The next → goes to the BASE.
  // (No titles: the content sits in the middle.)
  { title: null, layout: 'resolve', stage: 'stack', step: true, hold: 200, vt: 'resolve-stack' },
  { title: null, layout: 'resolve', stage: 'gather', vt: 'resolve-gather' },
  // These two say their point above the ticket (`caption`), so the content keeps its place in the middle
  { title: null, caption: BASE_SETS, layout: 'resolve', stage: 'base' }, // first: Title, Status, Assignee and CFs from the base
  { title: null, caption: COMBINE, layout: 'resolve', stage: 'union' }, // then: tags from all three, each once
  { title: ADD_BASE, layout: 'addbase' }, // adding: the existing ticket keeps its own, like a base
  { title: ADD_BASE, layout: 'addbase', joined: true },
  // Last: the rule for both ways: one customer domain per ticket. Their domains lit, then only the airbnb.com ones go in.
  { title: SAME_DOMAIN, layout: 'domain', vt: 'domain' },
  { title: SAME_DOMAIN, layout: 'domain', joined: true, vt: 'domain-done' },
];

// `named`: the card keeps its morph name (false for copies, which move with whatever holds them).
// `ghost` keeps its space but draws nothing (once the cards have moved into the ticket). `prefix` starts its
// morph name: the adding slide uses its own cards ('add-card'), so they don't fly out of the merged ticket.
// `details` adds the conversation's status, assignee and custom fields as the product's chips; `selected` /
// `onClick` make it pickable.
// `dim` points at its fields: a band behind them, or (with `marks`) the marked rows.
// `marks` highlights some of its fields (see Fields); `badge` puts a label on its top edge (BASE).
// `domain` lights up the sender's domain ('no': in red, it can't join).
// `rows` names its attribute rows (`rows`-title, -status, ...) so they can morph on their own (fly to a ticket).
function ConvoCard({ convo, named = true, ghost, prefix = 'card', details, dim, selected, onClick, marks, badge, domain, badgeTone, rows }) {
  return (
    <div
      className={`email-card story-card${ghost ? ' is-ghost' : ''}${selected ? ' active' : ''}${onClick ? ' is-pickable' : ''}${dim ? ' is-dim' : ''}${badge === 'BASE' ? ' is-base' : ''}`}
      style={named && !ghost ? { viewTransitionName: `${prefix}-${convo.id}` } : undefined}
      onClick={onClick}
    >
      {badge && <span className={`story-badge${badgeTone ? ` story-badge--${badgeTone}` : ''}`}>{badge}</span>}
      <div className="card-header">
        <div className="card-sender-info">
          <span className="card-select"><span className="card-select__icon"><InboxIcon channel="email" /></span></span>
          <div className="sender-names">
            <span className="sender-name-primary">
              {domain ? <>{convo.from.split('@')[0]}<span className={`story-domain${domain === 'no' ? ' is-no' : ''}`}>@{convo.from.split('@')[1]}</span></> : convo.from}
            </span>
            {convo.count && <span className="thread-count">{convo.count}</span>}
          </div>
        </div>
        <span className="card-time">{convo.time}</span>
      </div>
      {/* With a Title field (in a ticket) the subject would only repeat it, so the body goes */}
      {!convo.title && (
        <div className="card-body">
          {/* The subject is what a ticket's Title comes from, so it takes the Title's mark (detailed cards always keep
              the mark's padding, so the card doesn't shift when the mark comes or goes) */}
          <div className={`subject-line${details ? ' story-subject' : ''}${marks?.title ? ` is-${marks.title}` : ''}`} style={rows ? { viewTransitionName: `${rows}-title` } : undefined}><h3 className="subject-text">{convo.subject}</h3></div>
          {/* Detailed cards drop the preview to leave room for their fields */}
          {!details && <p className="preview-text">{convo.preview}</p>}
        </div>
      )}
      {details && <Fields values={convo} marks={marks} lit={dim && !marks} rows={rows} />}
    </div>
  );
}

// A conversation's (or ticket's) Status, Assignee, Tags and Custom fields, as label – value rows.
// A value of '?' shows as an unknown. `marks` highlights rows: { status: 'base' | 'merge' | 'out', ... }
// ('base': taken from the base, 'merge': combined from all, 'out': not used).
const FIELD_ROWS = [['title', 'Title'], ['status', 'Status'], ['assignee', 'Assignee'], ['fields', 'Custom fields'], ['tags', 'Tags']];
function FieldValue({ k, v }) {
  if (v === '?') return <span className="story-unknown">?</span>;
  if (k === 'status') return <span className={`hot-rp-status-chip hot-rp-status-chip--${v}`}>{STATUS_LABEL[v]}</span>;
  if (k === 'assignee') return <><Avatar size="small" initial={v[0][0]} color={v[1]} title={v[0]} />{v[0]}</>;
  if (k === 'tags') return v.map((t) => <Tag key={t} color={tagOf(t).color}>{tagOf(t).label}</Tag>);
  return v;
}
// `lit` puts a band behind all of them (pointing at the attributes).
function Fields({ values, marks = {}, lit, rows }) {
  return (
    <div className={`story-fields${lit ? ' is-lit' : ''}`}>
      {/* Title only when there is one (a ticket's; conversations don't have their own) */}
      {FIELD_ROWS.filter(([k]) => k !== 'title' || values.title).map(([k, label]) => (
        <div key={k} className={`story-field${marks[k] ? ` is-${marks[k]}` : ''}`} style={rows ? { viewTransitionName: `${rows}-${k}` } : undefined}>
          <span className="story-field__key">{label}</span>
          <span className="story-field__value"><FieldValue k={k} v={values[k]} /></span>
        </div>
      ))}
    </div>
  );
}

// The ticket's own attributes, as a panel: [ticket icon] name, then its fields. `badge` labels it (BASE).
function TicketAttrs({ label, values, marks, badge, name = 'ticket-attrs', lit }) {
  return (
    <section className={`story-ticket story-ticket--attrs${badge === 'BASE' ? ' is-base' : ''}`} style={{ viewTransitionName: name }}>
      {badge && <span className="story-badge">{badge}</span>}
      <header className="story-ticket__head">
        <InboxIcon channel="email" ticket />
        <span className="story-ticket__title">{wayText(label)}</span>
      </header>
      <div className="story-ticket__attrs"><Fields values={values} marks={marks} lit={lit} /></div>
    </section>
  );
}

// ──> between conversations and their ticket
function Arrow({ label }) {
  return (
    <div className="story-arrow" style={{ viewTransitionName: 'resolve-arrow' }}>
      {label && <span className="story-arrow__label">{label}</span>}
      <div className="story-arrow__shaft">
        <span className="story-arrow__line" />
        <Icon name="chevronright" size={24} className="story-arrow__head" />
      </div>
    </div>
  );
}

// Pick conversations to merge: click a card to select it (blue, as in the list). Once something is picked, the
// product's bulk-actions panel comes up with the merge action, greyed out with the reason when it can't merge.
function SelectSlide() {
  const [picked, setPicked] = React.useState([]);
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const chosen = DETAILED.filter((c) => picked.includes(c.id));
  const blocked = mergeBlocked(chosen);
  return (
    <div className="story-select">
      <div className="story-stack story-stack--pick">
        {DETAILED.map((c) => <ConvoCard key={c.id} convo={c} prefix="pick-card" details selected={picked.includes(c.id)} onClick={() => toggle(c.id)} />)}
      </div>
      <div className="story-select__side">
        {chosen.length > 0 && (
          <div className="story-bulk">
            <img src={bulkSelectIllustration} alt="" width="68" height="68" />
            <p className="bulk-actions-count">{chosen.length} {chosen.length === 1 ? 'item' : 'items'} selected</p>
            <button type="button" className="bulk-action story-bulk__merge" disabled={!!blocked}>
              <ArrowMerge /><span>Merge conversations into ticket</span>
            </button>
            {blocked && <p className="story-bulk__why">{blocked}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// A ticket around its conversations. `hidden` keeps its space (so the cards sit exactly where they will
// once the ticket comes in) but draws nothing. `compact` draws it smaller (the merge and add slides);
// `copies` draws its cards as copies of the cards beside it; `ghosts` keeps their space but draws them later
// (true for all, or a list of the ones still to come); `prefix` is their morph name's start (see ConvoCard).
// `details` / `dim` pass on to its cards (and `dim` fades the ticket itself too).
function Ticket({ name, label, convos, hidden, compact, copies, ghosts, prefix, details, dim, domain, rows }) {
  const isGhost = (c) => (Array.isArray(ghosts) ? ghosts.includes(c) : !!ghosts);
  return (
    <section className={`story-ticket${hidden ? ' is-hidden' : ''}${compact ? ' story-ticket--compact' : ''}${dim ? ' is-dim' : ''}`} style={hidden ? undefined : { viewTransitionName: name }}>
      <header className="story-ticket__head">
        <InboxIcon channel="email" ticket />
        <span className="story-ticket__title">{wayText(label)}</span>
      </header>
      <div className="story-ticket__list">
        {convos.map((c) => (
          <div key={c.id} className={`email-card-wrap${isGhost(c) ? ' is-empty' : ''}`}>
            <ConvoCard convo={c} named={!copies && c !== EXISTING} ghost={isGhost(c)} prefix={prefix} details={details} dim={dim} domain={domain} rows={rows} />
          </div>
        ))}
      </div>
    </section>
  );
}

// `baseId` / `setBase`: the conversation picked as the BASE on the resolve slides (click a card to change it).
function Slide({ slide, baseId, setBase }) {
  if (slide.layout === 'stack') {
    return <div className="story-stack">{CONVOS.map((c) => <ConvoCard key={c.id} convo={c} />)}</div>;
  }
  if (slide.layout === 'row') {
    return <div className="story-row">{CONVOS.map((c) => <Ticket key={c.id} name={`ticket-${c.id}`} label={TICKET_NAME(c.id)} convos={[c]} hidden={!slide.tickets} />)}</div>;
  }
  if (slide.layout === 'ways') {
    return (
      <div className="story-ways">
        <p className="story-ways__via" style={{ viewTransitionName: 'way-via' }}>via</p>
        {/* Each way in its own box; only the words carry the morph name, so they fly up to the next slide's title
            while the box fades */}
        {WAYS.map((w, i) => (
          <div key={w} className="story-ways__box">
            <p className="story-ways__item" style={{ viewTransitionName: `way-${i + 1}` }}>{wayText(w)}</p>
          </div>
        ))}
      </div>
    );
  }
  if (slide.layout === 'merge') {
    if (slide.phase === 'cards') return <div className="story-stack">{CONVOS.map((c) => <ConvoCard key={c.id} convo={c} />)}</div>;
    // The new ticket keeps its place from the pile on (hidden at first), so the pile sits in its middle.
    const piled = slide.phase !== 'done';
    return (
      <div className="story-merge">
        <Ticket name="ticket-merged" label={MERGED_TICKET} convos={CONVOS} compact hidden={piled} ghosts={piled} />
        {piled && (
          <div className="story-pile">
            {/* In order; the CSS puts the first card on top (z-index), both here and while they move */}
            {CONVOS.map((c) => <ConvoCard key={c.id} convo={c} />)}
          </div>
        )}
      </div>
    );
  }
  if (slide.layout === 'select') return <SelectSlide />;
  if (slide.layout === 'domain') {
    // First all four stacked (domains lit); then the three airbnb.com ones in a ticket, the uber.com one left out.
    const other = DETAILED[3];
    if (!slide.joined) {
      return (
        <div className="story-stack story-stack--detail story-domain-slide">
          {[...CONVOS, other].map((c) => <ConvoCard key={c.id} convo={c} prefix="dom-card" domain="yes" />)}
        </div>
      );
    }
    return (
      <div className="story-domain-slide story-domain-slide--split">
        <Ticket name="ticket-domain" label={MERGED_TICKET} convos={CONVOS} compact prefix="dom-card" domain="yes" />
        <div className="story-domain-slide__other is-out">
          <ConvoCard convo={other} prefix="dom-card" domain="no" badge="DIFFERENT DOMAIN" badgeTone="no" />
        </div>
      </div>
    );
  }
  if (slide.layout === 'convert') {
    // [conversation]  — Converted to Ticket →  [ticket], built up step by step (see SLIDES)
    const st = slide.stage;
    const withTicket = !['card', 'card-lit', 'card-off'].includes(st);
    const filled = ['rows', 'lit-bg', 'lit'].includes(st);
    const ticketLit = st === 'lit-bg' || st === 'lit';
    return (
      <div className="story-convert">
        {/* Each side's caption shows with its highlight (kept in place, hidden, otherwise) */}
        <div className="story-convert__side">
          {/* While the ticket is empty the card's rows carry the names, so the next step flies a copy of each across */}
          {/* Its green band and caption go as → is pressed, stay off while the rows fly out, and come back with the
              ticket's once they've all landed */}
          <ConvoCard convo={DETAILED[0]} prefix="pick-card" details dim={['card-lit', 'lit-bg', 'lit'].includes(st)} rows={st === 'empty' ? 'attr' : undefined} />
          <p className={`story-convert__caption${st === 'card-lit' || st === 'lit' ? '' : ' is-hidden'}`}>CONVERSATION LEVEL ATTRIBUTES</p>
        </div>
        {withTicket && (
          <>
            <div className="story-convert__arrow" style={{ viewTransitionName: 'convert-arrow' }}>
              <span className="story-convert__line" />
              <span>Converted to Ticket</span>
              <span className="story-convert__line" />
              <Icon name="chevronright" size={24} className="story-convert__head" />
            </div>
            <div className="story-convert__side">
              {/* Empty at first (same size: its content kept, hidden), then filled by the rows flying in */}
              <Ticket
                name="ticket-single" label={SINGLE_TICKET} convos={[{ ...DETAILED[0], title: DETAILED[0].subject }]}
                compact copies details dim={ticketLit} ghosts={!filled} rows={filled ? 'attr' : undefined}
              />
              <p className={`story-convert__caption${st === 'lit' ? '' : ' is-hidden'}`}>TICKET LEVEL ATTRIBUTES</p>
            </div>
          </>
        )}
      </div>
    );
  }
  if (slide.layout === 'resolve') {
    // The three conversations that can merge, and the ticket they'd make, filling in step by step.
    const st = slide.stage;
    const base = MERGEABLE.find((c) => c.id === baseId) ?? MERGEABLE[0];
    const picking = st === 'base' || st === 'union';
    const cardMarks = (c) => {
      if (!picking) return undefined; // no marks: the whole block is lit
      const own = c === base ? 'base' : 'out';
      const single = { title: own, status: own, assignee: own, fields: own };
      return st === 'base' ? single : { ...single, tags: 'merge' };
    };
    const values = !picking ? UNKNOWN : st === 'base' ? { ...UNKNOWN, ...fromBase(base) } : { ...fromBase(base), tags: UNION_TAGS };
    const lit = st === 'stack' || st === 'gather';
    // The ticket's Title is single-value too: it comes from the base, like Status and Assignee
    const fromTheBase = { title: 'base', status: 'base', assignee: 'base', fields: 'base' };
    const marks = lit ? {} : st === 'base' ? fromTheBase : { ...fromTheBase, tags: 'merge' };
    const cards = MERGEABLE.map((c) => (
      <ConvoCard
        key={c.id} convo={c} prefix="pick-card" details dim marks={cardMarks(c)}
        badge={picking && c === base ? 'BASE' : null}
        onClick={picking && c !== base ? () => setBase(c.id) : undefined}
      />
    ));
    // First just the cards, stacked in the middle
    if (st === 'stack') return <div className="story-stack story-stack--detail">{cards}</div>;
    return (
      <div className="story-resolve">
        {/* The three cards, gathered by a bracket ──"Merged into ticket"──> the ticket */}
        <div className="story-gather">
          <div className="story-stack story-stack--detail">
            {cards}
          </div>
          <div className="story-gather__bracket" style={{ viewTransitionName: 'resolve-bracket' }} />
        </div>
        <Arrow label="Merged into ticket" />
        <div className="story-resolve__ticket">
          {slide.caption && <h2 className="story-side-title" style={{ viewTransitionName: 'side-title' }}>{wayText(slide.caption)}</h2>}
          <TicketAttrs label={MERGED_TICKET} values={values} marks={marks} lit={lit} />
        </div>
      </div>
    );
  }
  if (slide.layout === 'addbase') {
    // A conversation joins an existing ticket: the ticket keeps its Status and Assignee (it is the base);
    // the conversation's tags are added (a union); its own custom fields don't change the ticket's.
    const values = slide.joined
      ? { ...EXISTING_ATTRS, tags: [...EXISTING_ATTRS.tags, ...JOINING.tags] }
      : EXISTING_ATTRS;
    const marks = slide.joined ? { title: 'base', status: 'base', assignee: 'base', fields: 'base', tags: 'merge' } : {};
    return (
      <div className="story-resolve story-resolve--add">
        <ConvoCard convo={JOINING} prefix="join-card" details dim={slide.joined} marks={slide.joined ? { title: 'out', status: 'out', assignee: 'out', fields: 'out', tags: 'merge' } : undefined} />
        <Arrow label="Added to ticket" />
        <TicketAttrs label={EXISTING_TICKET} values={values} marks={marks} badge="BASE" name="ticket-existing-attrs" />
      </div>
    );
  }
  if (slide.layout === 'attrs') {
    // Only the three from the same customer (the other customer's comes in on the pick slide)
    return <div className="story-row">{MERGEABLE.map((c) => <ConvoCard key={c.id} convo={c} prefix="pick-card" details dim={slide.dim} />)}</div>;
  }
  if (slide.layout === 'add') {
    // The existing ticket in the middle, the three conversations scattered around it; `added` moves them in.
    return (
      <div className="story-scatter">
        <div className="story-scatter__ticket">
          {/* Already as tall as it will be with all three in: their places wait empty until they arrive */}
          <Ticket name="ticket-existing" label={EXISTING_TICKET} convos={[EXISTING, ...CONVOS]} ghosts={slide.added ? [] : CONVOS} compact prefix="add-card" />
        </div>
        {!slide.added && CONVOS.map((c, i) => (
          <div key={c.id} className={`story-scatter__spot story-scatter__spot--${i + 1}`}><ConvoCard convo={c} prefix="add-card" /></div>
        ))}
      </div>
    );
  }
  return <div className="story-row"><Ticket name="ticket-1" label={TICKET_NAME(1)} convos={CONVOS} /></div>;
}

// The slides are laid out on a 1600×900 stage, scaled to fill the window.
const STAGE_W = 1600;
const STAGE_H = 900;
const useStageScale = () => {
  const fit = () => Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
  const [scale, setScale] = React.useState(fit);
  React.useEffect(() => {
    const onResize = () => setScale(fit());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
};

export default function Story() {
  const [index, setIndex] = React.useState(0);
  const [baseId, setBaseId] = React.useState(MERGEABLE[0].id);
  // Picking another BASE morphs too: the badge, the marks and the ticket's values move over.
  const setBase = React.useCallback((id) => {
    if (!document.startViewTransition) { setBaseId(id); return; }
    document.documentElement.dataset.to = 'rebase';
    document.startViewTransition(() => flushSync(() => setBaseId(id)));
  }, []);
  const scale = useStageScale();
  // Moving on. A press while something is still playing doesn't wait: what's playing is cut short (the slide
  // jumps to where it was heading) and the next move starts at once, so pressing fast skips through slides.
  const shown = React.useRef(0); // the slide on screen, or about to be
  const stop = React.useRef(0); // the slide the current move ends on (after any steps it plays through)
  const playing = React.useRef(null); // the running morph
  const run = React.useRef(0); // bumped to cancel a move's remaining steps
  const busy = React.useRef(false);

  const show = React.useCallback((next) => {
    document.documentElement.dataset.to = SLIDES[next].vt ?? SLIDES[next].layout;
    shown.current = next;
    if (!document.startViewTransition) { setIndex(next); return Promise.resolve(); }
    // Reads `shown` when it runs, so a morph cut short never puts back an older slide
    const t = document.startViewTransition(() => flushSync(() => setIndex(shown.current)));
    playing.current = t;
    return t.finished.catch(() => {});
  }, []);

  const go = React.useCallback((dir) => {
    if (busy.current) {
      run.current += 1;
      playing.current?.skipTransition();
      if (shown.current !== stop.current) { shown.current = stop.current; flushSync(() => setIndex(stop.current)); }
      busy.current = false;
    }
    let next = stop.current + dir;
    if (dir < 0) while (SLIDES[next]?.step) next -= 1; // back skips the in-between steps
    if (next < 0 || next >= SLIDES.length) return;
    let end = next;
    while (SLIDES[end].step && end + 1 < SLIDES.length) end += 1;
    stop.current = end;
    busy.current = true;
    const mine = ++run.current;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const play = async (i) => {
      await show(i);
      if (mine !== run.current) return;
      if (i < end) { await wait(SLIDES[i].hold ?? 0); if (mine !== run.current) return; return play(i + 1); }
      busy.current = false;
    };
    play(next);
  }, [show]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go(1); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go(-1); }
      else if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const slide = SLIDES[index];
  return (
    <div className="story">
      <div className={`story-stage${slide.title ? '' : ' story-stage--untitled'}`} style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
        {slide.title && <h1 className="story-title" style={{ viewTransitionName: slide.titleName ?? 'title' }}>
          {/* The lead and the point morph on their own: on the "via" slide the lead fades away and the point
              slides over to the centre */}
          {slide.title === STORY && <><span className="story-title__lead" style={{ viewTransitionName: 'title-lead' }}>{STORY_LEAD.trim()}</span>{' '}<span className="story-title__point" style={{ viewTransitionName: 'title-point' }}>{STORY_POINT}</span></>}
          {slide.title === STORY_POINT && <span className="story-title__point is-on" style={{ viewTransitionName: 'title-point' }}>{STORY_POINT[0].toUpperCase() + STORY_POINT.slice(1)}</span>}
          {WAYS.includes(slide.title) && wayText(slide.title)}
          {slide.title !== STORY && slide.title !== STORY_POINT && !WAYS.includes(slide.title) && slide.title}
        </h1>}
        <Slide slide={slide} baseId={baseId} setBase={setBase} />
      </div>
      {/* One dot per stop: steps count with the slide they lead to */}
      <div className="story-progress">
        {SLIDES.map((sl, i) => (sl.step ? null : <span key={i} className={i === index || (SLIDES[index].step && i === index + 1) ? 'is-on' : ''} />))}
      </div>
    </div>
  );
}
