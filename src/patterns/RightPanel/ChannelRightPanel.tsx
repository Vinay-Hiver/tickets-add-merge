import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { Input } from '../../components/Input'
import { Tooltip } from '../../components/Tooltip'
import { Tag } from '../../components/Tag'
import { Icon } from '../../icons/Icon'
import { MessagePlusSquare } from '../../icons/MessagePlusSquare'
import type { IconName } from '../../icons/iconData'
import { RightPanel, RightPanelSection, RightPanelTop } from './RightPanel'
import { ActivityNotes } from './ActivityNotes'
import type { ActivityDay } from './ActivityNotes'
import { AssigneeField, StatusField, TagsField } from './FieldSelects'
import type { TagOption } from './FieldSelects'
import { customFieldKinds, getChannel, sampleAssignees, samples, statusOptions } from './data'
import type { ChannelId, ChannelSample, FieldDef, FieldKind, ResolvedSection } from './data'

/** A row: [icon] [label] ...space... [value]. Same markup as the storybook right panel (see sampleData.tsx). */
function Row({ icon, label, children, link }: { icon: IconName; label: string; children?: React.ReactNode; link?: boolean }) {
  return (
    <div className="hot-rp-field">
      <div className="hot-rp-field__label"><Icon name={icon} size={14} /><span>{label}</span></div>
      <div className={`hot-rp-field__value${link ? ' hot-rp-field__value--link' : ''}`}>{children}</div>
    </div>
  )
}

const redAvatar = { '--avatar-bg': 'var(--pastelRedSurfaceDefault)' } as CSSProperties

const customFieldIcon = (kind: FieldKind): IconName => {
  if (kind === 'dropdown') return customFieldKinds.dropdown.icon
  if (kind === 'dateInput') return customFieldKinds.date.icon
  if (kind === 'number') return customFieldKinds.number.icon
  return customFieldKinds.text.icon
}

function FieldValue({ def, sample, empty }: { def: FieldDef; sample: ChannelSample; empty: string }) {
  const value = sample.values[def.id]
  if (def.kind === 'avatarText' && value !== undefined) return <><Avatar initial={String(value).charAt(0).toUpperCase()} size="small" style={redAvatar} /><span style={{ marginLeft: 4 }}>{value}</span></>
  if (value === undefined) return <>{def.placeholder ?? empty}</>
  return <>{value}</>
}

function SectionRows({ section, sample }: { section: ResolvedSection; sample: ChannelSample }) {
  if (section.type === 'customFields') {
    const rows = sample.customFields ?? []
    return <>{rows.map((r) => <Row key={r.label} icon={customFieldIcon(r.kind)} label={r.label}>{r.value ?? r.placeholder ?? section.emptyValue}</Row>)}</>
  }
  if (section.type === 'list') {
    const items = sample.previousConversations ?? []
    if (items.length === 0) return <div className="hot-rp-field"><div className="hot-rp-field__label" style={{ width: 'auto' }}>{section.emptyListText}</div></div>
    return <>{items.map((c, i) => <Row key={i} icon="conversation" label={c.from}>{c.preview} · {c.date}</Row>)}</>
  }
  if (section.type === 'notes') return <Row icon="note" label="Notes">Add a note</Row>
  if (section.type === 'activity') {
    const day = sample.activity?.[0]
    return <ActivityNotes days={day ? [{ day: day.day, events: day.items.map((a) => ({ icon: /ticket/i.test(a.text) ? 'ticket' : 'user', text: a.text, time: a.time })) }] : []} />
  }
  return <>{section.fields.map((f) => <Row key={f.id} icon={f.icon} label={f.label} link={f.kind === 'countLink'}><FieldValue def={f} sample={sample} empty={section.emptyValue} /></Row>)}</>
}

/** A custom field on the conversation, with its current value (leave `value` out when it is empty). */
export type CustomFieldValue = { id: string; label: string; kind: 'text' | 'number'; value?: string }

/**
 * A custom field's value. Hovering shows the grey hover fill; clicking turns it into a text box.
 * Enter or leaving the box saves, Escape drops the change. Number fields only take digits and one decimal point.
 */
function EditableFieldValue({ field, empty, onChange }: { field: CustomFieldValue; empty: string; onChange: (value: string | undefined) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const cancelled = useRef(false)

  const start = () => { cancelled.current = false; setDraft(field.value ?? ''); setEditing(true) }
  const commit = () => {
    setEditing(false)
    if (cancelled.current) return
    const next = draft.trim()
    if (next !== (field.value ?? '')) onChange(next || undefined)
  }
  const clean = (text: string) => (field.kind === 'number' ? text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') : text)

  if (editing) {
    return (
      <div className="hot-rp-cf-edit">
        <Input
          size="sm" fullWidth autoFocus value={draft} aria-label={field.label}
          inputMode={field.kind === 'number' ? 'decimal' : undefined}
          placeholder={field.kind === 'number' ? 'Enter a number' : 'Enter text'}
          onChange={(e) => setDraft(clean(e.target.value))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') { cancelled.current = true; e.currentTarget.blur() }
          }}
        />
      </div>
    )
  }
  return (
    <button type="button" className="hot-rp-field__value hot-rp-cf-value" aria-label={`Edit ${field.label}`} onClick={start}>
      {field.value ? <span className="hot-rp-cf-value__text">{field.value}</span> : <span className="hot-rp-cf-value__empty">{empty}</span>}
    </button>
  )
}

/** The Custom fields section with editable values, laid out like every other section. */
function customFieldsSection(section: ResolvedSection, fields: CustomFieldValue[], conversationId: string | undefined, onChange: (fieldId: string, value: string | undefined) => void) {
  return (
    <RightPanelSection key={section.id} id={section.id} title={section.title} icon={section.icon} defaultExpanded>
      {fields.map((f) => (
        <div key={f.id} className="hot-rp-field">
          <div className="hot-rp-field__label"><Icon name={customFieldIcon(f.kind)} size={14} /><span className="hot-rp-cf-label">{f.label}</span></div>
          <EditableFieldValue key={`${conversationId}-${f.id}`} field={f} empty={section.emptyValue} onChange={(v) => onChange(f.id, v)} />
        </div>
      ))}
    </RightPanelSection>
  )
}

/**
 * The Linked conversations section, with the omni-boilerplate content in the storybook section layout.
 * Called as a function, not used as <Component />: the panel only sorts children that are RightPanelSection elements.
 */
/** How many linked conversations the section shows before "View all". */
const LINKED_PREVIEW_COUNT = 2

/** A conversation shown in the Linked conversations section. */
export type LinkedConversation = {
  id: string
  name: string
  /** The subject line (an email's subject, or the first message for chat-style channels). */
  subject: string
  /** Tickets: the ticket ID, shown in bold before the subject. */
  ticketId?: string
  date: string
  status: 'open' | 'pending' | 'closed'
  /** The person it is assigned to. Leave out when it is unassigned. */
  assignee?: string
  inbox: string
  /** The channel icon (14 or 16px icon name). */
  icon: IconName
  /** The viewer is not a member of this conversation's inbox, so the subject is blurred. */
  restricted?: boolean
  /** The card can be clicked to open the conversation. */
  openable?: boolean
}

const STATUS_LABEL = { open: 'Open', pending: 'Pending', closed: 'Closed' } as const

/**
 * A linked conversation card (Figma: Delete › 6011:39404):
 * [channel icon] name ... date, time
 * subject
 * [status] [assignee] [channel icon inbox]
 */
export function LinkedConversationCard({ conversation: c, onUnlink: unlinkHandler, onOpen: openHandler }: {
  conversation: LinkedConversation
  onUnlink?: (id: string) => void
  /** Opens the conversation (in the conversation viewer). Leave out when it cannot be opened. */
  onOpen?: (id: string) => void
}) {
  // A conversation from an inbox the viewer is not part of cannot be unlinked or opened by them.
  const onUnlink = c.restricted ? undefined : unlinkHandler
  const onOpen = c.restricted ? undefined : openHandler
  const card = (
    <div
      className={`hot-rp-linked-card${onUnlink ? ' hot-rp-linked-card--unlinkable' : ''}${c.restricted ? ' hot-rp-linked-card--restricted' : ''}${onOpen ? ' hot-rp-linked-card--openable' : ''}`}
      tabIndex={c.restricted || onOpen ? 0 : undefined}
      role={onOpen ? 'button' : undefined}
      aria-label={onOpen ? `Open conversation with ${c.name}: ${c.subject}` : undefined}
      onClick={onOpen ? () => onOpen(c.id) : undefined}
      onKeyDown={onOpen ? (e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(c.id) } } : undefined}
    >
      <div className="hot-rp-linked-card__top">
        <span className="hot-rp-linked-card__who">
          <Icon name={c.icon} size={16} />
          <span className="hot-rp-linked-card__name">{c.name}</span>
        </span>
        <span className="hot-rp-linked-card__end">
          {c.restricted
            ? <span className="hot-rp-linked-card__date hot-rp-blurred" aria-hidden="true">{c.date}</span>
            : <span className="hot-rp-linked-card__date">{c.date}</span>}
          {/* On hover the unlink button replaces the date; the card keeps its height. */}
          {onUnlink && (
            <span className="hot-rp-linked-card__unlink">
              <Tooltip content="Unlink conversation" placement="left">
                <Button iconOnly variant="secondary" size="xs" aria-label={`Unlink conversation with ${c.name}`} onClick={(e) => { e.stopPropagation(); onUnlink(c.id) }}>
                  <Icon name="brokenlink" size={14} />
                </Button>
              </Tooltip>
            </span>
          )}
        </span>
      </div>
      {c.restricted ? (
        <div className="hot-rp-linked-card__subject">
          <span className="hot-rp-blurred" aria-hidden="true">{c.ticketId ? `${c.ticketId} ` : ''}{c.subject}</span>
          <span className="hot-rp-visually-hidden">Hidden: you don't have access to this conversation</span>
        </div>
      ) : (
        <div className="hot-rp-linked-card__subject" title={c.ticketId ? `${c.ticketId} ${c.subject}` : c.subject}>
          {c.ticketId && <strong className="hot-rp-linked-card__ticket">{c.ticketId}</strong>}{c.subject}
        </div>
      )}
      <div className="hot-rp-linked-card__chips">
        <span className={`hot-rp-status-chip hot-rp-status-chip--${c.status}`}>{STATUS_LABEL[c.status]}</span>
        {c.assignee && <span className="hot-rp-chip"><Icon name="user" size={14} /><span>{c.assignee}</span></span>}
        <span className="hot-rp-chip hot-rp-chip--shrink" title={c.restricted ? undefined : c.inbox}><Icon name={c.icon} size={14} /><span>{c.inbox}</span></span>
      </div>
    </div>
  )
  // Hovering (or focusing) a blurred card explains why it is hidden.
  return c.restricted ? (
    <div className="hot-rp-linked-card-tip">
      <Tooltip content="You don't have access to this conversation" placement="top" portal>{card}</Tooltip>
    </div>
  ) : card
}

function linkedConversationsSection(linked: LinkedConversation[], onLinkClick?: () => void, onViewAll?: () => void, onUnlink?: (id: string) => void, onOpen?: (id: string) => void) {
  return (
    <RightPanelSection key="linked" id="linked" title="Linked conversations" icon={<MessagePlusSquare />} defaultExpanded={false}>
      {/* paddingTop matches the section's 16px bottom padding, so the content sits evenly between header and edge. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', paddingTop: 16 }}>
        {/* No Link button when linking is not offered (for example inside the conversation viewer) */}
        {onLinkClick && <Button variant="secondary-filled" size="sm" style={{ width: '100%' }} onClick={onLinkClick}>Link</Button>}
        {linked.length === 0 ? (
          <p style={{ margin: 0, font: 'var(--fontWeightRegular) 14px/20px var(--fontFamily)', color: 'var(--slateTextSubtle)' }}>
            Link and track related conversations from one place for faster context and resolutions.
          </p>
        ) : (
          <>
            {linked.slice(0, LINKED_PREVIEW_COUNT).map((c) => <LinkedConversationCard key={c.id} conversation={c} onUnlink={onUnlink} onOpen={c.openable ? onOpen : undefined} />)}
            {linked.length > LINKED_PREVIEW_COUNT && (
              <button type="button" className="hot-rp-view-all" onClick={onViewAll}>View all</button>
            )}
          </>
        )}
      </div>
    </RightPanelSection>
  )
}

/** Sections this prototype leaves out of every channel's panel. */
const HIDDEN_SECTIONS = ['conversation', 'customFields']

/**
 * A ticket (an email conversation turned into a ticket) uses the Email panel with changes
 * (Figma: Delete › 6018:50493): the top section adds Ticket ID, and the only sub-sections are
 * Linked conversations, Activity & Notes and Custom fields. Plain emails do not show Ticket ID.
 */
const TICKET_SECTIONS = ['activity', 'customFields']

/** The storybook right panel for one channel: its tab, top section, sub-sections in order and "Customize widgets". */
export function ChannelRightPanel({ channel, inboxName, unassigned, conversationId, ticketId, assignee, onAssigneeChange, status, onStatusChange, tagOptions, tags, onTagsChange, customFields, onCustomFieldChange, onLinkClick, linkedConversations = [], onViewAll, onUnlink, onOpenConversation }: {
  channel: ChannelId
  /** Email only: the conversation is a ticket with this ID, so the panel uses the ticket layout. */
  ticketId?: string
  /** The conversation's assignee (`none` when unassigned), when the caller keeps it. Leave out to let the field manage itself. */
  assignee?: string
  onAssigneeChange?: (value: string) => void
  /** The conversation's status, when the caller keeps it (one value per conversation). */
  status?: 'open' | 'pending' | 'closed'
  onStatusChange?: (value: 'open' | 'pending' | 'closed') => void
  /** With `tags` and `onTagsChange`: the tags that can be added, so the Tags field can be edited. */
  tagOptions?: TagOption[]
  tags?: string[]
  onTagsChange?: (value: string[]) => void
  /** With `onCustomFieldChange`: the conversation's custom fields, shown as an editable Custom fields section. */
  customFields?: CustomFieldValue[]
  onCustomFieldChange?: (fieldId: string, value: string | undefined) => void
  inboxName?: string
  /** The conversation is in an Unassigned view, so the Assignee starts at None. */
  unassigned?: boolean
  /** The selected conversation, so the Assignee resets when another one is picked. */
  conversationId?: string
  /** Called when "Link" is pressed in the Linked conversations section. */
  onLinkClick?: () => void
  /** The conversations linked to this one, shown as cards under the Link button. */
  linkedConversations?: LinkedConversation[]
  /** Called when "View all" is pressed (more than two linked conversations). */
  onViewAll?: () => void
  /** Called with a linked conversation's id when its unlink button is pressed. */
  onUnlink?: (id: string) => void
  /** Called with a linked conversation's id when its card is clicked (only for cards marked `openable`). */
  onOpenConversation?: (id: string) => void
}) {
  const def = getChannel(channel)
  const sample = samples[channel]
  const isTicket = channel === 'email' && !!ticketId
  const editableCustomFields = !!customFields && !!onCustomFieldChange
  // Linked conversations sits after the field sections, before lists, notes and activity (the omni-boilerplate order).
  // A ticket shows Linked conversations first, then Activity & Notes, then Custom fields.
  const shown = isTicket
    ? TICKET_SECTIONS.map((id) => def.sections.find((s) => s.id === id)).filter((s): s is ResolvedSection => !!s)
    : def.sections.filter((s) => !HIDDEN_SECTIONS.includes(s.id) || (s.id === 'customFields' && editableCustomFields))
  const at = isTicket ? 0 : shown.findIndex((s) => s.type === 'list' || s.type === 'notes' || s.type === 'activity')
  const sections: (ResolvedSection | 'linked')[] = [...shown]
  sections.splice(at === -1 ? shown.length : at, 0, 'linked')
  const topFields = def.top.fields.filter((f) => f.id !== 'ticketId' || isTicket)
  return (
    <RightPanel key={isTicket ? 'ticket' : channel} aria-label="Details" tabs={def.tabs} customizeWidgets={def.footer.some((f) => f.id === 'customizeWidgets')}>
      <RightPanelTop title={inboxName ?? sample.inboxName}>
        {topFields.map((f) => {
          if (f.kind === 'assignee') return <AssigneeField key={`${f.id}-${conversationId}-${unassigned}`} value={assignee} onChange={onAssigneeChange} defaultValue={unassigned ? 'none' : undefined} />
          if (f.kind === 'status') return <StatusField key={`${f.id}-${conversationId}`} value={status} onChange={onStatusChange} />
          if (f.id === 'ticketId') return <Row key={f.id} icon="ticket" label={f.label}><span className="hot-rp-ticket-id">{ticketId}</span></Row>
          if (f.kind === 'tags' && tagOptions && tags && onTagsChange) return <TagsField key={`${f.id}-${conversationId}`} options={tagOptions} value={tags} onChange={onTagsChange} />
          if (f.kind === 'tags') return (
            <Row key={f.id} icon={f.icon} label={f.label}>
              <Tag color="violet" onRemove={() => {}} removeLabel="Remove Finance">Finance</Tag>
              {/* Temporary, as in the storybook: a clickable "Add" chip is not built, so a Tag sits inside a plain button. */}
              <button type="button" aria-label="Add tag" style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer' }}>
                <Tag iconLeft={<Icon name="add" size={14} />}>Add</Tag>
              </button>
            </Row>
          )
          return <Row key={f.id} icon={f.icon} label={f.label}>{sample.values[f.id] ?? '-'}</Row>
        })}
      </RightPanelTop>
      {sections.map((s) => s === 'linked' ? linkedConversationsSection(linkedConversations, onLinkClick, onViewAll, onUnlink, onOpenConversation)
        : s.id === 'customFields' && customFields && onCustomFieldChange ? customFieldsSection(s, customFields, conversationId, onCustomFieldChange) : (
        // Every section starts closed; only Custom fields starts open.
        <RightPanelSection key={s.id} id={s.id} title={s.title} icon={s.icon} defaultExpanded={false}>
          <SectionRows section={s} sample={sample} />
        </RightPanelSection>
      ))}
    </RightPanel>
  )
}

/** A merged ticket's customer account, from the conversations' email domain. */
export type TicketAccount = { name: string; domain: string; contacts: number; conversations: number }

/** One conversation inside a merged ticket, shown under the ticket in that conversation's tab. */
export type TicketConversation = {
  subject: string
  /** The conversation's own assignee and status from before it joined the ticket: history only, shown faded. */
  assignee: string
  status: 'open' | 'pending' | 'closed'
  contact: { name: string; email: string; account: string; conversations: number }
  activity: ActivityDay[]
}

/**
 * The right panel inside a merged ticket (Figma: Tickets Add/Merge › 4028:18692 and 4028:18693). The ticket's own
 * values come first and stay editable: Ticket ID, Assignee, Status, Tags, Custom fields and Account details.
 * In a conversation's tab, that conversation follows: its subject with its old assignee and status (read-only), then
 * its Contact and Activity & Notes.
 */
export function TicketRightPanel({ inboxName, ticketId, ticketKey, assignee, onAssigneeChange, status, onStatusChange, tagOptions, tags, onTagsChange, customFields, onCustomFieldChange, account, conversation }: {
  inboxName: string
  ticketId: string
  /** The ticket's id, so the fields reset when another ticket opens. */
  ticketKey: string
  assignee: string
  onAssigneeChange: (value: string) => void
  status: 'open' | 'pending' | 'closed'
  onStatusChange: (value: 'open' | 'pending' | 'closed') => void
  tagOptions: TagOption[]
  tags: string[]
  onTagsChange: (value: string[]) => void
  customFields: CustomFieldValue[]
  onCustomFieldChange: (fieldId: string, value: string | undefined) => void
  account: TicketAccount
  /** Set in a conversation's tab; left out in the Overview. */
  conversation?: TicketConversation
}) {
  const def = getChannel('email')
  const cfSection = def.sections.find((s) => s.id === 'customFields')
  const person = conversation && sampleAssignees.find((p) => p.value === conversation.assignee)
  const oldStatus = conversation && (statusOptions.find((o) => o.value === conversation.status) ?? statusOptions[0])

  // In a conversation's tab, the conversation is the panel's second group: Customize widgets lists its sections under
  // "Conversation", after the ticket's under "Ticket".
  const conversationGroup = conversation && {
    title: 'Conversation',
    heading: (
      <section className="hot-rp-top hot-rp-top--conversation">
        <h2 className="hot-rp-top__title hot-rp-top__title--truncate" title={conversation.subject}>{conversation.subject}</h2>
        <div className="hot-rp-fields">
          {/* The values are history: hovering one explains why, in a tooltip to the value's left */}
          <Row icon="assigned" label="Assignee">
            <Tooltip content="Assignee is managed on the ticket now. Change it above." placement="left" portal>
              <span className="hot-rp-history" tabIndex={0}>
                {person ? <><Avatar initial={person.label.charAt(0)} size="small" color={person.color} showStatus />{person.label.replace(/ \(Me\)$/, '')}</> : 'None'}
              </span>
            </Tooltip>
          </Row>
          <Row icon="flag" label="Status">
            <Tooltip content="Status is managed on the ticket now. Change it above." placement="left" portal>
              <span className="hot-rp-history" tabIndex={0}>{oldStatus && <Icon name={oldStatus.icon} size={16} />}{oldStatus?.label}</span>
            </Tooltip>
          </Row>
        </div>
      </section>
    ),
    sections: [
      <RightPanelSection key="ticketContact" id="ticketContact" title="Contact" icon="contact" defaultExpanded>
        <Row icon="user" label="Name">{conversation.contact.name}</Row>
        <Row icon="mailbox" label="Email">{conversation.contact.email}</Row>
        <Row icon="building" label="Account">{conversation.contact.account}</Row>
        <Row icon="previousconversations" label="Conversations" link>{conversation.contact.conversations}</Row>
      </RightPanelSection>,
      <RightPanelSection key="ticketActivity" id="ticketActivity" title="Activity & Notes" icon="clock" defaultExpanded>
        <ActivityNotes days={conversation.activity} />
      </RightPanelSection>,
    ],
  }

  return (
    <RightPanel key={`ticket-${ticketKey}`} aria-label="Ticket details" tabs={def.tabs} customizeWidgets title="Ticket" secondary={conversationGroup || undefined}>
      <RightPanelTop title={inboxName}>
        <Row icon="ticket" label="Ticket ID"><span className="hot-rp-ticket-id">{ticketId}</span></Row>
        <AssigneeField key={`assignee-${ticketKey}`} value={assignee} onChange={onAssigneeChange} />
        <StatusField key={`status-${ticketKey}`} value={status} onChange={onStatusChange} />
        <TagsField key={`tags-${ticketKey}`} options={tagOptions} value={tags} onChange={onTagsChange} />
      </RightPanelTop>
      {cfSection && customFieldsSection(cfSection, customFields, ticketKey, onCustomFieldChange)}
      <RightPanelSection key="ticketAccount" id="ticketAccount" title="Account details" icon="building" defaultExpanded>
        <Row icon="building" label="Account">{account.name}</Row>
        <Row icon="domain" label="Domain">{account.domain}</Row>
        <Row icon="contact" label="Contacts">{account.contacts}</Row>
        <Row icon="previousconversations" label="Conversations" link>{account.conversations}</Row>
      </RightPanelSection>
    </RightPanel>
  )
}

/** Replaces the right panel after "View all": a back arrow, the Link button, then every linked conversation. */
export function LinkedConversationsView({ linked, onBack, onLinkClick, onUnlink, onOpenConversation }: {
  linked: LinkedConversation[]
  onBack: () => void
  onLinkClick?: () => void
  onUnlink?: (id: string) => void
  onOpenConversation?: (id: string) => void
}) {
  return (
    <aside className="hot-right-panel" aria-label="Linked conversations">
      <div className="hot-rp-linked-view__header">
        <Button iconOnly variant="ghost" size="sm" aria-label="Back" onClick={onBack}>
          <Icon name="arrowback" size={16} />
        </Button>
        <h2 className="hot-rp-linked-view__title">Linked conversations</h2>
      </div>
      <div className="hot-rp-linked-view__body">
        {onLinkClick && <Button variant="secondary-filled" size="sm" style={{ width: '100%', flex: 'none' }} onClick={onLinkClick}>Link</Button>}
        {linked.map((c) => <LinkedConversationCard key={c.id} conversation={c} onUnlink={onUnlink} onOpen={c.openable ? onOpenConversation : undefined} />)}
      </div>
    </aside>
  )
}
